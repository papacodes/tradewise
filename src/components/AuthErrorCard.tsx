import React from 'react';
import { AlertTriangle, RefreshCw, LogIn } from 'lucide-react';

interface AuthErrorCardProps {
  isOpen: boolean;
  reason: string;
  retryCount: number;
  onRetry: () => void;
  onRelogin: () => void;
  onClose: () => void;
}

export const AuthErrorCard: React.FC<AuthErrorCardProps> = ({
  isOpen,
  retryCount,
  onRetry,
  onRelogin,
  onClose
}) => {
  if (!isOpen) return null;

  const shouldShowRelogin = retryCount >= 2;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-6 w-6 text-amber-500 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">
            Authentication Issue
          </h3>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-2">
            We're having trouble with your session. This can happen due to network issues or expired authentication.
          </p>
          
          {retryCount > 0 && (
            <p className="text-sm text-gray-500">
              Retry attempt: {retryCount}/3
            </p>
          )}
          
          {shouldShowRelogin && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800">
                Multiple retry attempts failed. Please log in again to continue.
              </p>
            </div>
          )}
        </div>
        
        <div className="flex gap-3">
          {!shouldShowRelogin ? (
            <>
              <button
                onClick={onRetry}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>
              
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onRelogin}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Log In Again
              </button>
              
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthErrorCard;