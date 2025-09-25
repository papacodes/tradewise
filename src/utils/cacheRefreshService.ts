import { supabase } from '../lib/supabase';
import { cacheCorruptionDetector } from './cacheCorruptionDetector';

interface RefreshStrategy {
  key: string;
  refreshFn: () => Promise<any>;
  priority: 'high' | 'medium' | 'low';
}

class CacheRefreshService {
  private refreshStrategies = new Map<string, RefreshStrategy>();
  private refreshQueue: string[] = [];
  private isRefreshing = false;
  private refreshAttempts = new Map<string, number>();
  private readonly MAX_REFRESH_ATTEMPTS = 3;

  /**
   * Register a refresh strategy for a cache key pattern
   */
  registerRefreshStrategy(pattern: string, refreshFn: () => Promise<any>, priority: 'high' | 'medium' | 'low' = 'medium'): void {
    this.refreshStrategies.set(pattern, {
      key: pattern,
      refreshFn,
      priority
    });
  }

  /**
   * Initialize default refresh strategies for common cache patterns
   */
  initializeDefaultStrategies(userId?: string): void {
    if (!userId) return;

    // User profile refresh
    this.registerRefreshStrategy(
      `profile_${userId}`,
      async () => {
        const result = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        return { data: result.data, error: result.error };
      },
      'high'
    );

    // Trading accounts refresh
    this.registerRefreshStrategy(
      `trading_accounts_${userId}`,
      async () => {
        const result = await supabase
          .from('trading_accounts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        return { data: result.data || [], error: result.error };
      },
      'high'
    );

    // Trades refresh (pattern matching)
    this.registerRefreshStrategy(
      `trades_${userId}`,
      async () => {
        const result = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        return { data: result.data || [], error: result.error };
      },
      'medium'
    );
  }

  /**
   * Queue a cache key for refresh
   */
  queueRefresh(cacheKey: string): void {
    if (!this.refreshQueue.includes(cacheKey)) {
      // Insert based on priority
      const strategy = this.findMatchingStrategy(cacheKey);
      if (strategy) {
        if (strategy.priority === 'high') {
          this.refreshQueue.unshift(cacheKey);
        } else {
          this.refreshQueue.push(cacheKey);
        }
      } else {
        this.refreshQueue.push(cacheKey);
      }
    }

    // Start processing if not already running
    if (!this.isRefreshing) {
      this.processRefreshQueue();
    }
  }

  /**
   * Immediately refresh a specific cache key
   */
  async refreshCache(cacheKey: string): Promise<boolean> {
    const strategy = this.findMatchingStrategy(cacheKey);
    if (!strategy) {
      console.warn(`No refresh strategy found for cache key: ${cacheKey}`);
      return false;
    }

    const attempts = this.refreshAttempts.get(cacheKey) || 0;
    if (attempts >= this.MAX_REFRESH_ATTEMPTS) {
      console.error(`Max refresh attempts reached for cache key: ${cacheKey}`);
      return false;
    }

    try {
      console.log(`Refreshing cache for key: ${cacheKey}`);
      
      // Execute the refresh function
      const freshData = await strategy.refreshFn();
      
      // Store the fresh data in cache
      // Store fresh data in localStorage with TTL
      const cacheData = {
        data: freshData,
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000 // 5 minutes
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      
      // Reset corruption indicators for this key
      cacheCorruptionDetector.reportSuccess(cacheKey);
      
      // Reset refresh attempts
      this.refreshAttempts.delete(cacheKey);
      
      console.log(`Successfully refreshed cache for key: ${cacheKey}`);
      return true;
      
    } catch (error) {
      console.error(`Failed to refresh cache for key ${cacheKey}:`, error);
      
      // Increment refresh attempts
      this.refreshAttempts.set(cacheKey, attempts + 1);
      
      // Report the error to corruption detector
      cacheCorruptionDetector.reportError(cacheKey, error as Error);
      
      return false;
    }
  }

  /**
   * Process the refresh queue
   */
  private async processRefreshQueue(): Promise<void> {
    if (this.isRefreshing || this.refreshQueue.length === 0) {
      return;
    }

    this.isRefreshing = true;

    try {
      while (this.refreshQueue.length > 0) {
        const cacheKey = this.refreshQueue.shift();
        if (cacheKey) {
          await this.refreshCache(cacheKey);
          
          // Small delay between refreshes to prevent overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Find a matching refresh strategy for a cache key
   */
  private findMatchingStrategy(cacheKey: string): RefreshStrategy | undefined {
    // First try exact match
    if (this.refreshStrategies.has(cacheKey)) {
      return this.refreshStrategies.get(cacheKey);
    }

    // Then try pattern matching
    for (const [pattern, strategy] of this.refreshStrategies.entries()) {
      const patternPrefix = pattern.split('_')[0];
      if (patternPrefix && cacheKey.startsWith(patternPrefix)) {
        return strategy;
      }
    }

    return undefined;
  }

  /**
   * Refresh all cached data for a user
   */
  async refreshAllUserData(userId: string): Promise<void> {
    const userCacheKeys = [
      `profile_${userId}`,
      `trading_accounts_${userId}`,
      `trades_${userId}`
    ];

    // Queue all user-related cache keys for refresh
    userCacheKeys.forEach(key => this.queueRefresh(key));

    // Wait for all refreshes to complete
    while (this.isRefreshing || this.refreshQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Clear refresh attempts for a cache key (useful for testing)
   */
  clearRefreshAttempts(cacheKey?: string): void {
    if (cacheKey) {
      this.refreshAttempts.delete(cacheKey);
    } else {
      this.refreshAttempts.clear();
    }
  }

  /**
   * Get refresh queue status (useful for debugging)
   */
  getRefreshStatus(): {
    queueLength: number;
    isRefreshing: boolean;
    refreshAttempts: Record<string, number>;
  } {
    const attempts: Record<string, number> = {};
    this.refreshAttempts.forEach((count, key) => {
      attempts[key] = count;
    });

    return {
      queueLength: this.refreshQueue.length,
      isRefreshing: this.isRefreshing,
      refreshAttempts: attempts
    };
  }
}

// Export singleton instance
export const cacheRefreshService = new CacheRefreshService();