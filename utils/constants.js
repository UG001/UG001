/**
 * Application-wide constants
 */

const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
};

const TRANSACTION_TYPE = {
  FUNDING: 'funding',
  BOOKING: 'booking',
  REFUND: 'refund'
};

const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

const PAYMENT_METHOD = {
  CARD: 'card',
  BANK_TRANSFER: 'bank_transfer',
  USSD: 'ussd',
  WALLET: 'wallet'
};

const WALLET_LIMITS = {
  MIN_FUNDING: 100,
  MAX_FUNDING: 1000000,
  MIN_BALANCE: 0
};

const SEAT_LIMITS = {
  MIN: 1,
  MAX: 10
};

module.exports = {
  BOOKING_STATUS,
  TRANSACTION_TYPE,
  TRANSACTION_STATUS,
  PAYMENT_METHOD,
  WALLET_LIMITS,
  SEAT_LIMITS
};
