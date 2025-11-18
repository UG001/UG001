const express = require('express');
const { supabaseAdmin } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/helpers');

const router = express.Router();

/**
 * @route   GET /api/transactions
 * @desc    Get all user transactions with pagination
 * @access  Private
 */
router.get('/', verifyToken, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const { count } = await supabaseAdmin
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', req.user.id);

  const { data: transactions, error } = await supabaseAdmin
    .from('transactions')
    .select(`
      *,
      bookings (
        id,
        booking_code,
        pickup_location,
        dropoff_location,
        routes (
          name,
          origin,
          destination
        )
      )
    `)
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Transactions fetch error:', error);
    throw new AppError('Failed to fetch transactions', 500);
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
 * @route   GET /api/transactions/:id
 * @desc    Get single transaction by ID
 * @access  Private
 */
router.get('/:id', verifyToken, asyncHandler(async (req, res) => {
  const { data: transaction, error } = await supabaseAdmin
    .from('transactions')
    .select(`
      *,
      bookings (
        id,
        booking_code,
        pickup_location,
        dropoff_location,
        departure_time,
        status,
        routes (
          name,
          origin,
          destination
        )
      )
    `)
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single();

  if (error || !transaction) {
    throw new AppError('Transaction not found', 404);
  }

  res.json(successResponse({ transaction }));
}));

module.exports = router;
