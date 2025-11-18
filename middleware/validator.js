const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 * Should be used after validation chains
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }

  next();
};

/**
 * Validation rules for user registration
 */
const validateRegistration = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Full name can only contain letters, spaces, hyphens, and apostrophes'),

  body('studentId')
    .trim()
    .notEmpty()
    .withMessage('Student ID is required')
    .matches(/^[0-9]{4}\/[0-9]{6}$/)
    .withMessage('Student ID must be in format: YYYY/XXXXXX (e.g., 2024/123456)'),

  body('phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^(\+234|0)[789][01]\d{8}$/)
    .withMessage('Phone number must be a valid Nigerian phone number'),

  handleValidationErrors
];

/**
 * Validation rules for user login
 */
const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  handleValidationErrors
];

/**
 * Validation rules for booking creation
 */
const validateBooking = [
  body('routeId')
    .isInt({ min: 1 })
    .withMessage('Valid route ID is required'),

  body('pickupLocation')
    .trim()
    .notEmpty()
    .withMessage('Pickup location is required')
    .isLength({ max: 255 })
    .withMessage('Pickup location must not exceed 255 characters'),

  body('dropoffLocation')
    .trim()
    .notEmpty()
    .withMessage('Dropoff location is required')
    .isLength({ max: 255 })
    .withMessage('Dropoff location must not exceed 255 characters')
    .custom((value, { req }) => {
      if (value === req.body.pickupLocation) {
        throw new Error('Pickup and dropoff locations must be different');
      }
      return true;
    }),

  body('departureTime')
    .isISO8601()
    .withMessage('Valid departure time is required')
    .custom((value) => {
      const departureDate = new Date(value);
      const now = new Date();
      if (departureDate <= now) {
        throw new Error('Departure time must be in the future');
      }
      return true;
    }),

  body('numberOfSeats')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Number of seats must be between 1 and 10'),

  handleValidationErrors
];

/**
 * Validation rules for wallet funding
 */
const validateFunding = [
  body('amount')
    .isFloat({ min: 100, max: 1000000 })
    .withMessage('Amount must be between ₦100 and ₦1,000,000'),

  body('paymentMethod')
    .trim()
    .isIn(['card', 'bank_transfer', 'ussd'])
    .withMessage('Payment method must be one of: card, bank_transfer, ussd'),

  handleValidationErrors
];

/**
 * Validation rules for route ID parameter
 */
const validateRouteId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid route ID is required'),

  handleValidationErrors
];

/**
 * Validation rules for booking ID parameter
 */
const validateBookingId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid booking ID is required'),

  handleValidationErrors
];

/**
 * Sanitizes string inputs to prevent XSS
 * This is a helper function for additional sanitization
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;

  // Remove any HTML tags
  return str.replace(/<[^>]*>/g, '');
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateBooking,
  validateFunding,
  validateRouteId,
  validateBookingId,
  handleValidationErrors,
  sanitizeString
};
