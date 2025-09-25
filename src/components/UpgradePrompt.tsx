import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Crown, Zap, X } from 'lucide-react';
import { SubscriptionTier, SUBSCRIPTION_PLANS } from '../types/subscription';
import TierBadge from './TierBadge';

interface UpgradePromptProps {
  currentTier: SubscriptionTier;
  feature: string;
  description: string;
  onClose?: () => void;
  className?: string;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  currentTier,
  feature,
  description,
  onClose,
  className = ''
}) => {
  const getRecommendedTier = (currentTier: SubscriptionTier): SubscriptionTier => {
    if (currentTier === 'free') return 'pro';
    if (currentTier === 'pro') return 'enterprise';
    return 'enterprise';
  };

  const recommendedTier = getRecommendedTier(currentTier);
  const recommendedPlan = SUBSCRIPTION_PLANS.find(p => p.tier === recommendedTier);

  if (!recommendedPlan) return null;

  return (
    <div className={`bg-[#1a1d23] border border-gray-700 rounded-lg p-6 ${className}`}>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}
      
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {recommendedTier === 'pro' ? (
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-blue-100" />
            </div>
          ) : (
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
              <Crown className="w-6 h-6 text-purple-100" />
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-white">
              Unlock {feature}
            </h3>
            <TierBadge tier={currentTier} size="sm" />
          </div>
          
          <p className="text-gray-300 mb-4">
            {description}
          </p>
          
          <div className="bg-[#0f1114] rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-white">
                {recommendedPlan.name} Plan
              </h4>
              <div className="text-right">
                <span className="text-2xl font-bold text-white">
                  {recommendedPlan.price}
                </span>
                {recommendedPlan.period && (
                  <span className="text-gray-400 ml-1">/{recommendedPlan.period}</span>
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-400 mb-3">
              {recommendedPlan.description}
            </p>
            
            <div className="space-y-2">
              {recommendedPlan.features.slice(0, 3).map((planFeature, index) => (
                planFeature.included && (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                    <span className="text-gray-300">{planFeature.name}</span>
                  </div>
                )
              ))}
              {recommendedPlan.features.filter(f => f.included).length > 3 && (
                <div className="text-sm text-gray-400">
                  +{recommendedPlan.features.filter(f => f.included).length - 3} more features
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-3">
            <Link
              to="/pricing"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Upgrade Now
              <ArrowRight className="w-4 h-4" />
            </Link>
            
            <Link
              to="/pricing"
              className="px-4 py-2.5 text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500 rounded-lg transition-colors text-sm font-medium"
            >
              View All Plans
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradePrompt;