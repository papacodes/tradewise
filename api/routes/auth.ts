/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response, type NextFunction } from 'express'
import { body, validationResult } from 'express-validator'
import { supabaseAdmin } from '../lib/supabase.js'
import rateLimit from 'express-rate-limit'

// Extend Request interface to include user property
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email?: string;
    [key: string]: unknown;
  };
}

const router = Router()

// Enhanced rate limiting for auth endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 15 * 60 // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for successful requests
    return req.method === 'GET';
  }
});

// Stricter rate limiting for registration
const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 registration attempts per hour
  message: {
    error: 'Too many registration attempts, please try again later.',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Enhanced validation middleware
const validateInput = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    // Log validation failures for security monitoring
    console.warn('Validation failed:', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      errors: errors.array(),
      timestamp: new Date().toISOString()
    })
    
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.type === 'field' ? err.path : 'unknown',
        message: err.msg
      }))
    })
    return
  }
  next()
}

// Additional security validation
const validateSecurityHeaders = (req: Request, _res: Response, next: NextFunction): void => {
  // Check for suspicious patterns in headers
  const userAgent = req.get('User-Agent') || ''
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /<script/i,
    /javascript:/i
  ]
  
  // Allow legitimate bots but log suspicious activity
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent))
  if (isSuspicious && !userAgent.includes('Googlebot') && !userAgent.includes('Bingbot')) {
    console.warn('Suspicious user agent detected:', {
      ip: req.ip,
      userAgent,
      timestamp: new Date().toISOString()
    })
  }
  
  next()
}

// Authentication middleware
const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No valid authorization token provided'
      })
      return
    }

    const token = authHeader.substring(7)
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    
    if (error || !user) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      })
      return
    }

    (req as AuthenticatedRequest).user = user as unknown as AuthenticatedRequest['user']
    next()
  } catch {
    res.status(500).json({
      success: false,
      error: 'Authentication verification failed'
    })
  }
}

/**
 * User Registration
 * POST /api/auth/register
 */
router.post('/register', [
  registerRateLimit,
  validateSecurityHeaders,
  body('email')
    .isEmail()
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('Please provide a valid email address')
    .custom((value) => {
      // Additional email security checks
      if (value.includes('..') || value.startsWith('.') || value.endsWith('.')) {
        throw new Error('Invalid email format')
      }
      return true
    }),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
    .custom((value) => {
      // Check for common weak passwords
      const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein', 'welcome']
      if (commonPasswords.some(common => value.toLowerCase().includes(common))) {
        throw new Error('Password contains common words and is not secure')
      }
      return true
    }),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('First name must be between 1 and 50 characters and contain only letters, spaces, hyphens, and apostrophes'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Last name must be between 1 and 50 characters and contain only letters, spaces, hyphens, and apostrophes'),
  validateInput
], async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName } = req.body

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    })
    const existingUser = existingUsers.users.find((user) => user.email === email)
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      })
      return
    }

    // Create user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        first_name: firstName,
        last_name: lastName
      },
      email_confirm: true
    })

    if (error) {
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName,
        lastName
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error during registration'
    })
  }
})

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', [
  authRateLimit,
  validateSecurityHeaders,
  body('email')
    .isEmail()
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 1, max: 128 })
    .withMessage('Password is required'),
  validateInput
], async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    })

    if (error || !data.session) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      })
      return
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName: (data.user['user_metadata'] as Record<string, unknown>)?.['first_name'] as string,
        lastName: (data.user['user_metadata'] as Record<string, unknown>)?.['last_name'] as string
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error during login'
    })
  }
})

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.substring(7)

    if (token) {
      const { error } = await supabaseAdmin.auth.admin.signOut(token)
      if (error) {
        console.error('Logout error:', error)
      }
    }

    // Clear session
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err)
        }
      })
    }

    res.json({
      success: true,
      message: 'Logout successful'
    })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error during logout'
    })
  }
})

/**
 * Get current user profile
 * GET /api/auth/profile
 */
router.get('/profile', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: (user['user_metadata'] as Record<string, unknown>)?.['first_name'] as string,
        lastName: (user['user_metadata'] as Record<string, unknown>)?.['last_name'] as string,
        created_at: user['created_at'] as string,
        last_sign_in_at: user['last_sign_in_at'] as string
      }
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile'
    })
  }
})

/**
 * Refresh token
 * POST /api/auth/refresh
 */
router.post('/refresh', [
  body('refresh_token')
    .notEmpty()
    .withMessage('Refresh token is required'),
  validateInput
], async (req: Request, res: Response): Promise<void> => {
  try {
    const { refresh_token } = req.body

    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token
    })

    if (error || !data.session) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token'
      })
      return
    }

    res.json({
      success: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      }
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error during token refresh'
    })
  }
})

export default router
