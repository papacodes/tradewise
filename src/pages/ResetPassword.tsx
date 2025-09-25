import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, Lock, CheckCircle, TrendingUp, Menu } from 'lucide-react';

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const ResetPassword: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
  });

  const password = watch('password');

  useEffect(() => {
    document.title = 'Reset Password - TradeTrackr';
    
    // Check if we have valid reset tokens in the URL
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const type = searchParams.get('type');
    
    // Validate that this is a password reset link with required parameters
    if (accessToken && refreshToken && type === 'recovery') {
      setIsValidToken(true);
      // Let Supabase handle the session automatically through auth state listener
    } else {
      setIsValidToken(false);
      setAuthError('Invalid or missing reset parameters in the URL.');
    }

    // Listen for auth state changes to handle session automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'PASSWORD_RECOVERY') {
          // User has successfully authenticated via the reset link
          setIsValidToken(true);
          setAuthError(null);
        } else if (event === 'SIGNED_OUT' && isValidToken) {
          // Session expired or invalid
          setIsValidToken(false);
          setAuthError('Your session has expired. Please request a new password reset link.');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [searchParams, isValidToken]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });
      
      if (error) {
        setError('root', {
          message: error.message || 'Failed to reset password. Please try again.',
        });
      } else {
        setIsSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch {
      setError('root', {
        message: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking token validity
  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Show error if token is invalid
  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-700 px-4 sm:px-6 lg:px-10 py-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
            <h1 className="text-white text-base sm:text-lg font-bold">TradeTrackr</h1>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 lg:px-40 py-6 sm:py-8 lg:py-10">
          <div className="w-full max-w-sm sm:max-w-md lg:max-w-2xl text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-red-600/20 rounded-full mb-3 sm:mb-4">
              <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />
            </div>
            <h2 className="text-white text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3">
              Invalid or Expired Link
            </h2>
            <p className="text-gray-300 text-sm sm:text-base mb-6 sm:mb-8 px-2">
              {authError || 'This password reset link is invalid or has expired. Please request a new password reset.'}
            </p>
            
            <div className="space-y-4">
              <Link
                to="/forgot-password"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-3 rounded-lg text-sm sm:text-base font-bold transition-colors min-h-[48px] touch-manipulation"
              >
                Request New Reset Link
              </Link>
              
              <div>
                <Link 
                  to="/login" 
                  className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-700 px-4 sm:px-6 lg:px-10 py-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
          <h1 className="text-white text-base sm:text-lg font-bold">TradeTrackr</h1>
        </div>
        <div className="flex items-center gap-4 sm:gap-8">
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-9">
            <Link to="/" className="text-white text-sm font-medium hover:text-blue-400 transition-colors">
              Home
            </Link>
            <Link to="/features" className="text-white text-sm font-medium hover:text-blue-400 transition-colors">
              Features
            </Link>
            <Link to="/pricing" className="text-white text-sm font-medium hover:text-blue-400 transition-colors">
              Pricing
            </Link>
            <Link to="/support" className="text-white text-sm font-medium hover:text-blue-400 transition-colors">
              Support
            </Link>
          </nav>
          <Link
            to="/register"
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors"
          >
            <span className="hidden sm:inline">Get Started</span>
            <span className="sm:hidden">Sign Up</span>
          </Link>
          {/* Mobile Menu Button */}
          <button className="md:hidden text-white p-1">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 lg:px-40 py-6 sm:py-8 lg:py-10">
        <div className="w-full max-w-sm sm:max-w-md lg:max-w-2xl">
          {!isSuccess ? (
            <>
              <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-600/20 rounded-full mb-3 sm:mb-4">
                  <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                </div>
                <h2 className="text-white text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3">
                  Set New Password
                </h2>
                <p className="text-gray-300 text-sm sm:text-base px-2">
                  Enter your new password below. Make sure it's strong and secure.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                {/* Password Field */}
                <div>
                  <div className={`bg-gray-800 rounded-lg p-4 flex items-center min-h-[48px] ${errors.password ? 'border border-red-500/50' : ''}`}>
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="New password"
                      className="flex-1 bg-transparent text-gray-300 placeholder-gray-500 outline-none text-base"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-500 hover:text-gray-300 ml-2 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
                  )}
                  
                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full ${
                          password.length >= 8 ? 'bg-green-500' : 'bg-gray-600'
                        }`}></div>
                        <span className={password.length >= 8 ? 'text-green-400' : 'text-gray-400'}>
                          At least 8 characters
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full ${
                          /[A-Z]/.test(password) ? 'bg-green-500' : 'bg-gray-600'
                        }`}></div>
                        <span className={/[A-Z]/.test(password) ? 'text-green-400' : 'text-gray-400'}>
                          One uppercase letter
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full ${
                          /[a-z]/.test(password) ? 'bg-green-500' : 'bg-gray-600'
                        }`}></div>
                        <span className={/[a-z]/.test(password) ? 'text-green-400' : 'text-gray-400'}>
                          One lowercase letter
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full ${
                          /\d/.test(password) ? 'bg-green-500' : 'bg-gray-600'
                        }`}></div>
                        <span className={/\d/.test(password) ? 'text-green-400' : 'text-gray-400'}>
                          One number
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <div className={`bg-gray-800 rounded-lg p-4 flex items-center min-h-[48px] ${errors.confirmPassword ? 'border border-red-500/50' : ''}`}>
                    <input
                      {...register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      className="flex-1 bg-transparent text-gray-300 placeholder-gray-500 outline-none text-base"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-gray-500 hover:text-gray-300 ml-2 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-400 text-sm mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Error Message */}
                {errors.root && (
                  <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3 sm:p-4">
                    <p className="text-red-400 text-sm">{errors.root.message}</p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white px-4 sm:px-6 py-3 rounded-lg text-sm sm:text-base font-bold transition-colors min-h-[48px] touch-manipulation"
                  >
                    {isLoading ? 'Updating Password...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-green-600/20 rounded-full mb-3 sm:mb-4">
                  <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
                </div>
                <h2 className="text-white text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3">
                  Password Updated Successfully
                </h2>
                <p className="text-gray-300 text-sm sm:text-base mb-6 px-2">
                  Your password has been updated successfully. You will be redirected to the login page shortly.
                </p>
                
                <div className="space-y-4">
                  <Link
                    to="/login"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-3 rounded-lg text-sm sm:text-base font-bold transition-colors min-h-[48px] touch-manipulation"
                  >
                    Go to Login
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};