import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { sanitizeString, validateName, validatePassword, validateEmail, checkRateLimit } from '../utils/validation';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Sign Up - TradeWise';
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      
      // Check rate limiting
      if (!checkRateLimit('register-attempt', 3, 15 * 60 * 1000)) {
        setError('root', { message: 'Too many registration attempts. Please try again in 15 minutes.' });
        return;
      }
      
      // Validate email
      const emailValidation = validateEmail(data.email);
      if (!emailValidation.isValid) {
        setError('root', { message: emailValidation.error || 'Invalid email address' });
        return;
      }
      
      // Sanitize names
      const sanitizedFirstName = sanitizeString(data.firstName);
      const sanitizedLastName = sanitizeString(data.lastName);
      
      // Validate names
      const firstNameValidation = validateName(sanitizedFirstName);
      if (!firstNameValidation.isValid) {
        setError('root', { message: firstNameValidation.error || 'Invalid first name' });
        return;
      }
      
      const lastNameValidation = validateName(sanitizedLastName);
      if (!lastNameValidation.isValid) {
        setError('root', { message: lastNameValidation.error || 'Invalid last name' });
        return;
      }
      
      // Validate password
      const passwordValidation = validatePassword(data.password);
      if (!passwordValidation.isValid) {
        setError('root', { message: passwordValidation.error || 'Invalid password' });
        return;
      }
      
      // Check password confirmation
      if (data.password !== data.confirmPassword) {
        setError('root', { message: 'Passwords do not match' });
        return;
      }
      
      await signUp(emailValidation.sanitized, data.password, sanitizedFirstName, sanitizedLastName);
      
      toast.success('Account created successfully! Please check your email to verify your account.');
      navigate('/login');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      setError('root', { message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

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
            to="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          >
            Log In
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-40 py-10" role="main">
        <div className="w-full max-w-2xl">
          <h2 id="register-heading" className="text-white text-3xl font-bold text-center mb-3">
            Join TradeWise
          </h2>
          <p className="text-white text-center mb-8">
            Create your account and start tracking your trades, analyzing performance, and improving your trading strategy.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" role="form" aria-labelledby="register-heading">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="sr-only">First Name</label>
                <div className="bg-gray-800 rounded-lg p-4">
                  <input
                    {...register('firstName')}
                    id="firstName"
                    type="text"
                    placeholder="First Name"
                    className="w-full bg-transparent text-gray-300 placeholder-gray-500 outline-none text-base focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                    disabled={isLoading}
                    autoComplete="given-name"
                    aria-invalid={errors.firstName ? 'true' : 'false'}
                    aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                  />
                </div>
                {errors.firstName && (
                  <p id="firstName-error" className="text-red-400 text-sm mt-1" role="alert">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className="sr-only">Last Name</label>
                <div className="bg-gray-800 rounded-lg p-4">
                  <input
                    {...register('lastName')}
                    id="lastName"
                    type="text"
                    placeholder="Last Name"
                    className="w-full bg-transparent text-gray-300 placeholder-gray-500 outline-none text-base focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                    disabled={isLoading}
                    autoComplete="family-name"
                    aria-invalid={errors.lastName ? 'true' : 'false'}
                    aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                  />
                </div>
                {errors.lastName && (
                  <p id="lastName-error" className="text-red-400 text-sm mt-1" role="alert">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="sr-only">Email Address</label>
              <div className="bg-gray-800 rounded-lg p-4">
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  placeholder="Email"
                  className="w-full bg-transparent text-gray-300 placeholder-gray-500 outline-none text-base focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                  disabled={isLoading}
                  autoComplete="email"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="text-red-400 text-sm mt-1" role="alert">{errors.email.message}</p>
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
                  className="flex-1 bg-transparent text-gray-300 placeholder-gray-500 outline-none text-base focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                  disabled={isLoading}
                  autoComplete="new-password"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-500 hover:text-gray-300 ml-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                  disabled={isLoading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-red-400 text-sm mt-1" role="alert">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
              <div className="bg-gray-800 rounded-lg p-4 flex items-center">
                <input
                  {...register('confirmPassword')}
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  className="flex-1 bg-transparent text-gray-300 placeholder-gray-500 outline-none text-base focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                  disabled={isLoading}
                  autoComplete="new-password"
                  aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                  aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-gray-500 hover:text-gray-300 ml-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                  disabled={isLoading}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p id="confirmPassword-error" className="text-red-400 text-sm mt-1" role="alert">{errors.confirmPassword.message}</p>
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
                aria-describedby={errors.root ? 'register-error' : undefined}
              >
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </div>
          </form>

          <p className="text-white text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};