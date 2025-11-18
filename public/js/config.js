/**
 * Frontend Configuration
 * Centralized configuration for the frontend application
 */

const CONFIG = {
  API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : '/api',

  SESSION_TIMEOUT: 30 * 60 * 1000,

  STORAGE_KEYS: {
    AUTH_TOKEN: 'authToken',
    USER_DATA: 'userData',
    SESSION_EXPIRY: 'sessionExpiry'
  },

  ROUTES: {
    LOGIN: 'login.html',
    SIGNUP: 'signup.html',
    DASHBOARD: 'dashboard.html',
    BOOKING: 'book.html',
    HOME: 'index.html'
  },

  API_ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register'
    },
    USER: {
      PROFILE: '/user/profile',
      FUND: '/user/fund',
      TRANSACTIONS: '/user/transactions',
      BOOKINGS: '/user/bookings'
    },
    ROUTES: {
      LIST: '/routes',
      DETAIL: (id) => `/routes/${id}`
    },
    BOOKINGS: {
      CREATE: '/bookings',
      LIST: '/bookings',
      DETAIL: (id) => `/bookings/${id}`,
      CANCEL: (id) => `/bookings/${id}/cancel`
    },
    TRANSACTIONS: {
      LIST: '/transactions',
      DETAIL: (id) => `/transactions/${id}`
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
