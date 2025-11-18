// API Client for UNN Shuttle Booking System
class UNNShuttleAPI {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
    }

    // Helper method to make API calls
    async apiCall(endpoint, method = 'GET', data = null) {
        try {
            const config = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            // Add authorization header if token exists
            const token = localStorage.getItem('authToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            if (data && method !== 'GET') {
                config.body = JSON.stringify(data);
            }

            const response = await fetch(`${this.baseURL}${endpoint}`, config);
            const result = await response.json();

            if (!response.ok) {
                // Handle token expired/invalid
                if (response.status === 401) {
                    this.clearSession();
                    window.location.href = 'login.html';
                }
                throw new Error(result.error || 'API request failed');
            }

            return result;     
        } catch (error) {      
            console.error('API Error:', error);                           
            throw error;       
        }
    }

    // Authentication methods
    async login(email, password) {
        try {
            const result = await this.apiCall('/auth/login', 'POST', { email, password });
            if (result.success) {
                // Store JWT token
                localStorage.setItem('authToken', result.token);
                // Store user session
                localStorage.setItem('currentUser', JSON.stringify(result.user));
                localStorage.setItem('userId', result.user.id);
                localStorage.setItem('username', result.user.full_name);
                localStorage.setItem('loginTime', Date.now().toString());
                return result.user;
            }
            throw new Error(result.error || 'Login failed');
        } catch (error) {
            throw error;
        }
    }

    async register(userData) {
        try {
            const result = await this.apiCall('/auth/register', 'POST', userData);
            if (result.success) {
                // Auto-login after registration
                return await this.login(userData.email, userData.password);
            }
            throw new Error(result.error || 'Registration failed');
        } catch (error) {
            throw error;
        }
    }

    async logout() {
        try {
            await this.apiCall('/auth/logout', 'POST');
            this.clearSession();
            return true;
        } catch (error) {
            // Even if API fails, clear local session
            this.clearSession();
            return true;
        }
    }

    // User methods
    async getUserProfile() {
        try {
            const result = await this.apiCall('/user/profile', 'GET');
            if (result.success) {
                return {
                    user: result.user,
                    stats: result.stats,
                    recentBookings: result.recent_bookings,
                    recentTransactions: result.recent_transactions
                };
            }
            throw new Error(result.error || 'Failed to get user profile');
        } catch (error) {
            throw error;
        }
    }

    async fundAccount(amount, paymentMethod = 'Card') {
        try {
            const result = await this.apiCall('/user/fund', 'POST', { amount, paymentMethod });
            if (result.success) {
                // Update local user data
                const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                currentUser.balance = result.new_balance;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                return result;
            }
            throw new Error(result.error || 'Failed to fund account');
        } catch (error) {
            throw error;
        }
    }

    // Routes methods
    async getRoutes() {
        try {
            const result = await this.apiCall('/routes', 'GET');
            if (result.success) {
                return result.routes;
            }
            throw new Error(result.error || 'Failed to get routes');
        } catch (error) {
            throw error;
        }
    }

    // Bookings methods
    async getBookings() {
        try {
            const result = await this.apiCall('/bookings', 'GET');
            if (result.success) {
                return result.bookings;
            }
            throw new Error(result.error || 'Failed to get bookings');
        } catch (error) {
            throw error;
        }
    }

    async createBooking(bookingData) {
        try {
            const result = await this.apiCall('/bookings/create', 'POST', bookingData);
            if (result.success) {
                // Update local user data
                const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                currentUser.balance = result.new_balance;
                currentUser.total_rides = (currentUser.total_rides || 0) + 1;
                currentUser.total_spent = (currentUser.total_spent || 0) + result.booking.total_amount;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                return result;
            }
            throw new Error(result.error || 'Failed to create booking');
        } catch (error) {
            throw error;
        }
    }

    // Transactions methods
    async getTransactions() {
        try {
            const result = await this.apiCall('/transactions', 'GET');
            if (result.success) {
                return result.transactions;
            }
            throw new Error(result.error || 'Failed to get transactions');
        } catch (error) {
            throw error;
        }
    }

    // Session management
    isLoggedIn() {
        const userId = localStorage.getItem('userId');
        const loginTime = localStorage.getItem('loginTime');
        
        if (!userId || !loginTime) {
            return false;
        }

        // Check session timeout
        const currentTime = Date.now();
        const sessionAge = currentTime - parseInt(loginTime);
        
        if (sessionAge > this.sessionTimeout) {
            this.clearSession();
            return false;
        }

        return true;
    }

    // Token refresh method
    async refreshToken() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('No token to refresh');
            }

            // Decode token to check expiration
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            
            // If token is still valid for more than 5 minutes, no need to refresh
            if (payload.exp - currentTime > 300) {
                return token;
            }

            // Token is expiring soon, would need refresh endpoint
            // For now, clear session and require re-login
            this.clearSession();
            return null;
        } catch (error) {
            console.error('Token refresh error:', error);
            this.clearSession();
            return null;
        }
    }

    getCurrentUser() {
        if (this.isLoggedIn()) {
            return JSON.parse(localStorage.getItem('currentUser') || '{}');
        }
        return null;
    }

    clearSession() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        localStorage.removeItem('loginTime');
    }

    // Utility methods
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

    generateBookingCode() {
        return 'BK' + Date.now() + Math.floor(Math.random() * 1000);
    }
}

// Create global API instance
const api = new UNNShuttleAPI();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UNNShuttleAPI;
}
