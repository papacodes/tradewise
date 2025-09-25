import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Mail } from 'lucide-react';

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
    document.title = 'Forgot Password - TradeWise';
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
      <header className="flex items-center justify-between border-b border-gray-700 px-10 py-3">
        <div className="flex items-center gap-4">
          <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
          <h1 className="text-white text-lg font-bold">TradeWise</h1>
        </div>
        <div className="flex items-center gap-8">
          <nav className="flex items-center gap-9">
            <Link to="/" className="text-white text-sm font-medium hover:text-blue-400 transition-colors">
              Home
            </Link>
            <span className="text-white text-sm font-medium">Features</span>
            <span className="text-white text-sm font-medium">Pricing</span>
            <span className="text-white text-sm font-medium">Support</span>
          </nav>
          <Link
            to="/register"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-40 py-10">
        <div className="w-full max-w-2xl">
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
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 rounded-full mb-4">
                  <Mail className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="text-white text-3xl font-bold mb-3">
                  Forgot your password?
                </h2>
                <p className="text-gray-300 text-base">
                  No worries! Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white px-56 py-3 rounded-lg text-base font-bold transition-colors"
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
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600/20 rounded-full mb-4">
                  <Mail className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-white text-3xl font-bold mb-3">
                  Check your email
                </h2>
                <p className="text-gray-300 text-base mb-6">
                  We've sent a password reset link to <span className="text-white font-medium">{getValues('email')}</span>
                </p>
                <p className="text-gray-400 text-sm mb-8">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                
                <div className="space-y-4">
                  <button
                    onClick={handleResendEmail}
                    disabled={isLoading}
                    className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white px-8 py-2 rounded-lg text-sm font-medium transition-colors"
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