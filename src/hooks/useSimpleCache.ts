import { useState, useEffect, useCallback } from 'react';
import { SimpleCache, CacheTTL } from '../utils/simpleCache';
import { supabase } from '../lib/supabase';

interface UseSimpleCacheOptions {
  ttl?: number;
  enabled?: boolean;
  refetchOnMount?: boolean;
}

// Alias for backward compatibility
type UseCacheOptions = UseSimpleCacheOptions;

interface UseCacheResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
  isStale: boolean;
}

/**
 * Simple cache hook to replace useSupabaseCache
 * Provides a clean API for caching async data with localStorage persistence
 */
export function useSimpleCache<T>(
  key: string,
  queryFn: () => Promise<T>,
  options: UseSimpleCacheOptions = {}
): UseCacheResult<T> {
  const { ttl = CacheTTL.SHORT, enabled = true, refetchOnMount = false } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setData(null);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Skip cache if refetchOnMount is true
        if (!refetchOnMount) {
          // Try to get from cache first
          const cached = SimpleCache.get<T>(key);
          if (cached) {
            setData(cached);
            setLoading(false);
            return;
          }
        }

        // Fetch fresh data
        const result = await queryFn();
        
        // Cache the result
        SimpleCache.set(key, result, ttl);
        
        setData(result);
      } catch (err) {
        console.error(`Error fetching data for key ${key}:`, err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [key, enabled, ttl, refetchOnMount]);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await queryFn();
      SimpleCache.set(key, result, ttl);
      setData(result);
    } catch (err) {
      console.error(`Error refetching data for key ${key}:`, err);
      setError(err instanceof Error ? err.message : 'Failed to refetch data');
    } finally {
      setLoading(false);
    }
  }, [key, queryFn, ttl]);

  const invalidate = useCallback(() => {
    SimpleCache.remove(key);
  }, [key]);

  const isStale = useCallback(() => {
    return SimpleCache.isExpired(key);
  }, [key]);

  return { 
    data, 
    loading, 
    error, 
    refetch, 
    invalidate, 
    isStale: isStale() 
  };
}

/**
 * Hook for caching Supabase queries specifically
 * Provides additional utilities for common Supabase patterns
 */
export const useSupabaseCache = <T>(
  key: string,
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: UseCacheOptions = {}
) => {
  const wrappedFetchFn = useCallback(async (): Promise<T> => {
    const result = await queryFn();
    if (result.error) {
      throw new Error(result.error.message || 'Supabase query failed');
    }
    if (result.data === null) {
      throw new Error('No data returned from query');
    }
    return result.data;
  }, [queryFn]);

  return useSimpleCache(key, wrappedFetchFn, options);
};

/**
 * Hook for caching data with automatic invalidation patterns
 */
export const useCacheWithInvalidation = <T>(
  key: string,
  fetchFn: () => Promise<T>,
  invalidationPatterns: string[] = [],
  options: UseCacheOptions = {}
) => {
  const result = useSimpleCache(key, fetchFn, options);

  const invalidateRelated = useCallback(() => {
    // Invalidate this key
    result.invalidate();
    
    // Invalidate related patterns
    invalidationPatterns.forEach(pattern => {
      SimpleCache.invalidatePattern(pattern);
    });
  }, [result, invalidationPatterns]);

  return {
    ...result,
    invalidateRelated
  };
};

/**
 * Utility hook for cache management
 */
export const useCacheManager = () => {
  const clearAll = useCallback(() => {
    SimpleCache.clear();
  }, []);

  const cleanup = useCallback(() => {
    SimpleCache.cleanup();
  }, []);

  const getStats = useCallback(() => {
    return SimpleCache.getStats();
  }, []);

  const invalidatePattern = useCallback((pattern: string) => {
    SimpleCache.invalidatePattern(pattern);
  }, []);

  return {
    clearAll,
    cleanup,
    getStats,
    invalidatePattern
  };
};

/**
 * Hook for caching trading accounts
 */
export const useCachedAccounts = (userId?: string) => {
  const queryFn = useCallback(async () => {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const result = await supabase
      .from('trading_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (result.error) {
      throw new Error(result.error.message || 'Failed to fetch trading accounts');
    }
    
    return result.data || [];
  }, [userId]);

  const cacheKey = `trading_accounts_${userId}`;
  return useSimpleCache(cacheKey, queryFn, { 
    ttl: CacheTTL.LONG, // 5 minutes
    enabled: !!userId
  });
};

/**
 * Hook for caching trades
 */
export const useCachedTrades = (userId?: string, accountIds?: string[]) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const queryFn = useCallback(async () => {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    let query = supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (accountIds && accountIds.length > 0) {
      query = query.in('account_id', accountIds);
    }
    
    const result = await query;
    
    if (result.error) {
      throw new Error(result.error.message || 'Failed to fetch trades');
    }
    
    return result.data || [];
  }, [userId, accountIds]);

  const cacheKey = `trades_${userId}_${accountIds?.join(',') || 'all'}`;
  
  // Listen for cache invalidation events
  useEffect(() => {
    const handleCacheInvalidation = (event: CustomEvent) => {
      const { pattern } = event.detail;
      // Check if this cache key matches the invalidation pattern
      if (cacheKey.includes(pattern.replace('*', '')) || pattern.includes('trades_')) {
        console.log(`🔄 [CACHE REFRESH] Refreshing trades data due to invalidation: ${pattern}`);
        setRefreshTrigger(prev => prev + 1);
      }
    };

    window.addEventListener('cache-invalidated', handleCacheInvalidation as EventListener);
    return () => {
      window.removeEventListener('cache-invalidated', handleCacheInvalidation as EventListener);
    };
  }, [cacheKey]);
  
  const result = useSimpleCache(cacheKey, queryFn, { 
    ttl: CacheTTL.MEDIUM, // 2 minutes
    enabled: !!userId,
    refetchOnMount: refreshTrigger > 0
  });
  
  return result;
};

/**
 * Hook for caching user profile
 */
export const useCachedUserProfile = (userId?: string) => {
  const queryFn = useCallback(async () => {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const result = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (result.error) {
      throw new Error(result.error.message || 'Failed to fetch user profile');
    }
    
    return result.data;
  }, [userId]);

  const cacheKey = `profile_${userId}`;
  return useSimpleCache(cacheKey, queryFn, { 
    ttl: CacheTTL.LONG, // 10 minutes
    enabled: !!userId
  });
};