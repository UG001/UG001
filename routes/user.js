const express = require('express');
const { supabaseAdmin } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateFunding } = require('../middleware/validator');
const { successResponse, generateTransactionReference } = require('../utils/helpers');
const { TRANSACTION_TYPE, TRANSACTION_STATUS } = require('../utils/constants');

const router = express.Router();

/**
 * @route   GET /api/user/profile
 * @desc    Get user profile with stats and recent activity
 * @access  Private
 */
router.get('/profile', verifyToken, asyncHandler(async (req, res) => {
  // Get user profile
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, full_name, email, student_id, phone_number, department, level, balance, total_rides, total_spent, created_at')
    .eq('id', req.user.id)
    .eq('is_active', true)
    .single();

  if (userError || !user) {
    return res.status(404).json(errorResponse('User not found'));
  }

  // Get recent bookings with route information
  const { data: recentBookings } = await supabaseAdmin
    .from('bookings')
    .select(`
      id,
      booking_code,
      pickup_location,
      dropoff_location,
      departure_time,
      status,
      total_price,
      number_of_seats,
      created_at,
      routes (
        id,
        name,
        origin,
        destination
      )
    `)
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Get recent transactions
  const { data: recentTransactions } = await supabaseAdmin
    .from('transactions')
    .select('id, amount, type, payment_method, status, reference, created_at')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Calculate stats
  const stats = {
    totalRides: user.total_rides || 0,
    totalSpent: parseFloat(user.total_spent || 0),
    currentBalance: parseFloat(user.balance || 0),
    memberSince: user.created_at
  };

  res.json(successResponse({
    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      studentId: user.student_id,
      phoneNumber: user.phone_number,
      department: user.department,
      level: user.level,
      balance: parseFloat(user.balance),
      totalRides: user.total_rides,
      totalSpent: parseFloat(user.total_spent)
    },
    stats,
    recentBookings: recentBookings || [],
    recentTransactions: recentTransactions || []
  }));
}));

/**
 * @route   POST /api/user/fund
 * @desc    Fund user wallet
 * @access  Private
 */
router.post('/fund', verifyToken, validateFunding, asyncHandler(async (req, res) => {
  const { amount, paymentMethod } = req.body;
  const fundingAmount = parseFloat(amount);

  // Get current user balance
  const { data: user, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('balance, full_name, email')
    .eq('id', req.user.id)
    .eq('is_active', true)
    .single();

  if (fetchError || !user) {
    return res.status(404).json(errorResponse('User not found'));
  }

  const currentBalance = parseFloat(user.balance || 0);
  const newBalance = currentBalance + fundingAmount;

  // Generate unique transaction reference
  const reference = generateTransactionReference();

  // In a real application, this is where you'd integrate with a payment gateway
  // For now, we'll simulate successful payment

  // Use a transaction-like approach with Supabase
  // Update user balance
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({ balance: newBalance })
    .eq('id', req.user.id);

  if (updateError) {
    console.error('Balance update error:', updateError);
    return res.status(500).json(errorResponse('Failed to update balance'));
  }

  // Create transaction record
  const { data: transaction, error: transactionError } = await supabaseAdmin
    .from('transactions')
    .insert([{
      user_id: req.user.id,
      amount: fundingAmount,
      type: TRANSACTION_TYPE.FUNDING,
      payment_method: paymentMethod,
      status: TRANSACTION_STATUS.COMPLETED,
      reference: reference,
      description: `Wallet funding via ${paymentMethod}`
    }])
    .select()
    .single();

  if (transactionError) {
    console.error('Transaction record error:', transactionError);
    // Balance was updated but transaction record failed
    // In production, you'd want to handle this with proper transaction rollback
  }

  res.json(successResponse({
    newBalance: parseFloat(newBalance.toFixed(2)),
    amount: fundingAmount,
    reference: reference,
    transaction: transaction ? {
      id: transaction.id,
      reference: transaction.reference,
      amount: transaction.amount,
      status: transaction.status,
      createdAt: transaction.created_at
    } : null
  }, 'Account funded successfully'));
}));

/**
 * @route   GET /api/user/transactions
 * @desc    Get user transaction history
 * @access  Private
 */
router.get('/transactions', verifyToken, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  // Get total count
  const { count } = await supabaseAdmin
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', req.user.id);

  // Get transactions with pagination
  const { data: transactions, error } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Transactions fetch error:', error);
    return res.status(500).json(errorResponse('Failed to fetch transactions'));
  }

  const totalPages = Math.ceil((count || 0) / limit);

  res.json(successResponse({
    transactions: transactions || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  }));
}));

/**
 * @route   GET /api/user/bookings
 * @desc    Get user booking history
 * @access  Private
 */
router.get('/bookings', verifyToken, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  // Get total count
  const { count } = await supabaseAdmin
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', req.user.id);

  // Get bookings with route information
  const { data: bookings, error } = await supabaseAdmin
    .from('bookings')
    .select(`
      id,
      booking_code,
      pickup_location,
      dropoff_location,
      departure_time,
      status,
      total_price,
      number_of_seats,
      created_at,
      routes (
        id,
        name,
        origin,
        destination,
        price
      )
    `)
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Bookings fetch error:', error);
    return res.status(500).json(errorResponse('Failed to fetch bookings'));
  }

  const totalPages = Math.ceil((count || 0) / limit);

  res.json(successResponse({
    bookings: bookings || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  }));
}));

module.exports = router;
