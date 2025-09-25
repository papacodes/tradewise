import { cacheManager } from './cacheManager';
import { cacheHealthMonitor } from './cacheHealthMonitor';
import { cacheRefreshService } from './cacheRefreshService';

interface CorruptionIndicator {
  consecutiveFailures: number;
  lastFailureTime: number;
  errorPatterns: string[];
}

class CacheCorruptionDetector {
  private corruptionIndicators = new Map<string, CorruptionIndicator>();
  private readonly MAX_CONSECUTIVE_FAILURES = 3;
  private readonly CORRUPTION_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
  private readonly SUSPICIOUS_ERROR_PATTERNS = [
    'net::ERR_ABORTED',
    'timeout',
    'network error',
    'connection refused',
    'cache corruption',
    'stale data',
    'invalid response'
  ];

  /**
   * Report a cache-related error for analysis
   */
  reportError(cacheKey: string, error: Error | string): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const now = Date.now();
    
    let indicator = this.corruptionIndicators.get(cacheKey);
    if (!indicator) {
      indicator = {
        consecutiveFailures: 0,
        lastFailureTime: 0,
        errorPatterns: []
      };
      this.corruptionIndicators.set(cacheKey, indicator);
    }

    // Check if this is a suspicious error pattern
    const isSuspicious = this.SUSPICIOUS_ERROR_PATTERNS.some(pattern => 
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );

    if (isSuspicious) {
      indicator.consecutiveFailures++;
      indicator.lastFailureTime = now;
      indicator.errorPatterns.push(errorMessage);

      // Trigger corruption detection if threshold is reached
      if (this.isCorrupted(cacheKey)) {
        this.handleCorruption(cacheKey);
      }
    } else {
      // Reset counter for non-suspicious errors
      indicator.consecutiveFailures = 0;
    }
  }

  /**
   * Report successful cache operation to reset corruption indicators
   */
  reportSuccess(cacheKey: string): void {
    const indicator = this.corruptionIndicators.get(cacheKey);
    if (indicator) {
      indicator.consecutiveFailures = 0;
      indicator.errorPatterns = [];
    }
  }

  /**
   * Check if a cache key is considered corrupted
   */
  isCorrupted(cacheKey: string): boolean {
    const indicator = this.corruptionIndicators.get(cacheKey);
    if (!indicator) return false;

    const now = Date.now();
    const withinWindow = (now - indicator.lastFailureTime) < this.CORRUPTION_WINDOW_MS;
    
    return indicator.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES && withinWindow;
  }

  /**
   * Handle detected cache corruption
   */
  private async handleCorruption(cacheKey: string): Promise<void> {
    console.warn(`🚨 Cache corruption detected for key: ${cacheKey}`);
    
    try {
      // Clear the specific corrupted cache entry
      await cacheManager.invalidateKey(cacheKey);
      
      // Trigger automatic data refresh for the corrupted cache
      try {
        await cacheRefreshService.refreshCache(cacheKey);
        console.log(`🔄 Automatic refresh triggered for corrupted key: ${cacheKey}`);
      } catch (error) {
        console.error(`❌ Failed to refresh corrupted cache key ${cacheKey}:`, error);
        // If refresh fails, trigger health monitor recovery as fallback
        cacheHealthMonitor.triggerRecovery();
      }
      
      // If it's a pattern affecting multiple keys, clear related caches
      if (this.isSystemWideCorruption()) {
        console.warn('System-wide cache corruption detected, clearing all caches');
        await cacheManager.clearAllCaches();
        
        // Trigger health monitor recovery
        cacheHealthMonitor.triggerRecovery();
      }
      
      // Reset the corruption indicator after clearing
      this.corruptionIndicators.delete(cacheKey);
      
      console.log(`✅ Cache corruption handling completed for key: ${cacheKey}`);
      
    } catch (error) {
      console.error('Failed to handle cache corruption:', error);
      // If we can't clear the cache, trigger full recovery
      cacheHealthMonitor.triggerRecovery();
    }
  }

  /**
   * Detect if corruption is affecting multiple cache keys (system-wide issue)
   */
  private isSystemWideCorruption(): boolean {
    const corruptedKeys = Array.from(this.corruptionIndicators.entries())
      .filter(([key]) => this.isCorrupted(key));
    
    // If more than 3 different cache keys are corrupted, consider it system-wide
    return corruptedKeys.length > 3;
  }

  /**
   * Get corruption status for debugging
   */
  getCorruptionStatus(): Record<string, CorruptionIndicator> {
    const status: Record<string, CorruptionIndicator> = {};
    this.corruptionIndicators.forEach((indicator, key) => {
      status[key] = { ...indicator };
    });
    return status;
  }

  /**
   * Clear all corruption indicators (useful for testing or manual reset)
   */
  clearIndicators(): void {
    this.corruptionIndicators.clear();
  }

  /**
   * Check for stale corruption indicators and clean them up
   */
  cleanupStaleIndicators(): void {
    const now = Date.now();
    const staleThreshold = this.CORRUPTION_WINDOW_MS * 2; // Double the window for cleanup
    
    this.corruptionIndicators.forEach((indicator, key) => {
      if (now - indicator.lastFailureTime > staleThreshold) {
        this.corruptionIndicators.delete(key);
      }
    });
  }
}

// Export singleton instance
export const cacheCorruptionDetector = new CacheCorruptionDetector();

// Auto-cleanup stale indicators every 10 minutes
setInterval(() => {
  cacheCorruptionDetector.cleanupStaleIndicators();
}, 10 * 60 * 1000);