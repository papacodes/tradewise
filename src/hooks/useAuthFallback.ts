import { useState, useCallback, useEffect } from 'react';

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
      // Simple retry logic - just hide the fallback and let the app retry
      hideFallback();
      
      // If we've retried too many times, force a page reload
      if (fallbackState.retryCount >= 3) {
        console.warn('Too many auth fallback attempts, forcing page reload');
        window.location.reload();
      }
      
    } catch (error) {
      console.error('Auth fallback retry failed:', error);
      throw error;
    }
  }, [hideFallback, fallbackState.retryCount]);

  // Auto-reset retry count after 5 minutes of no issues
  useEffect(() => {
    if (fallbackState.retryCount > 0 && !fallbackState.isOpen) {
      const resetTimer = setTimeout(() => {
        setFallbackState(prev => ({
          ...prev,
          retryCount: 0
        }));
      }, 5 * 60 * 1000); // 5 minutes

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