/**
 * API Client for UNN Shuttle Booking System
 * Handles all API communication with proper error handling and authentication
 */

class UNNShuttleAPI {
  constructor() {
    this.baseURL = CONFIG.API_BASE_URL;
    this.sessionTimeout = CONFIG.SESSION_TIMEOUT;
  }

  async apiCall(endpoint, method = 'GET', data = null) {
    try {
      const config = {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const token = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (data && method !== 'GET') {
        config.body = JSON.stringify(data);
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          this.clearSession();
          window.location.href = CONFIG.ROUTES.LOGIN;
        }
        throw new Error(result.error || 'API request failed');
      }

      return result;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async login(email, password) {
    const result = await this.apiCall(CONFIG.API_ENDPOINTS.AUTH.LOGIN, 'POST', { email, password });
    if (result.success) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, result.data.token);
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(result.data.user));
      localStorage.setItem(CONFIG.STORAGE_KEYS.SESSION_EXPIRY, Date.now() + this.sessionTimeout);
      return result.data.user;
    }
    throw new Error(result.error || 'Login failed');
  }

  async register(userData) {
    const result = await this.apiCall(CONFIG.API_ENDPOINTS.AUTH.REGISTER, 'POST', {
      fullName: userData.fullName,
      email: userData.email,
      studentId: userData.studentId,
      password: userData.password,
      phoneNumber: userData.phoneNumber,
      department: userData.department,
      level: userData.level
    });

    if (result.success) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, result.data.token);
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(result.data.user));
      localStorage.setItem(CONFIG.STORAGE_KEYS.SESSION_EXPIRY, Date.now() + this.sessionTimeout);
      return result.data.user;
    }
    throw new Error(result.error || 'Registration failed');
  }

  logout() {
    this.clearSession();
    window.location.href = CONFIG.ROUTES.LOGIN;
  }

  async getUserProfile() {
    const result = await this.apiCall(CONFIG.API_ENDPOINTS.USER.PROFILE, 'GET');
    if (result.success) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(result.data.user));
      return result.data;
    }
    throw new Error(result.error || 'Failed to get user profile');
  }

  async fundAccount(amount, paymentMethod) {
    const result = await this.apiCall(CONFIG.API_ENDPOINTS.USER.FUND, 'POST', {
      amount: parseFloat(amount),
      paymentMethod
    });

    if (result.success) {
      const currentUser = this.getCurrentUser();
      if (currentUser) {
        currentUser.balance = result.data.newBalance;
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(currentUser));
      }
      return result.data;
    }
    throw new Error(result.error || 'Failed to fund account');
  }

  async getRoutes() {
    const result = await this.apiCall(CONFIG.API_ENDPOINTS.ROUTES.LIST, 'GET');
    if (result.success) {
      return result.data.routes;
    }
    throw new Error(result.error || 'Failed to get routes');
  }

  async getRoute(id) {
    const result = await this.apiCall(CONFIG.API_ENDPOINTS.ROUTES.DETAIL(id), 'GET');
    if (result.success) {
      return result.data.route;
    }
    throw new Error(result.error || 'Failed to get route');
  }

  async getBookings(page = 1, limit = 20) {
    const result = await this.apiCall(`${CONFIG.API_ENDPOINTS.BOOKINGS.LIST}?page=${page}&limit=${limit}`, 'GET');
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || 'Failed to get bookings');
  }

  async createBooking(bookingData) {
    const result = await this.apiCall(CONFIG.API_ENDPOINTS.BOOKINGS.CREATE, 'POST', {
      routeId: parseInt(bookingData.routeId),
      pickupLocation: bookingData.pickupLocation,
      dropoffLocation: bookingData.dropoffLocation,
      departureTime: bookingData.departureTime,
      numberOfSeats: parseInt(bookingData.numberOfSeats) || 1
    });

    if (result.success) {
      const currentUser = this.getCurrentUser();
      if (currentUser) {
        currentUser.balance = result.data.newBalance;
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(currentUser));
      }
      return result.data;
    }
    throw new Error(result.error || 'Failed to create booking');
  }

  async cancelBooking(bookingId) {
    const result = await this.apiCall(CONFIG.API_ENDPOINTS.BOOKINGS.CANCEL(bookingId), 'PATCH');
    if (result.success) {
      const currentUser = this.getCurrentUser();
      if (currentUser && result.data.newBalance) {
        currentUser.balance = result.data.newBalance;
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(currentUser));
      }
      return result.data;
    }
    throw new Error(result.error || 'Failed to cancel booking');
  }

  async getTransactions(page = 1, limit = 20) {
    const result = await this.apiCall(`${CONFIG.API_ENDPOINTS.TRANSACTIONS.LIST}?page=${page}&limit=${limit}`, 'GET');
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || 'Failed to get transactions');
  }

  isLoggedIn() {
    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    const expiry = localStorage.getItem(CONFIG.STORAGE_KEYS.SESSION_EXPIRY);

    if (!token || !expiry) {
      return false;
    }

    if (Date.now() > parseInt(expiry)) {
      this.clearSession();
      return false;
    }

    return true;
  }

  getCurrentUser() {
    if (this.isLoggedIn()) {
      const userData = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  }

  clearSession() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.SESSION_EXPIRY);
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}]`, message);
  }
}

const api = new UNNShuttleAPI();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = UNNShuttleAPI;
}
