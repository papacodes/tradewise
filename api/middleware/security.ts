/**
 * Security middleware for CSRF protection and additional security measures
 */
import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'

// Extend Request interface to include CSRF token
declare module 'express-serve-static-core' {
  interface Request {
    csrfToken?: string
  }
}

/**
 * Generate CSRF token
 */
export const generateCSRFToken = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * CSRF Protection Middleware
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  // Skip CSRF for GET requests and health checks
  if (req.method === 'GET' || req.path === '/api/health') {
    next()
    return
  }

  // Generate token for session if not exists
  if (!req.session) {
    res.status(500).json({
      success: false,
      error: 'Session not initialized'
    })
    return
  }

  // Generate CSRF token if not exists in session
  if (!(req.session as unknown as Record<string, unknown>)['csrfToken']) {
    (req.session as unknown as Record<string, unknown>)['csrfToken'] = generateCSRFToken()
  }

  // For non-GET requests, verify CSRF token
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const tokenFromHeader = req.headers['x-csrf-token'] as string
    const tokenFromBody = req.body?._csrf
    const sessionToken = (req.session as unknown as Record<string, unknown>)['csrfToken'] as string

    const providedToken = tokenFromHeader || tokenFromBody

    if (!providedToken || providedToken !== sessionToken) {
      res.status(403).json({
        success: false,
        error: 'Invalid CSRF token'
      })
      return
    }
  }

  // Add token to request for access in routes
  req.csrfToken = (req.session as unknown as Record<string, unknown>)['csrfToken'] as string
  next()
}

/**
 * Endpoint to get CSRF token
 */
export const getCSRFToken = (req: Request, res: Response): void => {
  if (!req.session) {
    res.status(500).json({
      success: false,
      error: 'Session not initialized'
    })
    return
  }

  // Generate token if not exists
  if (!(req.session as unknown as Record<string, unknown>)['csrfToken']) {
    (req.session as unknown as Record<string, unknown>)['csrfToken'] = generateCSRFToken()
  }

  res.json({
    success: true,
    csrfToken: (req.session as unknown as Record<string, unknown>)['csrfToken'] as string
  })
}

/**
 * Sanitize input to prevent XSS
 */
export const sanitizeInput = (input: unknown): unknown => {
  if (typeof input === 'string') {
    return input
      .replace(/[<>"'&]/g, (match) => {
        const escapeMap: { [key: string]: string } = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        }
        return escapeMap[match] || match
      })
      .trim()
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: Record<string, unknown> = {}
    for (const key in input) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        sanitized[key] = sanitizeInput((input as Record<string, unknown>)[key])
      }
    }
    return sanitized
  }
  
  return input
}

/**
 * Middleware to sanitize request body
 */
export const sanitizeBody = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body) {
    req.body = sanitizeInput(req.body)
  }
  next()
}