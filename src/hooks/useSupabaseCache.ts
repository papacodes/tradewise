import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';

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
  
  console.log(`🔍 [CACHE DEBUG] Invalidating pattern: ${pattern}`);
  console.log(`🔍 [CACHE DEBUG] Total cache entries before: ${allKeys.length}`);
  console.log(`🔍 [CACHE DEBUG] Cache keys before invalidation:`, allKeys);
  
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
  
  console.log(`🔍 [CACHE DEBUG] Keys to delete:`, keysToDelete);
  
  keysToDelete.forEach(key => cache.delete(key));
  
  const remainingKeys = Array.from(cache.keys());
  console.log(`🔍 [CACHE DEBUG] Total cache entries after: ${remainingKeys.length}`);
  console.log(`🔍 [CACHE DEBUG] Remaining cache keys after invalidation:`, remainingKeys);
  console.log(`🗑️ Successfully invalidated ${keysToDelete.length} cache entries matching pattern: ${pattern}`);
  
  if (keysToDelete.length === 0) {
    console.warn(`⚠️ [CACHE WARNING] No cache entries matched pattern: ${pattern}`);
  }
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
    refetchInterval
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

  const fetchData = useCallback(async (useCache: boolean = true): Promise<void> => {
    console.log(`🔄 [FETCHDATA START] useSupabaseCache fetchData called for ${cacheKey}`, {
      useCache,
      timestamp: new Date().toISOString(),
      mountedRef: mountedRef.current
    });
    console.log(`🔧 [FETCHDATA EXEC] fetchData executing for ${cacheKey}`, { cacheKey, ttl, staleWhileRevalidate, useCache });
    
    if (!mountedRef.current) {
      console.log(`⚠️ [FETCHDATA ABORT] useSupabaseCache component unmounted before fetchData execution for ${cacheKey}`);
      return;
    }
    
    console.log(`🎯 [FETCHDATA CONTINUE] About to enter try block for ${cacheKey}`);
    try {
      console.log(`🔍 [CACHE CHECK] Checking cache for ${cacheKey}`, { useCache });
      // Check cache first if enabled
      if (useCache) {
        const cachedEntry = getCacheEntry<T>(cacheKey);
        console.log(`📦 [CACHE RESULT] Cache entry for ${cacheKey}:`, { 
          hasCachedEntry: !!cachedEntry, 
          isStale: cachedEntry ? isStale(cachedEntry) : null 
        });
        
        if (cachedEntry && !isStale(cachedEntry)) {
          console.log(`✅ [CACHE HIT] Using cached data for ${cacheKey}`, {
            age: Date.now() - cachedEntry.timestamp
          });
          if (mountedRef.current) {
            setData(cachedEntry.data);
            setLoading(false);
            setError(null);
          }
          return;
        }

        if (cachedEntry && staleWhileRevalidate) {
          console.log(`⚡ [STALE CACHE] Using stale data while revalidating for ${cacheKey}`);
          if (mountedRef.current) {
            setData(cachedEntry.data);
            setLoading(false);
          }
        } else if (cachedEntry) {
          console.log(`🔄 [STALE ENTRY] Cache entry is stale for ${cacheKey}`);
        } else {
          console.log(`❌ [NO CACHE] No cache entry found for ${cacheKey}`);
        }
      }

      console.log(`🚀 [QUERY START] About to fetch fresh data for ${cacheKey}`);
      console.log(`🔧 [QUERY FN] QueryFn ref current:`, { hasQueryFn: !!queryFnRef.current });
      
      console.log(`📞 [CALLING QUERY] Calling queryFn for ${cacheKey}`);
      // Fetch fresh data using stabilized ref
      const result = await queryFnRef.current();
      
      console.log(`📊 [QUERY RESULT] Query completed for ${cacheKey}:`, { 
        hasResult: !!result, 
        hasData: result?.data !== undefined, 
        hasError: !!result?.error 
      });
      console.log(`📋 [QUERY DATA] Query data details for ${cacheKey}:`, { dataType: typeof result?.data, dataLength: Array.isArray(result?.data) ? result.data.length : 'not array', error: result?.error });

      if (!mountedRef.current) {
        console.log(`⚠️ [UNMOUNTED] Component unmounted after query for ${cacheKey}`);
        return;
      }

      if (result.error) {
        console.error(`❌ [QUERY ERROR] Query error for ${cacheKey}:`, result.error);
        throw new Error(result.error.message || 'Query failed');
      }

      console.log(`✅ [FETCH SUCCESS] Fetch success for ${cacheKey}`, {
        hasData: result.data !== null,
        dataType: typeof result.data,
        isArray: Array.isArray(result.data)
      });
      
      // Update cache and state
      if (result.data !== null) {
        console.log(`💾 [CACHE SET] Setting cache for ${cacheKey}`);
        setCacheEntry(cacheKey, result.data, ttl);
        if (mountedRef.current) {
          console.log(`📊 [STATE UPDATE] Updating state with data for ${cacheKey}`);
          setData(result.data);
        }
        console.log(`✅ [CACHE COMPLETE] Data cached and state updated for ${cacheKey}`);
      } else {
        if (mountedRef.current) {
          console.log(`📭 [NULL DATA] Setting null data for ${cacheKey}`);
          setData(null);
        }
        console.log(`📭 [NO DATA] No data returned for ${cacheKey}`);
      }
      if (mountedRef.current) {
        console.log(`🧹 [CLEAR ERROR] Clearing error state for ${cacheKey}`);
        setError(null);
      }
    } catch (err) {
      if (!mountedRef.current) {
        console.log(`⚠️ [UNMOUNTED ERROR] Component unmounted during error handling for ${cacheKey}`);
        return;
      }
      const errorObj = err instanceof Error ? err : new Error('Unknown error');
      console.error(`❌ [FETCH ERROR] Fetch error for ${cacheKey}:`, errorObj);
      setError(errorObj);
    } finally {
      if (mountedRef.current) {
        console.log(`🏁 [FETCH COMPLETE] Fetch complete, setting loading false for ${cacheKey}`);
        setLoading(false);
      } else {
        console.log(`⚠️ [UNMOUNTED FINALLY] Component unmounted in finally block for ${cacheKey}`);
      }
    }
  }, [cacheKey, ttl, staleWhileRevalidate]);

  const refetch = useCallback(async (): Promise<void> => {
    setLoading(true);
    await fetchData(false); // Force fresh fetch
  }, [fetchData]);

  const invalidate = useCallback((): void => {
    invalidateCacheEntry(cacheKey);
  }, [cacheKey]);

  // Initial fetch
  useEffect(() => {
    console.log(`🚀 [${cacheKey}] Initial fetch useEffect triggered`);
    console.log(`🎯 [${cacheKey}] About to call fetchData from initial fetch useEffect`);
    console.log(`🔧 [${cacheKey}] fetchData function exists:`, { hasFetchData: !!fetchData });
    console.log(`🔧 [${cacheKey}] cacheKey:`, cacheKey);
    console.log(`🔧 [${cacheKey}] Dependencies:`, { cacheKey, fetchDataType: typeof fetchData });
    
    // Call fetchData and handle any immediate errors
    try {
      const fetchPromise = fetchData();
      console.log(`📞 [${cacheKey}] fetchData called, promise created`);
      
      fetchPromise.catch(error => {
        console.error(`❌ [${cacheKey}] Unhandled error in fetchData:`, error);
      });
    } catch (syncError) {
      console.error(`❌ [${cacheKey}] Synchronous error calling fetchData:`, syncError);
    }
  }, [cacheKey, fetchData]); // Include fetchData to ensure latest version is called

  // Setup refetch interval
  useEffect(() => {
    console.debug(`⏰ [${cacheKey}] Refetch interval useEffect triggered`, { refetchInterval });
    if (refetchInterval && refetchInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchData();
      }, refetchInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
    return undefined;
  }, [refetchInterval, fetchData]); // Include fetchData for consistency

  // Refetch on window focus
  useEffect(() => {
    console.debug(`👁️ [${cacheKey}] Window focus useEffect triggered`, { refetchOnWindowFocus });
    if (refetchOnWindowFocus) {
      const handleFocus = () => {
        fetchData();
      };

      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
    return undefined;
  }, [refetchOnWindowFocus, fetchData]); // Include fetchData for consistency

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
      
      return await query;
    };
  }, [userId, accountIds]);

  return useSupabaseCache(
    generateCacheKey('trades', { userId, accountIds }),
    queryFn,
    {
      ttl: 2 * 60 * 1000, // 2 minutes
      refetchOnWindowFocus: true,
      refetchInterval: 5 * 60 * 1000, // 5 minutes
    }
  );
};

export const useCachedAccounts = (userId?: string) => {
  // Stabilize the query function to prevent re-renders
  const queryFn = useCallback(async () => {
    if (!userId) return { data: [], error: null };
    
    const result = await supabase
      .from('trading_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    return result;
  }, [userId]);

  return useSupabaseCache(
    generateCacheKey('trading_accounts', { userId }),
    queryFn,
    {
      ttl: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true,
      refetchInterval: 10 * 60 * 1000, // 10 minutes
    }
  );
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
      
      // If no profile exists, return null data without error
      if (!result.data && !result.error) {
        return { data: null, error: null };
      }
      
      return result;
    };
  }, [userId]);

  return useSupabaseCache(
    generateCacheKey('profiles', { userId }),
    queryFn,
    {
      ttl: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: true,
      refetchInterval: 15 * 60 * 1000, // 15 minutes
    }
  );
};