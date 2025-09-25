import React, { createContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { clearAllCaches } from '../utils/cacheManager';
import { clearAllCache } from '../hooks/useSupabaseCache';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProviderComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 AuthContext: Initializing authentication...');
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔍 AuthContext: Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ AuthContext: Error getting session:', error);
        } else {
          console.log('📦 AuthContext: Initial session:', session ? 'Found' : 'None');
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        console.log('✅ AuthContext: Initial loading complete, loading set to false');
      } catch (error) {
        console.error('💥 AuthContext: Unexpected error getting session:', error);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    console.log('👂 AuthContext: Setting up auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 AuthContext: Auth state changed:', event, session ? 'Session exists' : 'No session');
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        console.log('✅ AuthContext: Auth state change processed, loading set to false');

        // Create or update profile when user signs up or signs in
        if (event === 'SIGNED_IN' && session?.user) {
          await createOrUpdateProfile(session.user);
        }
      }
    );

    return () => {
      console.log('🧹 AuthContext: Cleaning up auth listener...');
      subscription.unsubscribe();
    };
  }, []);

  const createOrUpdateProfile = async (user: User) => {
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!existingProfile) {
        // Create new profile
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            first_name: user.user_metadata?.['first_name'] || '',
            last_name: user.user_metadata?.['last_name'] || '',
          });

        if (error) {
          console.error('Error creating profile:', error);
        }
      }
    } catch (error) {
      console.error('Error managing profile:', error);
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (!error && data.user) {
      // Create or update profile with first and last name
      await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: data.user.email!,
          first_name: firstName,
          last_name: lastName,
          updated_at: new Date().toISOString(),
        });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔐 AuthContext: Attempting sign in...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ AuthContext: Sign in error:', error);
      return { error };
    }

    console.log('✅ AuthContext: Sign in successful, session:', data.session ? 'exists' : 'none');
    // The global auth state listener will handle updating the user/session state
    return { error: null };
  };

  const signOut = async () => {
    try {
      console.log('🚪 Starting user logout process...');
      
      // Clear all caches before signing out
      console.log('🧹 Clearing caches during logout...');
      clearAllCache(); // Clear in-memory cache
      await clearAllCaches({ skipVersionCheck: true, skipReload: true, logOperations: true }); // Clear browser storage
      
      // Use 'local' scope to avoid ERR_ABORTED errors
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) {
        console.error('Logout error:', error);
        // Even if there's an error, clear local state
        setUser(null);
        setSession(null);
      } else {
        console.log('✅ User logged out successfully');
      }
    } catch (error) {
      console.error('Unexpected logout error:', error);
      // Force clear local state on any error
      setUser(null);
      setSession(null);
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const AuthProvider = AuthProviderComponent;
export { AuthContext };