import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Database } from 'lucide-react';
import { cacheHealthMonitor } from '../utils/cacheHealthMonitor';
import { cacheManager } from '../utils/cacheManager';
import { cacheRefreshService } from '../utils/cacheRefreshService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  isCacheRelated?: boolean;
  isRecovering?: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Check if this is a cache-related error
    const isCacheRelated = this.isCacheRelatedError(error);
    
    this.setState({
      error,
      errorInfo,
      isCacheRelated
    });
    
    // If it's cache-related, trigger recovery automatically
    if (isCacheRelated) {
      console.log('🔄 ErrorBoundary: Detected cache-related error, triggering recovery...');
      this.handleCacheRecovery();
    }
  }
  
  private isCacheRelatedError(error: Error): boolean {
    const cacheErrorIndicators = [
      'cache',
      'timeout',
      'network',
      'fetch',
      'supabase',
      'connection',
      'abort',
      'ERR_ABORTED',
      'Failed to fetch'
    ];
    
    const errorMessage = error.message.toLowerCase();
    const errorStack = error.stack?.toLowerCase() || '';
    
    return cacheErrorIndicators.some(indicator => 
      errorMessage.includes(indicator) || errorStack.includes(indicator)
    );
  }
  
  private async handleCacheRecovery(): Promise<void> {
    try {
      this.setState({ isRecovering: true });
      
      // Clear all caches
      await cacheManager.clearAllCaches();
      
      // Trigger health monitor recovery
      cacheHealthMonitor.triggerRecovery();
      
      // Wait a moment for recovery to take effect
      setTimeout(() => {
        this.setState({ isRecovering: false });
      }, 2000);
      
      console.log('✅ ErrorBoundary: Cache recovery completed');
    } catch (recoveryError) {
      console.error('❌ ErrorBoundary: Cache recovery failed:', recoveryError);
      this.setState({ isRecovering: false });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, isCacheRelated: false, isRecovering: false });
  };
  
  handleCacheReset = async () => {
    try {
      this.setState({ isRecovering: true });
      
      // Clear all caches and refresh
      await cacheManager.clearAllCaches();
      cacheHealthMonitor.triggerRecovery();
      
      // Reset error state after cache clear
      setTimeout(() => {
        this.setState({ 
          hasError: false, 
          isCacheRelated: false, 
          isRecovering: false 
        });
      }, 1000);
    } catch (error) {
      console.error('Failed to reset cache:', error);
      this.setState({ isRecovering: false });
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              {this.state.isCacheRelated ? (
                <Database className="w-12 h-12 text-orange-500" />
              ) : (
                <AlertTriangle className="w-12 h-12 text-red-500" />
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {this.state.isCacheRelated ? 'Data Loading Issue' : 'Something went wrong'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {this.state.isCacheRelated 
                ? 'We detected a data loading issue. Our system is automatically recovering, or you can try the options below.'
                : "We're sorry, but something unexpected happened. Please try refreshing the page."
              }
            </p>
            
            {this.state.isRecovering && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center justify-center space-x-2 text-blue-600 dark:text-blue-400">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Recovering data...</span>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              {this.state.isCacheRelated ? (
                <>
                  <button
                    onClick={this.handleCacheReset}
                    disabled={this.state.isRecovering}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-medium rounded-md transition-colors"
                  >
                    <Database className="w-4 h-4" />
                    <span>Clear Data & Retry</span>
                  </button>
                  <button
                    onClick={this.handleReset}
                    disabled={this.state.isRecovering}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Try Again</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={this.handleReset}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Again</span>
                </button>
              )}
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-md transition-colors"
              >
                Refresh Page
              </button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                  Error Details (Development)
                </summary>
                <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-red-600 dark:text-red-400 overflow-auto">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  <div className="mb-2">
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;