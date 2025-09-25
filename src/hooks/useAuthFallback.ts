import { useState, useCallback, useEffect } from 'react';
import { cacheHealthMonitor } from '../utils/cacheHealthMonitor';

interface AuthFallbackState {
  isOpen: boolean;
  reason: string;
  retryCount: number;
}

export const useAuthFallback = () => {
  const [fallbackState, setFallbackState] = useState<AuthFallbackState>({
    isOpen: false,
    reason: '',
    retryCount: 0
  });

  const showFallback = useCallback((reason: string) => {
    setFallbackState(prev => ({
      isOpen: true,
      reason,
      retryCount: prev.retryCount + 1
    }));
  }, []);

  const hideFallback = useCallback(() => {
    setFallbackState(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  const handleRetry = useCallback(async () => {
    try {
      // Reset health monitor state
      cacheHealthMonitor.resetRecoveryAttempts();
      
      // Clear any cached corruption indicators
      // This will be handled by the health monitor
      
      // Trigger a health check
      const isHealthy = await cacheHealthMonitor.performHealthCheck();
      
      if (!isHealthy) {
        throw new Error('Health check failed after retry');
      }
      
      // If successful, hide the fallback
      hideFallback();
      
    } catch (error) {
      console.error('Auth fallback retry failed:', error);
      // If retry fails, we'll let the modal handle the logout
      throw error;
    }
  }, [hideFallback]);

  // Listen for recovery events from cache health monitor
  useEffect(() => {
    const handleRecoveryNeeded = (reason: string) => {
      // Only show fallback if we haven't shown it too many times recently
      if (fallbackState.retryCount < 3) {
        showFallback(reason);
      } else {
        // Too many retries, force a page reload
        console.warn('Too many auth fallback attempts, forcing page reload');
        window.location.reload();
      }
    };

    // Add event listener for recovery events
    const originalTriggerRecovery = cacheHealthMonitor.triggerRecovery;
    cacheHealthMonitor.triggerRecovery = async () => {
      await originalTriggerRecovery.call(cacheHealthMonitor);
      handleRecoveryNeeded('Cache recovery triggered');
    };

    // Cleanup
    return () => {
      cacheHealthMonitor.triggerRecovery = originalTriggerRecovery;
    };
  }, [fallbackState.retryCount, showFallback]);

  // Auto-reset retry count after 10 minutes of no issues
  useEffect(() => {
    if (fallbackState.retryCount > 0 && !fallbackState.isOpen) {
      const resetTimer = setTimeout(() => {
        setFallbackState(prev => ({
          ...prev,
          retryCount: 0
        }));
      }, 10 * 60 * 1000); // 10 minutes

      return () => clearTimeout(resetTimer);
    }
    return undefined;
  }, [fallbackState.retryCount, fallbackState.isOpen]);

  return {
    isOpen: fallbackState.isOpen,
    reason: fallbackState.reason,
    retryCount: fallbackState.retryCount,
    showFallback,
    hideFallback,
    handleRetry
  };
};