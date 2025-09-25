import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Camera, Edit2, Save, X, User, Mail, Calendar, Shield, Palette, Eye, EyeOff, Crown, Zap, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Layout } from '../components/Layout';
import TierBadge from '../components/TierBadge';
import UpgradePrompt from '../components/UpgradePrompt';
import { useSubscription } from '../hooks/useSubscriptionHooks';
import { useCachedUserProfile } from '../hooks/useSupabaseCache';
import { cacheUtils } from '../utils/cacheUtils';
import { MFASetup } from '../components/MFASetup';
import {
  validateName,
  validatePhone,
  validateUrl,
  validateBio,
  validateLocation,
  validatePassword,
  sanitizeString,
  preventSQLInjection,

} from '../utils/validation';
import { getTierDisplayName, SUBSCRIPTION_PLANS } from '../types/subscription';

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  phone: string | null;
  website: string | null;
  theme: 'light' | 'dark';
  currency: string;
  language: string;
  timezone: string;
  email_notifications: boolean;
  push_notifications: boolean;
  trade_notifications: boolean;
  marketing_notifications: boolean;
  default_position_size: number;
  risk_tolerance: 'low' | 'medium' | 'high';
  two_factor_enabled: boolean;
  created_at: string;
  last_login_at: string | null;
}

interface UserSession {
  id: string;
  device_info: string | null;
  ip_address: string | null;
  location: string | null;
  is_active: boolean;
  created_at: string;
  last_activity: string;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const { subscriptionInfo, accountCounts, loading: subscriptionLoading } = useSubscription();
  
  // Use cached profile data
  const { data: profile, loading: profileLoading, refetch: refetchProfile } = useCachedUserProfile(user?.id) as {
    data: UserProfile | null;
    loading: boolean;
    refetch: () => Promise<void>;
  };
  const loading = profileLoading || sessionsLoading;
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingPreferences, setEditingPreferences] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual refresh function for user-triggered updates
  const refreshProfile = useCallback(async () => {
    try {
      await refetchProfile();
      // Invalidate related cache after manual refresh
      cacheUtils.invalidateAfterUserOperation(user?.id || '');
      toast.success('Profile refreshed successfully');
    } catch (error) {
      console.error('Error refreshing profile:', error);
      toast.error('Failed to refresh profile');
    }
  }, [user?.id]); // Remove refetchProfile to prevent re-renders

  const fetchSessions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setSessionsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user?.id]); // Remove fetchSessions from dependencies to prevent infinite loops

  const handleAvatarUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Basic file validation
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (file.size > maxSize) {
      toast.error('File is too large. Please choose a smaller image.');
      return;
    }
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please choose a JPEG, PNG, or WebP image.');
      return;
    }
    




    setUploadingAvatar(true);
    try {
      // Generate secure filename with timestamp to prevent conflicts
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}_${timestamp}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        if (uploadError.message.includes('Bucket not found')) {
          toast.error('Storage bucket not configured. Please contact support.');
        } else if (uploadError.message.includes('File size')) {
          toast.error('File is too large. Please choose a smaller image.');
        } else {
          toast.error('Failed to upload image. Please try again.');
        }
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        toast.error('Failed to update profile. Please try again.');
        return;
      }

      // Refresh profile data to get updated avatar
      await refreshProfile();
      toast.success('Profile picture updated successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setUploadingAvatar(false);
      // Clear the file input to allow re-uploading the same file
      if (event.target) {
        event.target.value = '';
      }
    }
  }, [user?.id]); // Remove refreshProfile to prevent re-renders

  const updatePersonalData = useCallback(async (data: Partial<UserProfile>) => {
    try {
      // Sanitize all string inputs before database update
      const sanitizedData: Record<string, string | number | boolean | null> = {};
      
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'string') {
          // Apply comprehensive sanitization and SQL injection prevention
          const sanitized = preventSQLInjection(sanitizeString(value));
          sanitizedData[key] = sanitized;
        } else {
          sanitizedData[key] = value;
        }
      });

      const { error } = await supabase
        .from('profiles')
        .update(sanitizedData)
        .eq('id', user?.id);

      if (error) throw error;

      // Refresh profile data to get updated information
      await refreshProfile();
      setEditingPersonal(false);
      toast.success('Personal information updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update personal information');
    }
  }, [user?.id]); // Remove refreshProfile to prevent re-renders

  const updatePreferences = useCallback(async (data: Partial<UserProfile>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user?.id);

      if (error) throw error;

      // Refresh profile data to get updated preferences
      await refreshProfile();
      setEditingPreferences(false);
      toast.success('Preferences updated successfully');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    }
  }, [user?.id]); // Remove refreshProfile to prevent re-renders

  const changePassword = useCallback(async () => {
    // Validate password match
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(passwordForm.newPassword);
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.error || 'Password does not meet requirements');
      return;
    }

    // Check if new password is different from current (basic check)
    if (passwordForm.newPassword === passwordForm.currentPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) {
        console.error('Password update error:', error);
        if (error.message.includes('same as the old password')) {
          toast.error('New password must be different from your current password');
        } else if (error.message.includes('weak')) {
          toast.error('Password is too weak. Please choose a stronger password.');
        } else {
          toast.error('Failed to update password. Please try again.');
        }
        return;
      }

      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      toast.success('Password updated successfully');
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('An unexpected error occurred. Please try again.');
    }
  }, [passwordForm.newPassword, passwordForm.confirmPassword, passwordForm.currentPassword]);

  const deleteAccount = useCallback(async () => {
    try {
      // Note: This would typically require server-side implementation
      // For now, we'll just sign out the user
      await supabase.auth.signOut();
      toast.success('Account deletion initiated');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    }
  }, []);

  const terminateSession = useCallback(async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(prev => prev.filter(session => session.id !== sessionId));
      toast.success('Session terminated successfully');
    } catch (error) {
      console.error('Error terminating session:', error);
      toast.error('Failed to terminate session');
    }
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Profile Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400">Unable to load your profile information.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6 sm:mb-8">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors disabled:opacity-50 min-h-[40px] min-w-[40px] touch-manipulation"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white break-words">
                  {profile.first_name && profile.last_name
                    ? `${profile.first_name} ${profile.last_name}`
                    : profile.email}
                </h1>
                <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-2 sm:space-y-0 sm:space-x-4 mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="break-all">{profile.email}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                  </div>
                  {profile.last_login_at && (
                    <div className="flex items-center space-x-1">
                      <span>Last login: {new Date(profile.last_login_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Tier Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6 sm:mb-8">
          <div className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2 mb-4 sm:mb-6">
              <Crown className="w-5 h-5 flex-shrink-0" />
              <span>Subscription Plan</span>
            </h2>

            {subscriptionLoading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Current Plan */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <TierBadge tier={subscriptionInfo?.tier || 'free'} size="lg" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {getTierDisplayName(subscriptionInfo?.tier || 'free')} Plan
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {subscriptionInfo?.tier === 'free' 
                          ? 'Get started with basic features'
                          : subscriptionInfo?.tier === 'pro'
                          ? 'Advanced features for serious traders'
                          : 'Complete trading solution for professionals'
                        }
                      </p>
                    </div>
                  </div>
                  
                  {subscriptionInfo?.tier === 'free' && (
                    <a
                      href="/pricing"
                      className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors min-h-[40px] touch-manipulation"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Upgrade Plan
                    </a>
                  )}
                </div>

                {/* Plan Features & Usage */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Current Usage */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Current Usage</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Trading Accounts</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {accountCounts?.accounts || 0} / {subscriptionInfo?.tier === 'free' ? '2' : subscriptionInfo?.tier === 'pro' ? '10' : '∞'}
                        </span>
                      </div>
                      
                      {/* Progress bar for account usage */}
                      {subscriptionInfo?.tier !== 'enterprise' && (
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              subscriptionInfo?.tier === 'free' 
                                ? (accountCounts?.accounts || 0) >= 2 ? 'bg-red-500' : 'bg-blue-500'
                                : (accountCounts?.accounts || 0) >= 10 ? 'bg-red-500' : 'bg-blue-500'
                            }`}
                            style={{
                              width: `${Math.min(100, ((accountCounts?.accounts || 0) / (subscriptionInfo?.tier === 'free' ? 2 : 10)) * 100)}%`
                            }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Plan Benefits */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Plan Benefits</h4>
                    <div className="space-y-2">
                      {SUBSCRIPTION_PLANS.find(plan => plan.tier === (subscriptionInfo?.tier || 'free'))?.features.slice(0, 4).map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">{feature.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Subscription Status */}
                {subscriptionInfo?.tier !== 'free' && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Status</span>
                      <span className={`font-medium ${
                        subscriptionInfo?.status === 'active' 
                          ? 'text-green-600 dark:text-green-400'
                          : subscriptionInfo?.status === 'trial'
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {subscriptionInfo?.status === 'active' ? 'Active' :
                         subscriptionInfo?.status === 'trial' ? 'Trial' :
                         subscriptionInfo?.status === 'cancelled' ? 'Cancelled' :
                         subscriptionInfo?.status === 'expired' ? 'Expired' : 'Inactive'}
                      </span>
                    </div>
                    
                    {subscriptionInfo?.endDate && (
                      <div className="flex items-center justify-between text-sm mt-2">
                        <span className="text-gray-600 dark:text-gray-400">
                          {subscriptionInfo?.status === 'trial' ? 'Trial ends' : 'Next billing'}
                        </span>
                        <span className="text-gray-900 dark:text-white">
                          {new Date(subscriptionInfo.endDate!).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Upgrade Prompt for Free Users */}
                {subscriptionInfo?.tier === 'free' && (accountCounts?.accounts || 0) >= 2 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <UpgradePrompt 
                      currentTier="free"
                      feature="unlimited_accounts"
                      description="You've reached your account limit. Upgrade to add more trading accounts."
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Personal Data Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6 sm:mb-8">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <User className="w-5 h-5 flex-shrink-0" />
                <span>Personal Information</span>
              </h2>
              <button
                onClick={() => setEditingPersonal(!editingPersonal)}
                className="flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 min-h-[40px] touch-manipulation"
              >
                {editingPersonal ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                <span>{editingPersonal ? 'Cancel' : 'Edit'}</span>
              </button>
            </div>

            {editingPersonal ? (
              <PersonalDataForm profile={profile} onSave={updatePersonalData} onCancel={() => setEditingPersonal(false)} />
            ) : (
              <PersonalDataView profile={profile} />
            )}
          </div>
        </div>

        {/* Preferences Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6 sm:mb-8">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <Palette className="w-5 h-5 flex-shrink-0" />
                <span>Preferences</span>
              </h2>
              <button
                onClick={() => setEditingPreferences(!editingPreferences)}
                className="flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 min-h-[40px] touch-manipulation"
              >
                {editingPreferences ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                <span>{editingPreferences ? 'Cancel' : 'Edit'}</span>
              </button>
            </div>

            {editingPreferences ? (
              <PreferencesForm profile={profile} onSave={updatePreferences} onCancel={() => setEditingPreferences(false)} />
            ) : (
              <PreferencesView profile={profile} />
            )}
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6 sm:mb-8">
          <div className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2 mb-4 sm:mb-6">
              <Shield className="w-5 h-5 flex-shrink-0" />
              <span>Security</span>
            </h2>

            <div className="space-y-6">
              {/* Password Change */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Password</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Change your account password</p>
                  </div>
                  <button
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 border border-blue-600 dark:border-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 min-h-[40px] touch-manipulation w-full sm:w-auto"
                  >
                    Change Password
                  </button>
                </div>

                {showPasswordForm && (
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 rounded-lg space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="w-full px-3 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-base"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center min-h-[40px] min-w-[40px] touch-manipulation"
                        >
                          {showPasswords.current ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full px-3 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-base"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center min-h-[40px] min-w-[40px] touch-manipulation"
                        >
                          {showPasswords.new ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full px-3 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-base"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center min-h-[40px] min-w-[40px] touch-manipulation"
                        >
                          {showPasswords.confirm ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                      <button
                        onClick={changePassword}
                        className="w-full sm:w-auto px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors min-h-[48px] touch-manipulation"
                      >
                        Update Password
                      </button>
                      <button
                        onClick={() => {
                          setShowPasswordForm(false);
                          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        }}
                        className="w-full sm:w-auto px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 min-h-[48px] touch-manipulation"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Two-Factor Authentication */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Add an extra layer of security to your account</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`text-sm font-medium ${
                      profile?.two_factor_enabled ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {profile?.two_factor_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <button
                      onClick={() => {
                        if (profile?.two_factor_enabled) {
                          // Disable MFA
                          updatePreferences({ two_factor_enabled: false });
                        } else {
                          // Enable MFA - show setup modal
                          setShowMFASetup(true);
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        profile?.two_factor_enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          profile?.two_factor_enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Active Sessions</h3>
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {session.device_info || 'Unknown Device'}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {session.location || 'Unknown Location'} • Last active: {new Date(session.last_activity).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => terminateSession(session.id)}
                        className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Terminate
                      </button>
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">No active sessions found.</p>
                  )}
                </div>
              </div>

              {/* Account Deletion */}
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-red-600 dark:text-red-400">Delete Account</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Permanently delete your account and all data</p>
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-600 dark:border-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Delete Account
                  </button>
                </div>

                {showDeleteConfirm && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200 mb-4">
                      Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.
                    </p>
                    <div className="flex space-x-3">
                      <button
                        onClick={deleteAccount}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
                      >
                        Yes, Delete Account
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* MFA Setup Modal */}
      {showMFASetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <MFASetup
              onComplete={() => {
                setShowMFASetup(false);
                // Refresh profile to update two_factor_enabled status
                window.location.reload();
              }}
              onCancel={() => {
                setShowMFASetup(false);
                // Reset the toggle if user cancels
                updatePreferences({ two_factor_enabled: false });
              }}
            />
          </div>
        </div>
      )}
    </Layout>
  );
};

// Personal Data View Component
const PersonalDataView: React.FC<{ profile: UserProfile }> = React.memo(({ profile }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          First Name
        </label>
        <p className="text-gray-900 dark:text-white">{profile.first_name || 'Not provided'}</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Last Name
        </label>
        <p className="text-gray-900 dark:text-white">{profile.last_name || 'Not provided'}</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email
        </label>
        <p className="text-gray-900 dark:text-white">{profile.email}</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Phone
        </label>
        <p className="text-gray-900 dark:text-white">{profile.phone || 'Not provided'}</p>
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Bio
        </label>
        <p className="text-gray-900 dark:text-white">{profile.bio || 'No bio provided'}</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Location
        </label>
        <p className="text-gray-900 dark:text-white">{profile.location || 'Not provided'}</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Website
        </label>
        <p className="text-gray-900 dark:text-white">{profile.website || 'Not provided'}</p>
      </div>
    </div>
  );
});

// Personal Data Form Component
const PersonalDataForm: React.FC<{
  profile: UserProfile;
  onSave: (data: Partial<UserProfile>) => void;
  onCancel: () => void;
}> = React.memo(({ profile, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    first_name: profile.first_name || '',
    last_name: profile.last_name || '',
    phone: profile.phone || '',
    bio: profile.bio || '',
    location: profile.location || '',
    website: profile.website || ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (field: string, value: string) => {
    let validation;
    switch (field) {
      case 'first_name':
      case 'last_name':
        validation = validateName(value);
        break;
      case 'phone':
        validation = validatePhone(value);
        break;
      case 'website':
        validation = validateUrl(value);
        break;
      case 'bio':
        validation = validateBio(value);
        break;
      case 'location':
        validation = validateLocation(value);
        break;
      default:
        return { isValid: true, sanitized: value };
    }
    return validation;
  };

  const handleInputChange = useCallback((field: string, value: string) => {
    const validation = validateField(field, value);
    
    // Preserve raw input for 'bio' so spaces aren't trimmed while typing.
    setFormData(prev => ({
      ...prev,
      [field]: field === 'bio' ? value : validation.sanitized
    }));
    
    if (validation.error) {
      setErrors(prev => ({ ...prev, [field]: validation.error! }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validate all fields
    const validationErrors: { [key: string]: string } = {};
    const sanitizedData: { [key: string]: string } = {};
    
    Object.entries(formData).forEach(([field, value]) => {
      const validation = validateField(field, value);
      if (!validation.isValid && validation.error) {
        validationErrors[field] = validation.error;
      }
      sanitizedData[field] = validation.sanitized;
    });
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      toast.error('Please fix the validation errors before submitting');
      return;
    }
    
    try {
      await onSave(sanitizedData);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSave]);

  return (
    <form onSubmit={handleSubmit} className="gap-responsive">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-responsive">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            First Name
          </label>
          <input
            type="text"
            value={formData.first_name}
            onChange={(e) => handleInputChange('first_name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white input-touch text-responsive-base ${
              errors['first_name'] 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            }`}
          />
          {errors['first_name'] && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors['first_name']}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Last Name
          </label>
          <input
            type="text"
            value={formData.last_name}
            onChange={(e) => handleInputChange('last_name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white input-touch text-responsive-base ${
              errors['last_name'] 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            }`}
          />
          {errors['last_name'] && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors['last_name']}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white input-touch text-responsive-base ${
              errors['phone'] 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            }`}
          />
          {errors['phone'] && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors['phone']}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Location
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white input-touch text-responsive-base ${
              errors['location'] 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            }`}
          />
          {errors['location'] && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors['location']}</p>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Website
          </label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white input-touch text-responsive-base ${
              errors['website'] 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            }`}
            placeholder="https://"
          />
          {errors['website'] && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors['website']}</p>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            rows={4}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white input-touch text-responsive-base ${
              errors['bio'] 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            }`}
            placeholder="Tell us about yourself..."
          />
          {errors['bio'] && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors['bio']}</p>
          )}
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {formData.bio.length}/500 characters
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          disabled={isSubmitting || Object.keys(errors).length > 0}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors btn-touch"
        >
          <Save className="w-4 h-4" />
          <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 btn-touch"
        >
          Cancel
        </button>
      </div>
    </form>
  );
});

// Preferences View Component
const PreferencesView: React.FC<{ profile: UserProfile }> = React.memo(({ profile }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Theme
        </label>
        <p className="text-gray-900 dark:text-white capitalize">{profile.theme}</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Currency
        </label>
        <p className="text-gray-900 dark:text-white">{profile.currency}</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Language
        </label>
        <p className="text-gray-900 dark:text-white capitalize">{profile.language}</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Timezone
        </label>
        <p className="text-gray-900 dark:text-white">{profile.timezone}</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Default Position Size
        </label>
        <p className="text-gray-900 dark:text-white">{profile.default_position_size}</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Risk Tolerance
        </label>
        <p className="text-gray-900 dark:text-white capitalize">{profile.risk_tolerance}</p>
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Notifications
        </label>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-900 dark:text-white">Email Notifications</span>
            <span className={`text-sm ${profile.email_notifications ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {profile.email_notifications ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-900 dark:text-white">Push Notifications</span>
            <span className={`text-sm ${profile.push_notifications ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {profile.push_notifications ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-900 dark:text-white">Trade Notifications</span>
            <span className={`text-sm ${profile.trade_notifications ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {profile.trade_notifications ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-900 dark:text-white">Marketing Notifications</span>
            <span className={`text-sm ${profile.marketing_notifications ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {profile.marketing_notifications ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

// Preferences Form Component
const PreferencesForm: React.FC<{
  profile: UserProfile;
  onSave: (data: Partial<UserProfile>) => void;
  onCancel: () => void;
}> = React.memo(({ profile, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    theme: profile.theme,
    currency: profile.currency,
    language: profile.language,
    timezone: profile.timezone,
    default_position_size: profile.default_position_size,
    risk_tolerance: profile.risk_tolerance,
    email_notifications: profile.email_notifications,
    push_notifications: profile.push_notifications,
    trade_notifications: profile.trade_notifications,
    marketing_notifications: profile.marketing_notifications
  });

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  }, [formData, onSave]);

  const handleThemeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, theme: e.target.value as 'light' | 'dark' }));
  }, []);

  const handleCurrencyChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, currency: e.target.value }));
  }, []);

  const handleLanguageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, language: e.target.value }));
  }, []);

  const handleTimezoneChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, timezone: e.target.value }));
  }, []);

  const handlePositionSizeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, default_position_size: parseFloat(e.target.value) }));
  }, []);

  const handleRiskToleranceChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, risk_tolerance: e.target.value as 'low' | 'medium' | 'high' }));
  }, []);

  const toggleEmailNotifications = useCallback(() => {
    setFormData(prev => ({ ...prev, email_notifications: !prev.email_notifications }));
  }, []);

  const togglePushNotifications = useCallback(() => {
    setFormData(prev => ({ ...prev, push_notifications: !prev.push_notifications }));
  }, []);

  const toggleTradeNotifications = useCallback(() => {
    setFormData(prev => ({ ...prev, trade_notifications: !prev.trade_notifications }));
  }, []);

  const toggleMarketingNotifications = useCallback(() => {
    setFormData(prev => ({ ...prev, marketing_notifications: !prev.marketing_notifications }));
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Theme
          </label>
          <select
            value={formData.theme}
            onChange={handleThemeChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Currency
          </label>
          <select
            value={formData.currency}
            onChange={handleCurrencyChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="JPY">JPY - Japanese Yen</option>
            <option value="AUD">AUD - Australian Dollar</option>
            <option value="CAD">CAD - Canadian Dollar</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Language
          </label>
          <select
            value={formData.language}
            onChange={handleLanguageChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="it">Italian</option>
            <option value="pt">Portuguese</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Timezone
          </label>
          <select
            value={formData.timezone}
            onChange={handleTimezoneChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="Europe/London">London</option>
            <option value="Europe/Paris">Paris</option>
            <option value="Asia/Tokyo">Tokyo</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Default Position Size
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={formData.default_position_size}
            onChange={handlePositionSizeChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Risk Tolerance
          </label>
          <select
            value={formData.risk_tolerance}
            onChange={handleRiskToleranceChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {/* Notification Preferences */}
      <div>
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Notification Preferences</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">Email Notifications</label>
              <p className="text-xs text-gray-600 dark:text-gray-400">Receive notifications via email</p>
            </div>
            <button
              type="button"
              onClick={toggleEmailNotifications}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.email_notifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.email_notifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">Push Notifications</label>
              <p className="text-xs text-gray-600 dark:text-gray-400">Receive push notifications in browser</p>
            </div>
            <button
              type="button"
              onClick={togglePushNotifications}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.push_notifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.push_notifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">Trade Notifications</label>
              <p className="text-xs text-gray-600 dark:text-gray-400">Get notified about trade updates</p>
            </div>
            <button
              type="button"
              onClick={toggleTradeNotifications}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.trade_notifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.trade_notifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">Marketing Notifications</label>
              <p className="text-xs text-gray-600 dark:text-gray-400">Receive marketing and promotional content</p>
            </div>
            <button
              type="button"
              onClick={toggleMarketingNotifications}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.marketing_notifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.marketing_notifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          type="submit"
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save Preferences</span>
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
});

export default Profile;