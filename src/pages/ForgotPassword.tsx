import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Mail, TrendingUp, Menu } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPassword: React.FC = React.memo(() => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    trigger,
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    document.title = 'Forgot Password - TradeTrackr';
  }, []);

  const onSubmit = useCallback(async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        setError('root', {
          message: error.message || 'Failed to send reset email. Please try again.',
        });
      } else {
        setIsSuccess(true);
      }
    } catch {
      setError('root', {
        message: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [setError]);

  const handleResendEmail = useCallback(async () => {
    const email = getValues('email');
    if (email) {
      setIsLoading(true);
      try {
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
      } catch (error) {
        console.error('Error resending email:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [getValues]);

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
          {/* Back to Login Link */}
          <div className="mb-6">
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
            >
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </div>

          {!isSuccess ? (
            <>
              <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-600/20 rounded-full mb-3 sm:mb-4">
                  <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                </div>
                <h2 className="text-white text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3">
                  Forgot your password?
                </h2>
                <p className="text-gray-300 text-sm sm:text-base px-2">
                  No worries! Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" role="form" aria-labelledby="forgot-password-heading">
                {/* Email Field */}
                <div>
                  <div className={`bg-gray-800 rounded-lg p-4 ${errors.email ? 'border border-red-500/50' : ''}`}>
                    <input
                      {...register('email', {
                        onChange: () => trigger('email')
                      })}
                      type="text"
                      placeholder="Enter your email address"
                      className="w-full bg-transparent text-gray-300 placeholder-gray-500 outline-none text-base"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                {/* Error Message */}
                {errors.root && (
                  <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{errors.root.message}</p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 min-h-[52px] touch-manipulation"
                    aria-describedby={errors.root ? 'forgot-password-error' : undefined}
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-green-600/20 rounded-full mb-3 sm:mb-4">
                  <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
                </div>
                <h2 className="text-white text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3">
                  Check your email
                </h2>
                <p className="text-gray-300 text-sm sm:text-base mb-4 sm:mb-6 px-2">
                  We've sent a password reset link to <span className="text-white font-medium break-all">{getValues('email')}</span>
                </p>
                <p className="text-gray-400 text-xs sm:text-sm mb-6 sm:mb-8 px-2">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                
                <div className="space-y-4">
                  <button
                    onClick={handleResendEmail}
                    disabled={isLoading}
                    className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg text-sm font-medium transition-colors min-h-[48px] touch-manipulation"
                  >
                    {isLoading ? 'Sending...' : 'Resend Email'}
                  </button>
                  
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
            </>
          )}
        </div>
      </main>
    </div>
  );
});