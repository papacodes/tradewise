import React, { useState } from 'react';
import { useSubscription } from '../hooks/useSubscriptionHooks';
import { canAccessFeature } from '../types/subscription';
import UpgradePrompt from './UpgradePrompt';

interface FeatureGateProps {
  feature: string;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  upgradePromptProps?: {
    feature: string;
    description: string;
  };
  children: React.ReactNode;
}

const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  fallback,
  showUpgradePrompt = true,
  upgradePromptProps,
  children
}) => {
  const { subscriptionInfo, loading } = useSubscription();
  const [showPrompt, setShowPrompt] = useState(true);

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-800 rounded-lg h-32 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!subscriptionInfo) {
    return fallback || null;
  }

  const hasAccess = canAccessFeature(subscriptionInfo.tier, feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  // User doesn't have access to this feature
  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgradePrompt && showPrompt && upgradePromptProps) {
    return (
      <UpgradePrompt
        currentTier={subscriptionInfo.tier}
        feature={upgradePromptProps.feature}
        description={upgradePromptProps.description}
        onClose={() => setShowPrompt(false)}
        className="relative"
      />
    );
  }

  return null;
};

export default FeatureGate;