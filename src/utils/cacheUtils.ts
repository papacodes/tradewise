/**
 * Advanced cache management utilities for Supabase queries
 * Provides additional cache operations and background refresh strategies
 */

import { SimpleCache } from './simpleCache';

// Cache key patterns for different data types
export const CACHE_PATTERNS = {
  TRADES: 'trades',
  ACCOUNTS: 'trading_accounts',
  PROFILE: 'profiles',
  ANALYTICS: 'analytics',
  DASHBOARD: 'dashboard'
} as const;

// Cache TTL presets (in milliseconds)
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000,      // 1 minute
  MEDIUM: 5 * 60 * 1000,     // 5 minutes
  LONG: 15 * 60 * 1000,      // 15 minutes
  VERY_LONG: 60 * 60 * 1000  // 1 hour
} as const;

// Cache invalidation strategies
export class CacheInvalidationManager {
  private static instance: CacheInvalidationManager;
  private invalidationQueue: Set<string> = new Set();
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 100; // ms

  static getInstance(): CacheInvalidationManager {
    if (!CacheInvalidationManager.instance) {
      CacheInvalidationManager.instance = new CacheInvalidationManager();
    }
    return CacheInvalidationManager.instance;
  }

  /**
   * Queue cache invalidation for batch processing
   */
  queueInvalidation(pattern: string): void {
    this.invalidationQueue.add(pattern);
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.processBatch();
    }, this.BATCH_DELAY);
  }

  /**
   * Process queued invalidations
   */
  private processBatch(): void {
    const patterns = Array.from(this.invalidationQueue);
    
    // Debug: Log current cache stats before invalidation
    const cacheStats = SimpleCache.getStats();
    console.log(`🔍 Cache invalidation debug - Current cache entries: ${cacheStats.size}`);
    console.log(`🔍 Cache keys before invalidation:`, Object.keys(cacheStats.entries || {}));
    
    patterns.forEach(pattern => {
      console.log(`🗑️ Invalidating pattern: ${pattern}`);
      SimpleCache.invalidatePattern(pattern);
    });
    
    this.invalidationQueue.clear();
    this.batchTimeout = null;
    
    // Debug: Log cache stats after invalidation
    const newCacheStats = SimpleCache.getStats();
    console.log(`🔍 Cache entries after invalidation: ${newCacheStats.size}`);
    console.log(`🔍 Remaining cache keys:`, Object.keys(newCacheStats.entries || {}));
    console.log(`🗑️ Cache invalidated for patterns: ${patterns.join(', ')}`);
  }

  /**
   * Process queued invalidations immediately and return a promise
   */
  async processBatchAsync(): Promise<void> {
    return new Promise((resolve) => {
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
        this.batchTimeout = null;
      }
      
      const patterns = Array.from(this.invalidationQueue);
      
      if (patterns.length === 0) {
        resolve();
        return;
      }
      
      // Debug: Log current cache stats before invalidation
      const cacheStats = SimpleCache.getStats();
      console.log(`🔍 Cache invalidation debug - Current cache entries: ${cacheStats.size}`);
      console.log(`🔍 Cache keys before invalidation:`, Object.keys(cacheStats.entries || {}));
      
      patterns.forEach(pattern => {
        console.log(`🗑️ Invalidating pattern: ${pattern}`);
        SimpleCache.invalidatePattern(pattern);
      });
      
      this.invalidationQueue.clear();
      
      // Debug: Log cache stats after invalidation
      const newCacheStats = SimpleCache.getStats();
      console.log(`🔍 Cache entries after invalidation: ${newCacheStats.size}`);
      console.log(`🔍 Remaining cache keys:`, Object.keys(newCacheStats.entries || {}));
      console.log(`🗑️ Cache invalidated for patterns: ${patterns.join(', ')}`);
      
      resolve();
    });
  }

  /**
   * Immediate cache invalidation
   */
  invalidateImmediate(pattern: string): void {
    SimpleCache.invalidatePattern(pattern);
    console.log(`🗑️ Cache immediately invalidated for pattern: ${pattern}`);
  }

  /**
   * Invalidate all user-related cache
   */
  // Invalidate all user-related cache
  invalidateUserCache(userId: string): void {
    const patterns = [
      `trades_*userId:${JSON.stringify(userId)}*`,
      `trading_accounts_*userId:${JSON.stringify(userId)}*`,
      `profiles_*userId:${JSON.stringify(userId)}*`
    ];
    
    patterns.forEach(pattern => this.queueInvalidation(pattern));
  }

  /**
   * Invalidate cache after data mutations
   */
  invalidateAfterMutation(type: keyof typeof CACHE_PATTERNS, userId?: string): void {
    const pattern = CACHE_PATTERNS[type];
    
    if (userId) {
      // The cache keys are in format: trades_${userId}_${accountIds} or trading_accounts_${userId}
      // So we need to match patterns that contain the userId directly (not JSON stringified)
      
      // Invalidate all entries for this table that contain the userId
      this.queueInvalidation(`${pattern}_${userId}`);
      
      // Also use broader wildcard to catch any variations
      this.queueInvalidation(`${pattern}_*`);
      
      console.log(`🎯 [CACHE INVALIDATION] Queued patterns for ${type}:`, [
        `${pattern}_${userId}`,
        `${pattern}_*`
      ]);
    } else {
      this.queueInvalidation(pattern);
    }
  }
}

// Background refresh manager
export class BackgroundRefreshManager {
  private static instance: BackgroundRefreshManager;
  private refreshIntervals: Map<string, NodeJS.Timeout> = new Map();
  private refreshCallbacks: Map<string, () => Promise<void>> = new Map();

  static getInstance(): BackgroundRefreshManager {
    if (!BackgroundRefreshManager.instance) {
      BackgroundRefreshManager.instance = new BackgroundRefreshManager();
    }
    return BackgroundRefreshManager.instance;
  }

  /**
   * Register a background refresh for a cache key
   */
  registerRefresh(
    key: string, 
    refreshFn: () => Promise<void>, 
    intervalMs: number
  ): void {
    // Clear existing interval if any
    this.stopRefresh(key);

    // Store refresh callback
    this.refreshCallbacks.set(key, refreshFn);

    // Set up interval
    const interval = setInterval(async () => {
      try {
        await refreshFn();
        console.log(`🔄 Background refresh completed for: ${key}`);
      } catch (error) {
        console.error(`❌ Background refresh failed for ${key}:`, error);
      }
    }, intervalMs);

    this.refreshIntervals.set(key, interval);
    console.log(`⏰ Background refresh registered for: ${key} (${intervalMs}ms)`);
  }

  /**
   * Stop background refresh for a key
   */
  stopRefresh(key: string): void {
    const interval = this.refreshIntervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.refreshIntervals.delete(key);
      this.refreshCallbacks.delete(key);
      console.log(`⏹️ Background refresh stopped for: ${key}`);
    }
  }

  /**
   * Stop all background refreshes
   */
  stopAllRefreshes(): void {
    this.refreshIntervals.forEach((interval, key) => {
      clearInterval(interval);
      console.log(`⏹️ Background refresh stopped for: ${key}`);
    });
    
    this.refreshIntervals.clear();
    this.refreshCallbacks.clear();
  }

  /**
   * Manually trigger refresh for a key
   */
  async triggerRefresh(key: string): Promise<void> {
    const refreshFn = this.refreshCallbacks.get(key);
    if (refreshFn) {
      try {
        await refreshFn();
        console.log(`🔄 Manual refresh completed for: ${key}`);
      } catch (error) {
        console.error(`❌ Manual refresh failed for ${key}:`, error);
      }
    }
  }

  /**
   * Get active refresh keys
   */
  getActiveRefreshes(): string[] {
    return Array.from(this.refreshIntervals.keys());
  }
}

// Cache performance monitor
export class CachePerformanceMonitor {
  private static instance: CachePerformanceMonitor;
  private hitCount = 0;
  private missCount = 0;
  private startTime = Date.now();

  static getInstance(): CachePerformanceMonitor {
    if (!CachePerformanceMonitor.instance) {
      CachePerformanceMonitor.instance = new CachePerformanceMonitor();
    }
    return CachePerformanceMonitor.instance;
  }

  recordHit(): void {
    this.hitCount++;
  }

  recordMiss(): void {
    this.missCount++;
  }

  getStats() {
    const total = this.hitCount + this.missCount;
    const hitRate = total > 0 ? (this.hitCount / total) * 100 : 0;
    const uptime = Date.now() - this.startTime;

    return {
      hits: this.hitCount,
      misses: this.missCount,
      total,
      hitRate: Math.round(hitRate * 100) / 100,
      uptime,
      cacheStats: SimpleCache.getStats()
    };
  }

  reset(): void {
    this.hitCount = 0;
    this.missCount = 0;
    this.startTime = Date.now();
  }
}

// Utility functions
export const cacheUtils = {
  /**
   * Get cache invalidation manager instance
   */
  getInvalidationManager: () => CacheInvalidationManager.getInstance(),

  /**
   * Get background refresh manager instance
   */
  getRefreshManager: () => BackgroundRefreshManager.getInstance(),

  /**
   * Get performance monitor instance
   */
  getPerformanceMonitor: () => CachePerformanceMonitor.getInstance(),

  /**
   * Clear all caches and reset managers
   */
  resetAll: () => {
    SimpleCache.clear();
    BackgroundRefreshManager.getInstance().stopAllRefreshes();
    CachePerformanceMonitor.getInstance().reset();
    console.log('🧹 All caches and managers reset');
  },

  /**
   * Get comprehensive cache status
   */
  getStatus: () => {
    const refreshManager = BackgroundRefreshManager.getInstance();
    const performanceMonitor = CachePerformanceMonitor.getInstance();
    
    return {
      performance: performanceMonitor.getStats(),
      activeRefreshes: refreshManager.getActiveRefreshes(),
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Invalidate cache after common operations
   */
  invalidateAfterTradeOperation: (userId: string) => {
    console.log(`🔄 Starting cache invalidation for trade operation, userId: ${userId}`);
    const manager = CacheInvalidationManager.getInstance();
    manager.invalidateAfterMutation('TRADES', userId);
    manager.invalidateAfterMutation('ACCOUNTS', userId);
    manager.invalidateAfterMutation('ANALYTICS', userId);
    manager.invalidateAfterMutation('DASHBOARD', userId);
    console.log(`✅ Cache invalidation queued for trade operation`);
  },

  /**
   * Invalidate cache after trade operations and wait for completion
   */
  invalidateAfterTradeOperationAsync: async (userId: string): Promise<void> => {
    console.log(`🔄 Starting async cache invalidation for trade operation, userId: ${userId}`);
    const manager = CacheInvalidationManager.getInstance();
    manager.invalidateAfterMutation('TRADES', userId);
    manager.invalidateAfterMutation('ACCOUNTS', userId);
    manager.invalidateAfterMutation('ANALYTICS', userId);
    manager.invalidateAfterMutation('DASHBOARD', userId);
    
    // Wait for the batch processing to complete
    await manager.processBatchAsync();
    console.log(`✅ Async cache invalidation completed for trade operation`);
  },

  invalidateAfterAccountOperation: (userId: string) => {
    const manager = CacheInvalidationManager.getInstance();
    manager.invalidateAfterMutation('ACCOUNTS', userId);
    manager.invalidateAfterMutation('DASHBOARD', userId);
  },

  /**
   * Invalidate cache after user profile operations
   */
  invalidateAfterUserOperation: (userId: string) => {
    const manager = CacheInvalidationManager.getInstance();
    manager.invalidateAfterMutation('PROFILE', userId);
    // Also invalidate any user-related data
    manager.queueInvalidation(`user:${userId}`);
  },

  invalidateAfterProfileOperation: (userId: string) => {
    const manager = CacheInvalidationManager.getInstance();
    manager.invalidateAfterMutation('PROFILE', userId);
  }
};

// Export singleton instances for convenience
export const cacheInvalidation = CacheInvalidationManager.getInstance();
export const backgroundRefresh = BackgroundRefreshManager.getInstance();
export const cachePerformance = CachePerformanceMonitor.getInstance();