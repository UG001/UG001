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

// Get user bookings
router.get('/', verifyToken, async (req, res) => {
    try {
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select(`
                *,
                routes (
                    id,
                    route_name,
                    departure_location,
                    arrival_location,
                    price,
                    estimated_time
                )
            `)
            .eq('user_id', req.user.userId)
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to fetch bookings' 
            });
        }

        res.json({
            success: true,
            bookings: bookings || []
        });
    } catch (error) {
        console.error('Bookings error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error' 
        });
    }
});

// Create new booking
router.post('/', verifyToken, async (req, res) => {
    try {
        const { routeId, pickupLocation, dropoffLocation, scheduledTime, numberOfSeats = 1 } = req.body;

        // Validate input
        if (!routeId || !pickupLocation || !dropoffLocation) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields' 
            });
        }

        // Get route details
        const { data: route, error: routeError } = await supabase
            .from('routes')
            .select('*')
            .eq('id', routeId)
            .single();

        if (routeError || !route) {
            return res.status(404).json({ 
                success: false, 
                error: 'Route not found' 
            });
        }

        // Get user balance
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('balance, total_rides, total_spent')
            .eq('id', req.user.userId)
            .single();

        if (userError || !user) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        // Calculate total cost
        const totalCost = parseFloat(route.price) * parseInt(numberOfSeats);

        // Check if user has sufficient balance
        if (parseFloat(user.balance) < totalCost) {
            return res.status(400).json({ 
                success: false, 
                error: 'Insufficient balance' 
            });
        }

        // Create booking
        const bookingData = {
            user_id: req.user.userId,
            route_id: routeId,
            pickup_location: pickupLocation,
            dropoff_location: dropoffLocation,
            scheduled_time: scheduledTime,
            number_of_seats: numberOfSeats,
            total_cost: totalCost,
            status: 'pending',
            booking_reference: `BK${Date.now()}`
        };

        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .insert([bookingData])
            .select()
            .single();

        if (bookingError) {
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to create booking' 
            });
        }

        // Update user balance and stats
        const newBalance = parseFloat(user.balance) - totalCost;
        const newTotalRides = parseInt(user.total_rides) + parseInt(numberOfSeats);
        const newTotalSpent = parseFloat(user.total_spent) + totalCost;

        const { error: updateError } = await supabase
            .from('users')
            .update({
                balance: newBalance,
                total_rides: newTotalRides,
                total_spent: newTotalSpent
            })
            .eq('id', req.user.userId);

        if (updateError) {
            console.error('User update error:', updateError);
        }

        // Create transaction record
        const { error: transactionError } = await supabase
            .from('transactions')
            .insert([{
                user_id: req.user.userId,
                booking_id: booking.id,
                amount: totalCost,
                type: 'booking',
                payment_method: 'wallet',
                status: 'completed',
                reference: booking.booking_reference
            }]);

        if (transactionError) {
            console.error('Transaction error:', transactionError);
        }

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            booking,
            newBalance
        });
    } catch (error) {
        console.error('Booking creation error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error' 
        });
    }
});

module.exports = router;
