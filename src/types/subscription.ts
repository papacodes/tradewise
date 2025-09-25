export type SubscriptionTier = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial';

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  startDate?: string;
  endDate?: string;
  trialEndDate?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface TierLimits {
  maxAccounts: number;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  customReports: boolean;
  apiAccess: boolean;
  multipleStrategies: boolean;
}

export interface PlanFeature {
  name: string;
  included: boolean;
}

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  price: string;
  period?: string;
  description: string;
  features: PlanFeature[];
  limits: TierLimits;
  popular?: boolean;
  ctaText: string;
  ctaLink: string;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    maxAccounts: 2,
    advancedAnalytics: false,
    prioritySupport: false,
    customReports: false,
    apiAccess: false,
    multipleStrategies: false,
  },
  pro: {
    maxAccounts: 10,
    advancedAnalytics: true,
    prioritySupport: true,
    customReports: true,
    apiAccess: false,
    multipleStrategies: true,
  },
  enterprise: {
    maxAccounts: -1, // unlimited
    advancedAnalytics: true,
    prioritySupport: true,
    customReports: true,
    apiAccess: true,
    multipleStrategies: true,
  },
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    tier: 'free',
    name: 'Starter',
    price: 'Free',
    description: 'Perfect for beginners getting started with trading',
    features: [
      { name: 'Up to 2 trading accounts', included: true },
      { name: 'Basic trade logging', included: true },
      { name: 'Simple analytics', included: true },
      { name: 'Mobile app access', included: true },
      { name: 'Advanced analytics', included: false },
      { name: 'Custom reports', included: false },
      { name: 'Priority support', included: false },
      { name: 'API access', included: false },
    ],
    limits: TIER_LIMITS.free,
    ctaText: 'Get Started',
    ctaLink: '/register',
  },
  {
    tier: 'pro',
    name: 'Professional',
    price: '$19',
    period: 'month',
    description: 'Advanced features for serious traders',
    features: [
      { name: 'Up to 10 trading accounts', included: true },
      { name: 'Advanced trade logging', included: true },
      { name: 'Advanced analytics & insights', included: true },
      { name: 'Custom reports & exports', included: true },
      { name: 'Multiple trading strategies', included: true },
      { name: 'Priority email support', included: true },
      { name: 'Mobile app access', included: true },
      { name: 'API access', included: false },
    ],
    limits: TIER_LIMITS.pro,
    popular: true,
    ctaText: 'Start Free Trial',
    ctaLink: '/pricing',
  },
  {
    tier: 'enterprise',
    name: 'Enterprise',
    price: '$99',
    period: 'month',
    description: 'Complete solution for professional trading teams',
    features: [
      { name: 'Unlimited trading accounts', included: true },
      { name: 'Advanced trade logging', included: true },
      { name: 'Advanced analytics & insights', included: true },
      { name: 'Custom reports & exports', included: true },
      { name: 'Multiple trading strategies', included: true },
      { name: 'Priority phone & email support', included: true },
      { name: 'API access & integrations', included: true },
      { name: 'Custom integrations', included: true },
    ],
    limits: TIER_LIMITS.enterprise,
    ctaText: 'Contact Sales',
    ctaLink: '/contact',
  },
];

export const getTierDisplayName = (tier: SubscriptionTier): string => {
  const plan = SUBSCRIPTION_PLANS.find(p => p.tier === tier);
  return plan?.name || tier.charAt(0).toUpperCase() + tier.slice(1);
};

export const getTierLimits = (tier: SubscriptionTier): TierLimits => {
  return TIER_LIMITS[tier];
};

export const canAccessFeature = (userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean => {
  const tierOrder: SubscriptionTier[] = ['free', 'pro', 'enterprise'];
  const userTierIndex = tierOrder.indexOf(userTier);
  const requiredTierIndex = tierOrder.indexOf(requiredTier);
  return userTierIndex >= requiredTierIndex;
};

export const isTrialExpired = (trialEndDate?: string): boolean => {
  if (!trialEndDate) return false;
  return new Date() > new Date(trialEndDate);
};

export const isSubscriptionActive = (status: SubscriptionStatus, trialEndDate?: string): boolean => {
  if (status === 'active') return true;
  if (status === 'trial') return !isTrialExpired(trialEndDate);
  return false;
};