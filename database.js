// Database Manager for UNN Shuttle System
class UNNShuttleDB {
    constructor() {
        this.initializeDB();
    }

    // Initialize database with default data
    initializeDB() {
        if (!localStorage.getItem('unnShuttleDB')) {
            const initialData = {
                users: [],
                bookings: [],
                routes: [
                    { id: 1, name: 'Hostel to Library', price: 150, duration: '15 mins', distance: '2.5 km' },
                    { id: 2, name: 'Library to Faculty', price: 100, duration: '10 mins', distance: '1.8 km' },
                    { id: 3, name: 'Faculty to Main Gate', price: 200, duration: '20 mins', distance: '3.2 km' },
                    { id: 4, name: 'Main Gate to Hostel', price: 250, duration: '25 mins', distance: '4.1 km' },
                    { id: 5, name: 'Hostel to Faculty', price: 180, duration: '18 mins', distance: '2.9 km' },
                    { id: 6, name: 'Library to Main Gate', price: 120, duration: '12 mins', distance: '2.1 km' }
                ],
                shuttles: [
                    { id: 1, plateNumber: 'UNN-001', driver: 'John Okoro', capacity: 16, status: 'active', currentLocation: 'Hostel' },
                    { id: 2, plateNumber: 'UNN-002', driver: 'Mary Adebayo', capacity: 16, status: 'active', currentLocation: 'Library' },
                    { id: 3, plateNumber: 'UNN-003', driver: 'David Ibrahim', capacity: 16, status: 'maintenance', currentLocation: 'Garage' },
                    { id: 4, plateNumber: 'UNN-004', driver: 'Grace Uche', capacity: 16, status: 'active', currentLocation: 'Faculty' }
                ],
                transactions: [],
                settings: {
                    baseFare: 100,
                    perKmRate: 50,
                    serviceCharge: 20,
                    maxBookingDistance: 10
                }
            };
            localStorage.setItem('unnShuttleDB', JSON.stringify(initialData));
        }
        this.data = JSON.parse(localStorage.getItem('unnShuttleDB'));
    }

    // Save data to localStorage
    save() {
        localStorage.setItem('unnShuttleDB', JSON.stringify(this.data));
    }

    // User Management
    createUser(userData) {
        const user = {
            id: Date.now(),
            ...userData,
            balance: 0,
            createdAt: new Date().toISOString(),
            isActive: true,
            totalRides: 0,
            totalSpent: 0
        };
        this.data.users.push(user);
        this.save();
        return user;
    }

    getUserByEmail(email) {
        return this.data.users.find(user => user.email === email);
    }

    getUserById(id) {
        return this.data.users.find(user => user.id === parseInt(id));
    }

    updateUser(userId, updates) {
        const userIndex = this.data.users.findIndex(user => user.id === parseInt(userId));
        if (userIndex !== -1) {
            this.data.users[userIndex] = { ...this.data.users[userIndex], ...updates };
            this.save();
            return this.data.users[userIndex];
        }
        return null;
    }

    // Booking Management
    createBooking(bookingData) {
        const booking = {
            id: Date.now(),
            ...bookingData,
            status: 'pending',
            createdAt: new Date().toISOString(),
            bookingCode: this.generateBookingCode()
        };
        this.data.bookings.push(booking);
        this.save();
        return booking;
    }

    getBookingsByUserId(userId) {
        return this.data.bookings.filter(booking => booking.userId === parseInt(userId));
    }

    updateBookingStatus(bookingId, status) {
        const bookingIndex = this.data.bookings.findIndex(booking => booking.id === parseInt(bookingId));
        if (bookingIndex !== -1) {
            this.data.bookings[bookingIndex].status = status;
            if (status === 'completed') {
                this.data.bookings[bookingIndex].completedAt = new Date().toISOString();
            }
            this.save();
            return this.data.bookings[bookingIndex];
        }
        return null;
    }

    // Transaction Management
    createTransaction(transactionData) {
        const transaction = {
            id: Date.now(),
            ...transactionData,
            createdAt: new Date().toISOString(),
            reference: this.generateTransactionReference()
        };
        this.data.transactions.push(transaction);
        this.save();
        return transaction;
    }

    getTransactionsByUserId(userId) {
        return this.data.transactions.filter(transaction => transaction.userId === parseInt(userId));
    }

    // Balance Management
    fundAccount(userId, amount, paymentMethod) {
        const user = this.getUserById(userId);
        if (user) {
            const oldBalance = user.balance;
            user.balance += parseFloat(amount);
            
            // Create transaction record
            this.createTransaction({
                userId: parseInt(userId),
                type: 'funding',
                amount: parseFloat(amount),
                paymentMethod,
                oldBalance,
                newBalance: user.balance,
                status: 'completed'
            });

            this.updateUser(userId, { balance: user.balance });
            return user;
        }
        return null;
    }

    deductForBooking(userId, amount) {
        const user = this.getUserById(userId);
        if (user && user.balance >= amount) {
            const oldBalance = user.balance;
            user.balance -= parseFloat(amount);
            
            // Create transaction record
            this.createTransaction({
                userId: parseInt(userId),
                type: 'booking',
                amount: parseFloat(amount),
                oldBalance,
                newBalance: user.balance,
                status: 'completed'
            });

            // Update user stats
            user.totalRides += 1;
            user.totalSpent += parseFloat(amount);

            this.updateUser(userId, { balance: user.balance, totalRides: user.totalRides, totalSpent: user.totalSpent });
            return user;
        }
        return null;
    }

    // Route Management
    getAllRoutes() {
        return this.data.routes;
    }

    getRouteById(id) {
        return this.data.routes.find(route => route.id === parseInt(id));
    }

    // Shuttle Management
    getAllShuttles() {
        return this.data.shuttles;
    }

    getAvailableShuttles() {
        return this.data.shuttles.filter(shuttle => shuttle.status === 'active');
    }

    // Utility Functions
    generateBookingCode() {
        return 'UNN' + Date.now().toString().slice(-8);
    }

    generateTransactionReference() {
        return 'TXN' + Date.now().toString().slice(-10);
    }

    // Statistics
    getUserStats(userId) {
        const user = this.getUserById(userId);
        const bookings = this.getBookingsByUserId(userId);
        const transactions = this.getTransactionsByUserId(userId);
        
        return {
            user,
            totalBookings: bookings.length,
            recentBookings: bookings.slice(-5).reverse(),
            totalTransactions: transactions.length,
            recentTransactions: transactions.slice(-5).reverse(),
            memberSince: user ? new Date(user.createdAt).toLocaleDateString() : null
        };
    }

    // Authentication
    authenticateUser(email, password) {
        const user = this.getUserByEmail(email);
        // In a real app, you'd hash and compare passwords
        if (user && user.password === password) {
            return user;
        }
        return null;
    }

    // Export/Import functions for debugging
    exportData() {
        return JSON.stringify(this.data, null, 2);
    }

    importData(jsonData) {
        try {
            this.data = JSON.parse(jsonData);
            this.save();
            return true;
        } catch (error) {
            console.error('Import failed:', error);
            return false;
        }
    }
}

// Initialize database
const db = new UNNShuttleDB();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UNNShuttleDB;
}
