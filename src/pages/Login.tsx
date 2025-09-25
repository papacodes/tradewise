import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff, Menu, X, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { validateEmail, checkRateLimit } from '../utils/validation';

const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    trigger,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    document.title = 'Login - TradeWise';
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // Check rate limiting
      if (!checkRateLimit('login-attempt', 5, 15 * 60 * 1000)) {
        setError('root', {
          message: 'Too many login attempts. Please try again in 15 minutes.',
        });
        return;
      }
      
      // Validate email
      const emailValidation = validateEmail(data.email);
      if (!emailValidation.isValid) {
        setError('root', {
          message: emailValidation.error || 'Invalid email address',
        });
        return;
      }
      
      // Additional validation
      if (!data.password) {
        setError('root', {
          message: 'Please enter your password',
        });
        return;
      }
      
      if (data.password.length < 1) {
        setError('root', {
          message: 'Password cannot be empty',
        });
        return;
      }
      
      const { error } = await signIn(emailValidation.sanitized, data.password);
      
      if (error) {
        setError('root', {
          message: error.message || 'Invalid email or password',
        });
      } else {
        toast.success('Login successful!');
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('root', {
        message: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-700 px-10 py-3">
        <div className="flex items-center gap-4">
          <TrendingUp className="w-8 h-8 text-blue-400" />
          <h1 className="text-white text-lg font-bold">TradePro</h1>
        </div>
        <div className="flex items-center gap-8">
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-9">
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
            className="hidden md:block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          >
            Get Started
          </Link>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white hover:text-blue-400 transition-colors"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="fixed top-0 right-0 h-full w-64 bg-gray-900 border-l border-gray-700 z-50 transform transition-transform duration-300 ease-in-out">
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <span className="text-lg font-semibold text-white">Menu</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-white hover:text-blue-400 transition-colors"
                  aria-label="Close mobile menu"
                >
                  <X size={24} />
                </button>
              </div>
              <nav className="flex flex-col p-4 space-y-4">
                <Link
                  to="/"
                  className="text-white hover:text-blue-400 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/features"
                  className="text-white hover:text-blue-400 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link
                  to="/pricing"
                  className="text-white hover:text-blue-400 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link
                  to="/support"
                  className="text-white hover:text-blue-400 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Support
                </Link>
                <div className="pt-4 border-t border-gray-700">
                  <Link
                    to="/register"
                    className="block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center text-sm font-bold"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-40 py-10" role="main">
        <div className="w-full max-w-2xl">
          <h2 className="text-white text-3xl font-bold text-center mb-3" id="login-heading">
            Welcome to TradeWise
          </h2>
          <p className="text-white text-center mb-8">
            Track your trades, analyze your performance, and improve your trading strategy with TradeWise.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" role="form" aria-labelledby="login-heading">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="sr-only">Email Address</label>
              <div className={`bg-gray-800 rounded-lg p-4 ${errors.email ? 'border border-red-500/50' : ''}`}>
                <input
                  {...register('email', {
                    onChange: () => trigger('email')
                  })}
                  id="email"
                  type="email"
                  placeholder="Email"
                  className="w-full bg-transparent text-gray-300 placeholder-gray-500 outline-none text-base"
                  disabled={isLoading}
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm mt-1" id="email-error" role="alert">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="bg-gray-800 rounded-lg p-4 flex items-center">
                <input
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className="flex-1 bg-transparent text-gray-300 placeholder-gray-500 outline-none text-base"
                  disabled={isLoading}
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'password-error' : 'password-toggle'}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-500 hover:text-gray-300 ml-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 rounded"
                  disabled={isLoading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  id="password-toggle"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-1" id="password-error" role="alert">{errors.password.message}</p>
              )}
            </div>

            {/* Error Message */}
            {errors.root && (
              <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3" role="alert" aria-live="polite">
                <p className="text-red-400 text-sm">{errors.root.message}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white px-56 py-3 rounded-lg text-base font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                aria-describedby={errors.root ? 'login-error' : undefined}
              >
                {isLoading ? 'Signing In...' : 'Log In'}
              </button>
            </div>
          </form>

          <p className="text-white text-center mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 transition-colors">
              Sign up
            </Link>
          </p>

          <div className="text-center mt-4">
            <Link to="/forgot-password" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
              Forgot your password?
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};