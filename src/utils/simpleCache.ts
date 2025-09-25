interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

/**
 * Simple localStorage-based cache implementation
 * Provides a SharedPreferences-like API for web applications
 */
export class SimpleCache {
  private static PREFIX = 'app_cache_';
  
  /**
   * Store data in cache with TTL
   * @param key Cache key
   * @param data Data to store
   * @param ttlMs Time to live in milliseconds (default: 5 minutes)
   */
  static set(key: string, data: any, ttlMs: number = 300000): void {
    try {
      const entry: CacheEntry = {
        data,
        timestamp: Date.now(),
        ttl: ttlMs
      };
      localStorage.setItem(this.PREFIX + key, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to set cache entry:', error);
    }
  }
  
  /**
   * Retrieve data from cache
   * @param key Cache key
   * @returns Cached data or null if not found/expired
   */
  static get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.PREFIX + key);
      if (!item) return null;
      
      const entry: CacheEntry = JSON.parse(item);
      
      // Check if entry has expired
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.remove(key);
        return null;
      }
      
      return entry.data;
    } catch (error) {
      console.warn('Failed to get cache entry:', error);
      this.remove(key); // Remove corrupted entry
      return null;
    }
  }
  
  /**
   * Remove a specific cache entry
   * @param key Cache key to remove
   */
  static remove(key: string): void {
    try {
      localStorage.removeItem(this.PREFIX + key);
    } catch (error) {
      console.warn('Failed to remove cache entry:', error);
    }
  }
  
  /**
   * Clear all cache entries
   */
  static clear(): void {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.PREFIX))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }
  
  /**
   * Invalidate cache entries matching a pattern
   * @param pattern - Pattern to match (supports wildcards with *)
   */
  static invalidatePattern(pattern: string): void {
    try {
      const keysToRemove: string[] = [];
      
      // Get all cache keys
      const allKeys = Object.keys(localStorage)
        .filter(key => key.startsWith(this.PREFIX));
      
      // Check each key against the pattern
      for (const fullKey of allKeys) {
        const cacheKey = fullKey.substring(this.PREFIX.length);
        
        // Simple pattern matching - convert * to regex
        const regexPattern = pattern
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
          .replace(/\\\*/g, '.*'); // Convert * to .*
        
        const regex = new RegExp(`^${regexPattern}$`);
        
        if (regex.test(cacheKey)) {
          keysToRemove.push(fullKey);
        }
      }
      
      // Remove matching keys
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      if (keysToRemove.length > 0) {
        console.log(`🗑️ [SIMPLE CACHE] Invalidated ${keysToRemove.length} entries matching pattern: ${pattern}`);
        
        // Dispatch cache invalidation event for hooks to listen
        const event = new CustomEvent('cache-invalidated', {
          detail: { pattern, invalidatedCount: keysToRemove.length }
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.warn('Failed to invalidate cache pattern:', error);
    }
  }
  
  /**
   * Check if a cache entry exists and is not expired
   * @param key Cache key
   * @returns True if entry exists and is valid
   */
  static has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Check if a cache entry is expired
   * @param key Cache key
   * @returns True if entry is expired or doesn't exist
   */
  static isExpired(key: string): boolean {
    try {
      const item = localStorage.getItem(this.PREFIX + key);
      if (!item) return true;
      
      const entry: CacheEntry = JSON.parse(item);
      return Date.now() - entry.timestamp > entry.ttl;
    } catch (error) {
      console.warn('Failed to check cache expiry:', error);
      return true;
    }
  }
  
  /**
   * Get cache statistics
   * @returns Object with cache statistics
   */
  static getStats(): { size: number; totalSize: number; entries: Record<string, any> } {
    try {
      const cacheKeys = Object.keys(localStorage)
        .filter(key => key.startsWith(this.PREFIX));
      
      const totalSize = cacheKeys.reduce((size, key) => {
        const item = localStorage.getItem(key);
        return size + (item ? item.length : 0);
      }, 0);
      
      const entries: Record<string, any> = {};
      cacheKeys.forEach(fullKey => {
        const key = fullKey.substring(this.PREFIX.length);
        entries[key] = this.get(key);
      });
      
      return {
        size: cacheKeys.length,
        totalSize,
        entries
      };
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return { size: 0, totalSize: 0, entries: {} };
    }
  }
  
  /**
   * Clean up expired entries
   */
  static cleanup(): void {
    try {
      const cacheKeys = Object.keys(localStorage)
        .filter(key => key.startsWith(this.PREFIX));
      
      cacheKeys.forEach(fullKey => {
        const key = fullKey.replace(this.PREFIX, '');
        this.get(key); // This will automatically remove expired entries
      });
    } catch (error) {
      console.warn('Failed to cleanup cache:', error);
    }
  }
}

// Export default TTL presets for convenience
export const CacheTTL = {
  SHORT: 60000,      // 1 minute
  MEDIUM: 300000,    // 5 minutes
  LONG: 1800000,     // 30 minutes
  VERY_LONG: 3600000 // 1 hour
} as const;