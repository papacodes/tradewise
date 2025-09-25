import { useState } from 'react';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cacheManager } from '../utils/cacheManager';

interface AuthFallbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: string;
  onRetry?: () => void;
}

export default function AuthFallbackModal({ 
  isOpen, 
  onClose, 
  reason, 
  onRetry 
}: AuthFallbackModalProps) {
  const { signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<'retry' | 'logout' | null>(null);

  if (!isOpen) return null;

  const handleRetry = async () => {
    setIsLoading(true);
    setAction('retry');
    
    try {
      // Clear all caches
      await cacheManager.clearAllCaches();
      
      // Wait a moment for cache clearing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call the retry function if provided
      if (onRetry) {
        await onRetry();
      }
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error('Retry failed:', error);
      // If retry fails, force logout
      handleLogout();
    } finally {
      setIsLoading(false);
      setAction(null);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    setAction('logout');
    
    try {
      // Clear all caches first
      await cacheManager.clearAllCaches();
      
      // Sign out the user
      await signOut();
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error('Logout failed:', error);
      // Force reload if logout fails
      window.location.reload();
    } finally {
      setIsLoading(false);
      setAction(null);
    }
  };

  const getReasonMessage = (reason: string): string => {
    switch (reason) {
      case 'cache_corruption':
        return 'We detected corrupted data that may cause the app to hang.';
      case 'timeout':
        return 'The app is taking too long to load your data.';
      case 'network_error':
        return 'Network connectivity issues are preventing data from loading.';
      case 'auth_error':
        return 'There seems to be an issue with your authentication session.';
      default:
        return 'We detected an issue that may affect your experience.';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-6 w-6 text-amber-500 mr-3" />
          <h2 className="text-lg font-semibold text-gray-900">
            Connection Issue Detected
          </h2>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-3">
            {getReasonMessage(reason)}
          </p>
          <p className="text-sm text-gray-500">
            To ensure the best experience, we recommend refreshing your session or logging in again.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleRetry}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading && action === 'retry' ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh Session
          </button>
          
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading && action === 'logout' ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <LogOut className="h-4 w-4 mr-2" />
            )}
            Log Out &amp; Restart
          </button>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-400 text-center">
            This helps prevent the app from hanging and ensures reliable performance.
          </p>
        </div>
      </div>
    </div>
  );
}