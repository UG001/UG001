const express = require('express');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            error: 'No token provided' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            error: 'Invalid token' 
        });
    }
};

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, full_name, email, student_id, phone_number, department, level, balance, total_rides, total_spent, created_at')
            .eq('id', req.user.userId)
            .single();

        if (error || !user) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        // Get recent bookings
        const { data: recentBookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('*')
            .eq('user_id', req.user.userId)
            .order('created_at', { ascending: false })
            .limit(5);

        // Get recent transactions
        const { data: recentTransactions, error: transactionsError } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', req.user.userId)
            .order('created_at', { ascending: false })
            .limit(5);

        // Calculate stats
        const stats = {
            totalRides: user.total_rides || 0,
            totalSpent: user.total_spent || 0,
            currentBalance: user.balance || 0,
            memberSince: user.created_at
        };

        res.json({
            success: true,
            user,
            stats,
            recent_bookings: recentBookings || [],
            recent_transactions: recentTransactions || []
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error' 
        });
    }
});

// Fund account
router.post('/fund', verifyToken, async (req, res) => {
    try {
        const { amount, paymentMethod = 'card' } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid amount' 
            });
        }

        // Get current user balance
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('balance')
            .eq('id', req.user.userId)
            .single();

        if (fetchError || !user) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        // Update user balance
        const newBalance = parseFloat(user.balance) + parseFloat(amount);
        const { error: updateError } = await supabase
            .from('users')
            .update({ balance: newBalance })
            .eq('id', req.user.userId);

        if (updateError) {
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to update balance' 
            });
        }

        // Create transaction record
        const { error: transactionError } = await supabase
            .from('transactions')
            .insert([{
                user_id: req.user.userId,
                amount: amount,
                type: 'funding',
                payment_method: paymentMethod,
                status: 'completed',
                reference: `FUND_${Date.now()}`
            }]);

        if (transactionError) {
            console.error('Transaction error:', transactionError);
        }

        res.json({
            success: true,
            message: 'Account funded successfully',
            newBalance
        });
    } catch (error) {
        console.error('Funding error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error' 
        });
    }
});

module.exports = router;
