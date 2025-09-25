/**
 * Cache Health Monitor
 * Detects hanging operations, timeouts, and provides automatic recovery
 */

import { toast } from 'sonner';
import { clearAllCache, getCacheStats } from '../hooks/useSupabaseCache';
import { clearAllCaches } from './cacheManager';

interface HealthCheckResult {
  isHealthy: boolean;
  issues: string[];
  recommendations: string[];
}

interface PendingOperation {
  id: string;
  startTime: number;
  timeout: number;
  operation: string;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
}

class CacheHealthMonitor {
  private static instance: CacheHealthMonitor;
  private pendingOperations = new Map<string, PendingOperation>();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private readonly HEALTH_CHECK_INTERVAL = 10000; // 10 seconds
  private readonly MAX_PENDING_OPERATIONS = 10;
  // private readonly MAX_CACHE_AGE = 5 * 60 * 1000; // 5 minutes - unused for now
  private isRecovering = false;
  private recoveryAttempts = 0;
  private readonly MAX_RECOVERY_ATTEMPTS = 3;

  private constructor() {
    this.startHealthChecks();
    this.setupUnloadHandler();
  }

  static getInstance(): CacheHealthMonitor {
    if (!CacheHealthMonitor.instance) {
      CacheHealthMonitor.instance = new CacheHealthMonitor();
    }
    return CacheHealthMonitor.instance;
  }

  /**
   * Wrap an async operation with timeout and health monitoring
   */
  async monitorOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    timeout: number = this.DEFAULT_TIMEOUT
  ): Promise<T> {
    const operationId = `${operationName}_${Date.now()}_${Math.random()}`;
    
    return new Promise<T>((resolve, reject) => {
      // Store the pending operation
      const pendingOp: PendingOperation = {
        id: operationId,
        startTime: Date.now(),
        timeout,
        operation: operationName,
        resolve,
        reject
      };
      
      this.pendingOperations.set(operationId, pendingOp);
      
      // Set up timeout
      const timeoutId = setTimeout(() => {
        this.handleTimeout(operationId);
      }, timeout);
      
      // Execute the operation
      operation()
        .then((result) => {
          clearTimeout(timeoutId);
          this.pendingOperations.delete(operationId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          this.pendingOperations.delete(operationId);
          this.handleOperationError(operationName, error);
          reject(error);
        });
    });
  }

  /**
   * Handle operation timeout
   */
  private handleTimeout(operationId: string): void {
    const operation = this.pendingOperations.get(operationId);
    if (!operation) return;

    console.warn(`🚨 Operation timeout: ${operation.operation} (${Date.now() - operation.startTime}ms)`);
    
    const timeoutError = new Error(`Operation '${operation.operation}' timed out after ${operation.timeout}ms`);
    operation.reject(timeoutError);
    this.pendingOperations.delete(operationId);
    
    // Trigger recovery if we have too many timeouts
    this.checkForRecoveryTrigger();
  }

  /**
   * Handle operation errors
   */
  private handleOperationError(operationName: string, error: any): void {
    console.error(`❌ Operation error: ${operationName}`, error);
    
    // Check if this is a cache-related error
    if (this.isCacheRelatedError(error)) {
      this.checkForRecoveryTrigger();
    }
  }

  /**
   * Check if error is cache-related
   */
  private isCacheRelatedError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';
    const cacheErrorPatterns = [
      'net::err_aborted',
      'network error',
      'timeout',
      'connection refused',
      'cache',
      'storage quota',
      'indexeddb'
    ];
    
    return cacheErrorPatterns.some(pattern => errorMessage.includes(pattern));
  }

  /**
   * Perform comprehensive health check
   */
  performHealthCheck(): HealthCheckResult {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check pending operations
    const pendingCount = this.pendingOperations.size;
    if (pendingCount > this.MAX_PENDING_OPERATIONS) {
      issues.push(`Too many pending operations: ${pendingCount}`);
      recommendations.push('Clear cache and retry operations');
    }
    
    // Check for long-running operations
    const now = Date.now();
    for (const [, operation] of this.pendingOperations) {
      const duration = now - operation.startTime;
      if (duration > operation.timeout * 0.8) { // 80% of timeout
        issues.push(`Long-running operation: ${operation.operation} (${duration}ms)`);
        recommendations.push('Consider increasing timeout or optimizing operation');
      }
    }
    
    // Check cache stats
    const cacheStats = getCacheStats();
    if (cacheStats.size > cacheStats.maxSize * 0.9) { // 90% full
      issues.push('Cache nearly full');
      recommendations.push('Clear old cache entries');
    }
    
    // Check for stale entries
    const staleCount = cacheStats.entries.filter(entry => entry.isStale).length;
    if (staleCount > cacheStats.size * 0.5) { // More than 50% stale
      issues.push(`High number of stale cache entries: ${staleCount}`);
      recommendations.push('Refresh cache data');
    }
    
    return {
      isHealthy: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Check if recovery should be triggered
   */
  private checkForRecoveryTrigger(): void {
    if (this.isRecovering) return;
    
    const healthCheck = this.performHealthCheck();
    
    if (!healthCheck.isHealthy && this.recoveryAttempts < this.MAX_RECOVERY_ATTEMPTS) {
      console.warn('🔧 Cache health issues detected, triggering recovery:', healthCheck.issues);
      this.triggerRecovery();
    } else if (this.recoveryAttempts >= this.MAX_RECOVERY_ATTEMPTS) {
      console.error('🚨 Max recovery attempts reached, prompting user re-authentication');
      this.promptUserReauth();
    }
  }

  /**
   * Trigger automatic recovery
   */
  public async triggerRecovery(): Promise<void> {
    if (this.isRecovering) return;
    
    this.isRecovering = true;
    this.recoveryAttempts++;
    
    try {
      console.log('🔄 Starting cache recovery process...');
      
      // Clear in-memory cache
      clearAllCache();
      
      // Clear browser storage
      await clearAllCaches({ 
        skipVersionCheck: true, 
        skipReload: true, 
        logOperations: true 
      });
      
      // Cancel pending operations
      for (const [, operation] of this.pendingOperations) {
        operation.reject(new Error('Operation cancelled due to cache recovery'));
      }
      this.pendingOperations.clear();
      
      // Show user notification
      toast.info('Cache refreshed to improve performance', {
        duration: 3000
      });
      
      console.log('✅ Cache recovery completed');
      
      // Reset recovery flag after a delay
      setTimeout(() => {
        this.isRecovering = false;
      }, 5000);
      
    } catch (error) {
      console.error('❌ Cache recovery failed:', error);
      this.isRecovering = false;
      
      // If recovery fails, prompt for re-auth
      this.promptUserReauth();
    }
  }

  /**
   * Prompt user to re-authenticate
   */
  private promptUserReauth(): void {
    toast.error('Please log in again to refresh your session', {
      duration: 10000,
      action: {
        label: 'Refresh Page',
        onClick: () => {
          window.location.reload();
        }
      }
    });
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      const healthCheck = this.performHealthCheck();
      
      if (!healthCheck.isHealthy) {
        console.warn('⚠️ Cache health check failed:', healthCheck);
        this.checkForRecoveryTrigger();
      }
    }, this.HEALTH_CHECK_INTERVAL);
  }

  /**
   * Stop health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Setup cleanup on page unload
   */
  private setupUnloadHandler(): void {
    window.addEventListener('beforeunload', () => {
      this.stopHealthChecks();
      // Cancel all pending operations
      for (const [, operation] of this.pendingOperations) {
        operation.reject(new Error('Page unloading'));
      }
      this.pendingOperations.clear();
    });
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      pendingOperations: this.pendingOperations.size,
      isRecovering: this.isRecovering,
      recoveryAttempts: this.recoveryAttempts,
      healthCheck: this.performHealthCheck()
    };
  }

  /**
   * Reset recovery attempts (useful after successful operations)
   */
  resetRecoveryAttempts(): void {
    this.recoveryAttempts = 0;
  }
}

// Export singleton instance
export const cacheHealthMonitor = CacheHealthMonitor.getInstance();

// Export utility functions
export const monitorAsyncOperation = <T>(
  operation: () => Promise<T>,
  operationName: string,
  timeout?: number
): Promise<T> => {
  return cacheHealthMonitor.monitorOperation(operation, operationName, timeout);
};

export const getCacheHealthStatus = () => {
  return cacheHealthMonitor.getStatus();
};

export const performManualHealthCheck = () => {
  return cacheHealthMonitor.performHealthCheck();
};