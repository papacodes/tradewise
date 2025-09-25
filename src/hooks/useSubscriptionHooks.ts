import { useContext } from 'react';
import { SubscriptionContext } from './useSubscription';
import { TIER_LIMITS, getTierLimits, isSubscriptionActive } from '../types/subscription';

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

// Hook for checking specific feature access
export const useFeatureAccess = () => {
  const { subscriptionInfo } = useSubscription();
  const subscription = subscriptionInfo;
  
  const hasFeature = (feature: keyof typeof TIER_LIMITS.free): boolean => {
    if (!subscription) return false;
    
    const limits = getTierLimits(subscription.tier);
    return limits[feature] as boolean;
  };

  const isActive = subscription ? 
    isSubscriptionActive(subscription.status, subscription.trialEndDate) : false;

  return {
    hasAdvancedAnalytics: hasFeature('advancedAnalytics') && isActive,
    hasPrioritySupport: hasFeature('prioritySupport') && isActive,
    hasCustomReports: hasFeature('customReports') && isActive,
    hasApiAccess: hasFeature('apiAccess') && isActive,
    hasMultipleStrategies: hasFeature('multipleStrategies') && isActive,
    isActive,
    subscription,
  };
};