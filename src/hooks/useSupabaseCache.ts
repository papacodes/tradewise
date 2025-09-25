import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { monitorAsyncOperation, cacheHealthMonitor } from '../utils/cacheHealthMonitor';
import { cacheCorruptionDetector } from '../utils/cacheCorruptionDetector';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number;
  timeout?: number; // Operation timeout in milliseconds
  retryAttempts?: number; // Number of retry attempts
  retryDelay?: number; // Base delay between retries in milliseconds
}

interface UseSupabaseCacheResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

type QueryFunction<T> = () => Promise<{ data: T | null; error: Error | null }>;

// In-memory cache store
const cache = new Map<string, CacheEntry<unknown>>();
const MAX_CACHE_SIZE = 100;

// Cache utilities
// Top-level helper
const generateCacheKey = (table: string, filters: Record<string, unknown> = {}): string => {
  const filterString = Object.keys(filters)
    .sort()
    .map(key => {
      const value = (filters as any)[key];
      const normalized = Array.isArray(value) ? [...value].sort() : value;
      return `${key}:${JSON.stringify(normalized)}`;
    })
    .join('|');
  return `${table}${filterString ? `_${filterString}` : ''}`;
};

const isStale = (entry: CacheEntry<unknown>): boolean => {
  return Date.now() - entry.timestamp > entry.ttl;
};

const evictOldestEntries = (): void => {
  if (cache.size >= MAX_CACHE_SIZE) {
    const entries = Array.from(cache.entries());
    entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);
    const toRemove = entries.slice(0, Math.floor(MAX_CACHE_SIZE * 0.2));
    toRemove.forEach(([key]) => cache.delete(key));
  }
};

const setCacheEntry = <T>(key: string, data: T, ttl: number): void => {
  evictOldestEntries();
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
};

const getCacheEntry = <T>(key: string): CacheEntry<T> | null => {
  return (cache.get(key) as CacheEntry<T>) || null;
};

const invalidateCacheEntry = (key: string): void => {
  cache.delete(key);
};

// Global cache invalidation by pattern
export const invalidateCacheByPattern = (pattern: string): void => {
  const keysToDelete: string[] = [];
  const allKeys = Array.from(cache.keys());
  
  for (const key of allKeys) {
    let shouldDelete = false;
    
    // Handle different wildcard patterns
    if (pattern.startsWith('*') && pattern.endsWith('*')) {
      // Pattern like *userId:"..."* - check if key contains the middle part
      const middlePart = pattern.slice(1, -1);
      shouldDelete = key.includes(middlePart);
    } else if (pattern.endsWith('*')) {
      // Pattern like trades_* - check if key starts with the base
      const basePattern = pattern.slice(0, -1);
      shouldDelete = key.startsWith(basePattern);
    } else if (pattern.startsWith('*')) {
      // Pattern like *userId:"..." - check if key ends with the suffix
      const suffixPattern = pattern.slice(1);
      shouldDelete = key.endsWith(suffixPattern);
    } else {
      // Exact match or contains
      shouldDelete = key.includes(pattern);
    }
    
    if (shouldDelete) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => cache.delete(key));
};

// Clear all cache
export const clearAllCache = (): void => {
  cache.clear();
};

// Get cache stats
export const getCacheStats = () => {
  return {
    size: cache.size,
    maxSize: MAX_CACHE_SIZE,
    entries: Array.from(cache.entries()).map(([key, entry]) => ({
      key,
      timestamp: entry.timestamp,
      ttl: entry.ttl,
      isStale: isStale(entry)
    }))
  };
};

/**
 * Custom hook for caching Supabase queries
 */
export const useSupabaseCache = <T>(
  cacheKey: string,
  queryFn: QueryFunction<T>,
  options: CacheOptions = {}
): UseSupabaseCacheResult<T> => {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default
    staleWhileRevalidate = true,
    refetchOnWindowFocus = false,
    refetchInterval,
    timeout = 30000, // 30 seconds default
    retryAttempts = 3,
    retryDelay = 1000
  } = options;

  // Stabilize the query function to prevent re-fetch loops
  const queryFnRef = useRef(queryFn);
  useEffect(() => {
    queryFnRef.current = queryFn;
  }, [queryFn]);

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async (useCache: boolean = true, attemptNumber: number = 0): Promise<void> => {
    if (!mountedRef.current) {
      return;
    }
    
    try {
      // Check cache first if enabled
      if (useCache) {
        const cachedEntry = getCacheEntry<T>(cacheKey);
        
        if (cachedEntry && !isStale(cachedEntry)) {
          if (mountedRef.current) {
            setData(cachedEntry.data);
            setLoading(false);
            setError(null);
          }
          return;
        }

        if (cachedEntry && staleWhileRevalidate) {
          if (mountedRef.current) {
            setData(cachedEntry.data);
            setLoading(false);
          }
        }
      }

      // Use health monitor to wrap the operation with timeout and monitoring
      const result = await monitorAsyncOperation(
        () => queryFnRef.current(),
        `cache-fetch-${cacheKey}`,
        timeout
      );

      if (!mountedRef.current) {
        return;
      }

      if (result.error) {
        throw new Error(result.error.message || 'Query failed');
      }
      
      // Update cache and state
      if (result.data !== null) {
        setCacheEntry(cacheKey, result.data, ttl);
        if (mountedRef.current) {
          setData(result.data);
        }
        // Reset recovery attempts on successful operation
        cacheHealthMonitor.resetRecoveryAttempts();
        // Report successful operation to corruption detector
        cacheCorruptionDetector.reportSuccess(cacheKey);
      } else {
        if (mountedRef.current) {
          setData(null);
        }
      }
      if (mountedRef.current) {
        setError(null);
      }
    } catch (err) {
      if (!mountedRef.current) {
        return;
      }
      const errorObj = err instanceof Error ? err : new Error('Unknown error');
      
      // Report error to corruption detector
      cacheCorruptionDetector.reportError(cacheKey, errorObj);
      
      // Implement retry logic with exponential backoff
      if (attemptNumber < retryAttempts) {
        const delay = retryDelay * Math.pow(2, attemptNumber); // Exponential backoff
        console.warn(`🔄 Retrying cache fetch (attempt ${attemptNumber + 1}/${retryAttempts}) after ${delay}ms:`, errorObj.message);
        
        setTimeout(() => {
          if (mountedRef.current) {
            fetchData(useCache, attemptNumber + 1);
          }
        }, delay);
        return;
      }
      
      setError(errorObj);
      console.error('Cache fetch error (all retries exhausted):', errorObj);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [cacheKey, ttl, staleWhileRevalidate, timeout, retryAttempts, retryDelay]);

  const refetch = useCallback(async (): Promise<void> => {
    setLoading(true);
    await fetchData(false, 0); // Force fresh fetch, reset attempt counter
  }, [fetchData]);

  const invalidate = useCallback((): void => {
    invalidateCacheEntry(cacheKey);
  }, [cacheKey]);

  // Initial fetch
  useEffect(() => {
    fetchData().catch(error => {
      // Silently handle errors in background refresh
      void error;
    });
  }, []); // Empty dependency array to prevent infinite loops

  // Setup refetch interval
  useEffect(() => {
    if (refetchInterval && refetchInterval > 0) {
      intervalRef.current = setInterval(() => {
        if (mountedRef.current) {
          fetchData();
        }
      }, refetchInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
    return undefined;
  }, [refetchInterval, fetchData]); // Add fetchData back but with proper dependency management

  // Refetch on window focus
  useEffect(() => {
    if (refetchOnWindowFocus) {
      const handleFocus = () => {
        if (mountedRef.current) {
          fetchData();
        }
      };

      window.addEventListener('focus', handleFocus);
      return () => {
        window.removeEventListener('focus', handleFocus);
      };
    }
    return undefined;
  }, [refetchOnWindowFocus, fetchData]); // Add fetchData back but with proper dependency management

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
    invalidate
  };
};

// Specific hooks for common queries
export const useCachedTrades = (userId?: string, accountIds?: string[]) => {
  // Stabilize the query function to prevent re-renders
  const queryFn = useMemo(() => {
    return async () => {
      if (!userId) return { data: [], error: null };
      
      let query = supabase
        .from('trades')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (accountIds && accountIds.length > 0) {
        query = query.in('account_id', accountIds);
      }
      
      const result = await query;
      return { data: result.data || [], error: result.error };
    };
  }, [userId, accountIds]);

  const cacheKey = `trades_${userId}_${accountIds?.join(',') || 'all'}`;
  return useSupabaseCache(cacheKey, queryFn, { 
    ttl: 2 * 60 * 1000, // 2 minutes TTL
    timeout: 15000, // 15 seconds timeout for trades
    retryAttempts: 2,
    retryDelay: 500
  });
};

export const useCachedAccounts = (userId?: string) => {
  // Stabilize the query function to prevent re-renders
  const queryFn = useCallback(async () => {
    if (!userId) {
      // Don't make API call if userId is undefined
      throw new Error('User ID is required');
    }
    
    const result = await supabase
      .from('trading_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    return { data: result.data || [], error: result.error };
  }, [userId]);

  const cacheKey = `trading_accounts_${userId}`;
  return useSupabaseCache(cacheKey, queryFn, { 
    ttl: 5 * 60 * 1000, // 5 minutes TTL
    staleWhileRevalidate: true,
    timeout: 20000, // 20 seconds timeout for accounts
    retryAttempts: 3,
    retryDelay: 1000
  });
};

export const useCachedUserProfile = (userId?: string) => {
  // Stabilize the query function to prevent re-renders
  const queryFn = useMemo(() => {
    return async () => {
      if (!userId) return { data: null, error: null };
      
      // Use maybeSingle() instead of single() to handle cases where no profile exists
      const result = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      return { data: result.data, error: result.error };
    };
  }, [userId]);

  const cacheKey = `profile_${userId}`;
  return useSupabaseCache(cacheKey, queryFn, { 
    ttl: 10 * 60 * 1000, // 10 minutes TTL
    staleWhileRevalidate: true,
    timeout: 10000, // 10 seconds timeout for profile
    retryAttempts: 2,
    retryDelay: 750
  });
};