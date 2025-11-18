/**
 * Utility helper functions
 */

/**
 * Generates a unique booking code
 * Format: BK-YYYYMMDD-RANDOM
 * @returns {string} Unique booking code
 */
function generateBookingCode() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();

  return `BK-${year}${month}${day}-${random}`;
}

/**
 * Generates a unique transaction reference
 * Format: TXN-TIMESTAMP-RANDOM
 * @returns {string} Unique transaction reference
 */
function generateTransactionReference() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();

  return `TXN-${timestamp}-${random}`;
}

/**
 * Formats currency in Nigerian Naira
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(amount);
}

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates student ID format (YYYY/XXXXXX)
 * @param {string} studentId - Student ID to validate
 * @returns {boolean} True if valid student ID
 */
function isValidStudentId(studentId) {
  const studentIdRegex = /^[0-9]{4}\/[0-9]{6}$/;
  return studentIdRegex.test(studentId);
}

/**
 * Validates Nigerian phone number
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} True if valid phone number
 */
function isValidPhoneNumber(phoneNumber) {
  const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
  return phoneRegex.test(phoneNumber);
}

/**
 * Sanitizes user input to prevent XSS
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * Calculates pagination metadata
 * @param {number} total - Total number of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
function getPaginationMeta(total, page, limit) {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage,
    hasPrevPage
  };
}

/**
 * Creates a standardized success response
 * @param {*} data - Response data
 * @param {string} message - Optional success message
 * @returns {Object} Standardized response object
 */
function successResponse(data, message = null) {
  const response = {
    success: true,
    data
  };

  if (message) {
    response.message = message;
  }

  return response;
}

/**
 * Creates a standardized error response
 * @param {string} error - Error message
 * @param {*} details - Optional error details
 * @returns {Object} Standardized error object
 */
function errorResponse(error, details = null) {
  const response = {
    success: false,
    error
  };

  if (details) {
    response.details = details;
  }

  return response;
}

module.exports = {
  generateBookingCode,
  generateTransactionReference,
  formatCurrency,
  isValidEmail,
  isValidStudentId,
  isValidPhoneNumber,
  sanitizeInput,
  getPaginationMeta,
  successResponse,
  errorResponse
};
