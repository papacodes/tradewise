import React from 'react';
import { Crown, Star, Zap } from 'lucide-react';
import { SubscriptionTier, getTierDisplayName } from '../types/subscription';

interface TierBadgeProps {
  tier: SubscriptionTier;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const TierBadge: React.FC<TierBadgeProps> = ({ 
  tier, 
  size = 'md', 
  showIcon = true, 
  className = '' 
}) => {
  const getTierConfig = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free':
        return {
          icon: Star,
          bgColor: 'bg-gray-600',
          textColor: 'text-gray-100',
          borderColor: 'border-gray-500',
        };
      case 'pro':
        return {
          icon: Zap,
          bgColor: 'bg-blue-600',
          textColor: 'text-blue-100',
          borderColor: 'border-blue-500',
        };
      case 'enterprise':
        return {
          icon: Crown,
          bgColor: 'bg-purple-600',
          textColor: 'text-purple-100',
          borderColor: 'border-purple-500',
        };
      default:
        return {
          icon: Star,
          bgColor: 'bg-gray-600',
          textColor: 'text-gray-100',
          borderColor: 'border-gray-500',
        };
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return {
          container: 'px-2 py-1 text-xs',
          icon: 'w-3 h-3',
        };
      case 'lg':
        return {
          container: 'px-4 py-2 text-base',
          icon: 'w-5 h-5',
        };
      default: // md
        return {
          container: 'px-3 py-1.5 text-sm',
          icon: 'w-4 h-4',
        };
    }
  };

  const config = getTierConfig(tier);
  const sizeClasses = getSizeClasses(size);
  const Icon = config.icon;

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-medium
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${sizeClasses.container}
        ${className}
      `}
    >
      {showIcon && <Icon className={sizeClasses.icon} />}
      <span>{getTierDisplayName(tier)}</span>
    </div>
  );
};

export default TierBadge;