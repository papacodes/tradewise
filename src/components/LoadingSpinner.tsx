import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'Loading...', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-500`} />
      {text && (
        <span className={`text-gray-400 ${textSizeClasses[size]}`}>
          {text}
        </span>
      )}
    </div>
  );
};

export const FullPageLoader: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
};

export const SectionLoader: React.FC<{ text?: string; height?: string }> = ({ 
  text = 'Loading...', 
  height = 'h-64' 
}) => {
  return (
    <div className={`${height} flex items-center justify-center bg-gray-800 rounded-lg`}>
      <LoadingSpinner size="md" text={text} />
    </div>
  );
};