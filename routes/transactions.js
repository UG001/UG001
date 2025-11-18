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

// Get user transactions
router.get('/', verifyToken, async (req, res) => {
    try {
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select(`
                *,
                bookings (
                    id,
                    booking_reference,
                    pickup_location,
                    dropoff_location
                )
            `)
            .eq('user_id', req.user.userId)
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to fetch transactions' 
            });
        }

        res.json({
            success: true,
            transactions: transactions || []
        });
    } catch (error) {
        console.error('Transactions error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error' 
        });
    }
});

module.exports = router;
