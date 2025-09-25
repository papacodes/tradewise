import { useState, useEffect, createContext, ReactNode } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';
import { 
  SubscriptionInfo, 
  SubscriptionTier, 
  SubscriptionStatus,
  getTierLimits
} from '../types/subscription';

interface SubscriptionContextType {
  subscriptionInfo: SubscriptionInfo | null;
  loading: boolean;
  error: string | null;
  canCreateAccount: boolean;
  accountCounts: { accounts: number };
  maxAccounts: number;
  refreshSubscription: () => Promise<void>;
  checkAccountLimit: () => Promise<boolean>;
}

export const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountCount, setAccountCount] = useState(0);
  const [canCreateAccount, setCanCreateAccount] = useState(false);

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch user profile with subscription info
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          subscription_tier,
          subscription_status,
          subscription_start_date,
          subscription_end_date,
          trial_end_date,
          stripe_customer_id,
          stripe_subscription_id
        `)
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (profile) {
        setSubscription({
          tier: profile.subscription_tier as SubscriptionTier,
          status: profile.subscription_status as SubscriptionStatus,
          startDate: profile.subscription_start_date,
          endDate: profile.subscription_end_date,
          trialEndDate: profile.trial_end_date,
          stripeCustomerId: profile.stripe_customer_id,
          stripeSubscriptionId: profile.stripe_subscription_id,
        });
      }

      // Fetch account count
      const { count, error: countError } = await supabase
        .from('trading_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) throw countError;

      setAccountCount(count || 0);

    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
    } finally {
      setLoading(false);
    }
  };

  const checkAccountLimit = async (): Promise<boolean> => {
    if (!user || !subscription) return false;

    try {
      const { data, error } = await supabase
        .rpc('can_create_account', { user_uuid: user.id });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error checking account limit:', err);
      return false;
    }
  };

  // Update canCreateAccount when subscription or accountCount changes
  useEffect(() => {
    if (subscription) {
      const limits = getTierLimits(subscription.tier);
      const maxAccounts = limits.maxAccounts;
      
      if (maxAccounts === -1) {
        setCanCreateAccount(true); // unlimited
      } else {
        setCanCreateAccount(accountCount < maxAccounts);
      }
    }
  }, [subscription, accountCount]);

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  const maxAccounts = subscription ? getTierLimits(subscription.tier).maxAccounts : 0;

  const value: SubscriptionContextType = {
    subscriptionInfo: subscription,
    loading,
    error,
    canCreateAccount,
    accountCounts: { accounts: accountCount },
    maxAccounts,
    refreshSubscription: fetchSubscription,
    checkAccountLimit,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// Hooks are now exported from useSubscriptionHooks.ts to maintain Fast Refresh compatibility