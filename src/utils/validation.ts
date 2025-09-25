// Input validation and sanitization utilities

/**
 * Sanitize string input to prevent XSS attacks
 */
export const sanitizeString = (input: string): string => {
  if (!input) return '';
  
  // Remove HTML tags and encode special characters
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>"'&]/g, (match) => {
      const entities: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[match] || match;
    })
    .trim();
};

/**
 * Validate and sanitize name input
 */
export const validateName = (name: string): { isValid: boolean; sanitized: string; error?: string } => {
  const sanitized = sanitizeString(name);
  
  if (sanitized.length > 50) {
    return { isValid: false, sanitized, error: 'Name must be less than 50 characters' };
  }
  
  if (sanitized && !/^[a-zA-Z\s'-]+$/.test(sanitized)) {
    return { isValid: false, sanitized, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }
  
  return { isValid: true, sanitized };
};

/**
 * Validate and sanitize phone number
 */
export const validatePhone = (phone: string): { isValid: boolean; sanitized: string; error?: string } => {
  const sanitized = phone.replace(/[^+\d\s()-]/g, '').trim();
  
  if (sanitized && !/^[+]?[\d\s()-]{10,20}$/.test(sanitized)) {
    return { isValid: false, sanitized, error: 'Please enter a valid phone number' };
  }
  
  return { isValid: true, sanitized };
};

/**
 * Validate and sanitize URL
 */
export const validateUrl = (url: string): { isValid: boolean; sanitized: string; error?: string } => {
  const sanitized = sanitizeString(url);
  
  if (sanitized && !isValidUrl(sanitized)) {
    return { isValid: false, sanitized, error: 'Please enter a valid URL starting with http:// or https://' };
  }
  
  return { isValid: true, sanitized };
};

/**
 * Validate and sanitize bio/description text
 */
export const validateBio = (bio: string): { isValid: boolean; sanitized: string; error?: string } => {
  const sanitized = sanitizeString(bio);
  
  if (sanitized.length > 500) {
    return { isValid: false, sanitized, error: 'Bio must be less than 500 characters' };
  }
  
  return { isValid: true, sanitized };
};

/**
 * Validate and sanitize location
 */
export const validateLocation = (location: string): { isValid: boolean; sanitized: string; error?: string } => {
  const sanitized = sanitizeString(location);
  
  if (sanitized.length > 100) {
    return { isValid: false, sanitized, error: 'Location must be less than 100 characters' };
  }
  
  return { isValid: true, sanitized };
};

/**
 * Check if a string is a valid URL
 */
const isValidUrl = (string: string): boolean => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): { isValid: boolean; error?: string; strength: 'weak' | 'medium' | 'strong' } => {
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long', strength: 'weak' };
  }
  
  if (password.length > 128) {
    return { isValid: false, error: 'Password must be less than 128 characters', strength: 'weak' };
  }
  
  // Check for common weak passwords
  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein', 'welcome'];
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    return { isValid: false, error: 'Password contains common words and is not secure', strength: 'weak' };
  }
  
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const criteriaCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  
  if (criteriaCount < 2) {
    return { isValid: false, error: 'Password must contain at least 2 of: lowercase, uppercase, numbers, special characters', strength: 'weak' };
  }
  
  const strength = criteriaCount >= 4 ? 'strong' : criteriaCount >= 3 ? 'medium' : 'weak';
  
  return { isValid: true, strength };
};

/**
 * Validate file upload
 */
export const validateFileUpload = (file: File): { isValid: boolean; error?: string } => {
  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 5MB' };
  }
  
  // Check file type for images
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedDocumentTypes = ['application/pdf', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  const allowedTypes = [...allowedImageTypes, ...allowedDocumentTypes];
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'File type not allowed. Please upload images (JPEG, PNG, GIF, WebP) or documents (PDF, CSV, Excel)' };
  }
  
  // Check file name for suspicious patterns
  const suspiciousPatterns = /\.(exe|bat|cmd|scr|pif|com|vbs|js|jar|php|asp|jsp)$/i;
  if (suspiciousPatterns.test(file.name)) {
    return { isValid: false, error: 'File type not allowed for security reasons' };
  }
  
  // Check for null bytes in filename
  if (file.name.includes('\0')) {
    return { isValid: false, error: 'Invalid file name' };
  }
  
  return { isValid: true };
};

/**
 * Validate email format with additional security checks
 */
export const validateEmail = (email: string): { isValid: boolean; sanitized: string; error?: string } => {
  const sanitized = sanitizeString(email).toLowerCase();
  
  // Basic email regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(sanitized)) {
    return { isValid: false, sanitized, error: 'Please enter a valid email address' };
  }
  
  // Check length
  if (sanitized.length > 254) {
    return { isValid: false, sanitized, error: 'Email address is too long' };
  }
  
  // Check for suspicious patterns
  if (sanitized.includes('..') || sanitized.startsWith('.') || sanitized.endsWith('.')) {
    return { isValid: false, sanitized, error: 'Invalid email format' };
  }
  
  return { isValid: true, sanitized };
};

/**
 * Rate limiting helper for client-side
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (key: string, maxRequests: number = 5, windowMs: number = 15 * 60 * 1000): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
};

/**
 * Sanitize and validate numeric input
 */
export const validateNumeric = (value: string, min?: number, max?: number): { isValid: boolean; sanitized: number; error?: string } => {
  const sanitized = parseFloat(value.replace(/[^0-9.-]/g, ''));
  
  if (isNaN(sanitized)) {
    return { isValid: false, sanitized: 0, error: 'Please enter a valid number' };
  }
  
  if (min !== undefined && sanitized < min) {
    return { isValid: false, sanitized, error: `Value must be at least ${min}` };
  }
  
  if (max !== undefined && sanitized > max) {
    return { isValid: false, sanitized, error: `Value must be at most ${max}` };
  }
  
  return { isValid: true, sanitized };
};

/**
 * Validate trading symbol format
 */
export const validateTradingSymbol = (symbol: string): { isValid: boolean; sanitized: string; error?: string } => {
  const sanitized = sanitizeString(symbol).toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  if (sanitized.length < 2 || sanitized.length > 12) {
    return { isValid: false, sanitized, error: 'Symbol must be 2-12 characters long' };
  }
  
  // Check for valid symbol patterns
  const validPatterns = [
    /^[A-Z]{3,6}USD$/, // Forex pairs ending with USD
    /^USD[A-Z]{3}$/, // USD pairs
    /^[A-Z]{6}$/, // Standard forex pairs
    /^[A-Z]{2,5}$/, // Stock symbols
    /^[A-Z]{3,4}(USD|BTC|ETH)$/ // Crypto pairs
  ];
  
  const isValidPattern = validPatterns.some(pattern => pattern.test(sanitized));
  if (!isValidPattern) {
    return { isValid: false, sanitized, error: 'Invalid symbol format' };
  }
  
  return { isValid: true, sanitized };
};

/**
 * Validate price input for trading
 */
export const validatePrice = (price: string | number | undefined): { isValid: boolean; sanitized: number; error?: string } => {
  if (price === undefined) {
    return { isValid: false, sanitized: 0, error: 'Price is required' };
  }
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice) || numPrice <= 0) {
    return { isValid: false, sanitized: 0, error: 'Price must be a positive number' };
  }
  
  if (numPrice > 1000000) {
    return { isValid: false, sanitized: numPrice, error: 'Price is unreasonably high' };
  }
  
  // Check for reasonable decimal places (max 8 for crypto, 5 for forex)
  const decimalPlaces = (numPrice.toString().split('.')[1] || '').length;
  if (decimalPlaces > 8) {
    return { isValid: false, sanitized: numPrice, error: 'Too many decimal places' };
  }
  
  return { isValid: true, sanitized: numPrice };
};

/**
 * Validate position size
 */
export const validatePositionSize = (size: string | number | undefined): { isValid: boolean; sanitized: number; error?: string } => {
  if (size === undefined) {
    return { isValid: false, sanitized: 0, error: 'Position size is required' };
  }
  const numSize = typeof size === 'string' ? parseFloat(size) : size;
  
  if (isNaN(numSize) || numSize <= 0) {
    return { isValid: false, sanitized: 0, error: 'Position size must be positive' };
  }
  
  if (numSize > 1000) {
    return { isValid: false, sanitized: numSize, error: 'Position size is unreasonably large' };
  }
  
  return { isValid: true, sanitized: numSize };
};

/**
 * Validate account name
 */
export const validateAccountName = (name: string): { isValid: boolean; sanitized: string; error?: string } => {
  const sanitized = sanitizeString(name);
  
  if (sanitized.length < 2) {
    return { isValid: false, sanitized, error: 'Account name must be at least 2 characters' };
  }
  
  if (sanitized.length > 50) {
    return { isValid: false, sanitized, error: 'Account name must be less than 50 characters' };
  }
  
  // Check for valid characters (letters, numbers, spaces, hyphens, underscores)
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(sanitized)) {
    return { isValid: false, sanitized, error: 'Account name contains invalid characters' };
  }
  
  return { isValid: true, sanitized };
};

/**
 * Enhanced SQL injection prevention
 */
export const preventSQLInjection = (input: string): string => {
  return input
    .replace(/[';"\\]/g, '') // Remove quotes and backslashes
    .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b/gi, '') // Remove SQL keywords
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove block comment start
    .replace(/\*\//g, '') // Remove block comment end
    .trim();
};

/**
 * Validate and sanitize trade notes/comments
 */
export const validateTradeNotes = (notes: string): { isValid: boolean; sanitized: string; error?: string } => {
  const sanitized = sanitizeString(notes);
  
  if (sanitized.length > 1000) {
    return { isValid: false, sanitized, error: 'Notes must be less than 1000 characters' };
  }
  
  // Additional sanitization for trade notes
  const cleanNotes = preventSQLInjection(sanitized);
  
  return { isValid: true, sanitized: cleanNotes };
};

/**
 * Validate datetime input
 */
export const validateDateTime = (datetime: string): { isValid: boolean; sanitized: Date; error?: string } => {
  const date = new Date(datetime);
  
  if (isNaN(date.getTime())) {
    return { isValid: false, sanitized: new Date(), error: 'Invalid date format' };
  }
  
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  
  if (date < oneYearAgo) {
    return { isValid: false, sanitized: date, error: 'Date cannot be more than 1 year in the past' };
  }
  
  if (date > oneYearFromNow) {
    return { isValid: false, sanitized: date, error: 'Date cannot be more than 1 year in the future' };
  }
  
  return { isValid: true, sanitized: date };
};

/**
 * Trade form data interface
 */
interface TradeFormData {
  name?: string;
  symbol?: string;
  entry_price?: string | number;
  stop_loss_price?: string | number;
  take_profit_price?: string | number;
  position_size?: string | number;
  trade_date?: string;
  notes?: string;
  [key: string]: unknown;
}

/**
 * Comprehensive form validation for trade data
 */
export const validateTradeForm = (data: TradeFormData): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  // Validate trade name
  const nameValidation = validateName(data.name || '');
  if (!nameValidation.isValid) {
    errors['name'] = nameValidation.error || 'Invalid trade name';
  }
  
  // Validate symbol
  const symbolValidation = validateTradingSymbol(data.symbol || '');
  if (!symbolValidation.isValid) {
    errors['symbol'] = symbolValidation.error || 'Invalid symbol';
  }
  
  // Validate prices
  if (data.entry_price !== undefined) {
    const entryPriceValidation = validatePrice(data.entry_price);
    if (!entryPriceValidation.isValid) {
      errors['entry_price'] = entryPriceValidation.error || 'Invalid entry price';
    }
  }
  
  if (data.stop_loss_price !== undefined) {
    const stopLossValidation = validatePrice(data.stop_loss_price);
    if (!stopLossValidation.isValid) {
      errors['stop_loss_price'] = stopLossValidation.error || 'Invalid stop loss price';
    }
  }
  
  if (data.take_profit_price !== undefined) {
    const takeProfitValidation = validatePrice(data.take_profit_price);
    if (!takeProfitValidation.isValid) {
      errors['take_profit_price'] = takeProfitValidation.error || 'Invalid take profit price';
    }
  }
  
  // Validate position size
  if (data.position_size !== undefined) {
    const positionSizeValidation = validatePositionSize(data.position_size);
    if (!positionSizeValidation.isValid) {
      errors['position_size'] = positionSizeValidation.error || 'Invalid position size';
    }
  }
  
  // Validate datetime
  if (data['entry_datetime']) {
    const datetimeValidation = validateDateTime(data['entry_datetime'] as string);
    if (!datetimeValidation.isValid) {
      errors['entry_datetime'] = datetimeValidation.error || 'Invalid date/time';
    }
  }
  
  return { isValid: Object.keys(errors).length === 0, errors };
};