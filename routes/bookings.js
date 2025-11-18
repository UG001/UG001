const express = require('express');
const { supabaseAdmin } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { bookingLimiter } = require('../middleware/rateLimiter');
const { validateBooking } = require('../middleware/validator');
const { successResponse, generateBookingCode } = require('../utils/helpers');
const { BOOKING_STATUS, TRANSACTION_TYPE, TRANSACTION_STATUS, PAYMENT_METHOD } = require('../utils/constants');

const router = express.Router();

/**
 * @route   GET /api/bookings
 * @desc    Get all user bookings
 * @access  Private
 */
router.get('/', verifyToken, asyncHandler(async (req, res) => {
  const { data: bookings, error } = await supabaseAdmin
    .from('bookings')
    .select(`
      *,
      routes (
        id,
        name,
        origin,
        destination,
        price,
        estimated_duration
      )
    `)
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Bookings fetch error:', error);
    throw new AppError('Failed to fetch bookings', 500);
  }

  res.json(successResponse({ bookings: bookings || [] }));
}));

/**
 * @route   GET /api/bookings/:id
 * @desc    Get single booking by ID
 * @access  Private
 */
router.get('/:id', verifyToken, asyncHandler(async (req, res) => {
  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .select(`
      *,
      routes (
        id,
        name,
        origin,
        destination,
        price,
        estimated_duration
      )
    `)
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single();

  if (error || !booking) {
    throw new AppError('Booking not found', 404);
  }

  res.json(successResponse({ booking }));
}));

/**
 * @route   POST /api/bookings
 * @desc    Create new booking with atomic transaction
 * @access  Private
 */
router.post('/', verifyToken, bookingLimiter, validateBooking, asyncHandler(async (req, res) => {
  const { routeId, pickupLocation, dropoffLocation, departureTime, numberOfSeats = 1 } = req.body;

  const { data: route, error: routeError } = await supabaseAdmin
    .from('routes')
    .select('*')
    .eq('id', routeId)
    .eq('is_active', true)
    .single();

  if (routeError || !route) {
    throw new AppError('Route not found or inactive', 404);
  }

  if (route.available_seats < numberOfSeats) {
    throw new AppError(`Only ${route.available_seats} seats available`, 400);
  }

  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('balance, total_rides, total_spent, full_name, email')
    .eq('id', req.user.id)
    .eq('is_active', true)
    .single();

  if (userError || !user) {
    throw new AppError('User not found', 404);
  }

  const totalPrice = parseFloat(route.price) * parseInt(numberOfSeats);
  const currentBalance = parseFloat(user.balance);

  if (currentBalance < totalPrice) {
    throw new AppError(
      `Insufficient balance. Required: ₦${totalPrice}, Available: ₦${currentBalance}`,
      400
    );
  }

  const bookingCode = generateBookingCode();
  const newBalance = currentBalance - totalPrice;
  const newTotalRides = parseInt(user.total_rides) + parseInt(numberOfSeats);
  const newTotalSpent = parseFloat(user.total_spent) + totalPrice;
  const newAvailableSeats = route.available_seats - numberOfSeats;

  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .insert([{
      user_id: req.user.id,
      route_id: routeId,
      pickup_location: pickupLocation,
      dropoff_location: dropoffLocation,
      departure_time: departureTime,
      number_of_seats: numberOfSeats,
      total_price: totalPrice,
      status: BOOKING_STATUS.CONFIRMED,
      booking_code: bookingCode
    }])
    .select()
    .single();

  if (bookingError) {
    console.error('Booking creation error:', bookingError);
    throw new AppError('Failed to create booking', 500);
  }

  const { error: balanceError } = await supabaseAdmin
    .from('users')
    .update({
      balance: newBalance,
      total_rides: newTotalRides,
      total_spent: newTotalSpent
    })
    .eq('id', req.user.id);

  if (balanceError) {
    await supabaseAdmin.from('bookings').delete().eq('id', booking.id);
    console.error('Balance update error:', balanceError);
    throw new AppError('Failed to process payment', 500);
  }

  const { error: seatsError } = await supabaseAdmin
    .from('routes')
    .update({ available_seats: newAvailableSeats })
    .eq('id', routeId);

  if (seatsError) {
    await supabaseAdmin.from('bookings').delete().eq('id', booking.id);
    await supabaseAdmin.from('users').update({
      balance: currentBalance,
      total_rides: user.total_rides,
      total_spent: user.total_spent
    }).eq('id', req.user.id);
    console.error('Seats update error:', seatsError);
    throw new AppError('Failed to reserve seats', 500);
  }

  const { error: transactionError } = await supabaseAdmin
    .from('transactions')
    .insert([{
      user_id: req.user.id,
      booking_id: booking.id,
      amount: totalPrice,
      type: TRANSACTION_TYPE.BOOKING,
      payment_method: PAYMENT_METHOD.WALLET,
      status: TRANSACTION_STATUS.COMPLETED,
      reference: bookingCode,
      description: `Booking for ${route.name} - ${numberOfSeats} seat(s)`
    }]);

  if (transactionError) {
    console.error('Transaction record error:', transactionError);
  }

  res.status(201).json(successResponse({
    booking: {
      id: booking.id,
      bookingCode: booking.booking_code,
      routeId: booking.route_id,
      pickupLocation: booking.pickup_location,
      dropoffLocation: booking.dropoff_location,
      departureTime: booking.departure_time,
      numberOfSeats: booking.number_of_seats,
      totalPrice: booking.total_price,
      status: booking.status,
      createdAt: booking.created_at
    },
    newBalance,
    route: {
      name: route.name,
      origin: route.origin,
      destination: route.destination
    }
  }, 'Booking created successfully'));
}));

/**
 * @route   PATCH /api/bookings/:id/cancel
 * @desc    Cancel a booking and refund
 * @access  Private
 */
router.patch('/:id/cancel', verifyToken, asyncHandler(async (req, res) => {
  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .select('*, routes(*)')
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single();

  if (bookingError || !booking) {
    throw new AppError('Booking not found', 404);
  }

  if (booking.status === BOOKING_STATUS.CANCELLED) {
    throw new AppError('Booking is already cancelled', 400);
  }

  if (booking.status === BOOKING_STATUS.COMPLETED) {
    throw new AppError('Cannot cancel completed booking', 400);
  }

  const departureTime = new Date(booking.departure_time);
  const now = new Date();
  const hoursUntilDeparture = (departureTime - now) / (1000 * 60 * 60);

  if (hoursUntilDeparture < 2) {
    throw new AppError('Cannot cancel booking less than 2 hours before departure', 400);
  }

  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('balance')
    .eq('id', req.user.id)
    .single();

  if (userError || !user) {
    throw new AppError('User not found', 404);
  }

  const refundAmount = parseFloat(booking.total_price);
  const newBalance = parseFloat(user.balance) + refundAmount;

  const { error: cancelError } = await supabaseAdmin
    .from('bookings')
    .update({ status: BOOKING_STATUS.CANCELLED })
    .eq('id', booking.id);

  if (cancelError) {
    console.error('Booking cancellation error:', cancelError);
    throw new AppError('Failed to cancel booking', 500);
  }

  const { error: refundError } = await supabaseAdmin
    .from('users')
    .update({ balance: newBalance })
    .eq('id', req.user.id);

  if (refundError) {
    await supabaseAdmin.from('bookings').update({ status: booking.status }).eq('id', booking.id);
    console.error('Refund error:', refundError);
    throw new AppError('Failed to process refund', 500);
  }

  const newAvailableSeats = booking.routes.available_seats + booking.number_of_seats;
  await supabaseAdmin
    .from('routes')
    .update({ available_seats: newAvailableSeats })
    .eq('id', booking.route_id);

  await supabaseAdmin
    .from('transactions')
    .insert([{
      user_id: req.user.id,
      booking_id: booking.id,
      amount: refundAmount,
      type: TRANSACTION_TYPE.REFUND,
      payment_method: PAYMENT_METHOD.WALLET,
      status: TRANSACTION_STATUS.COMPLETED,
      reference: `REFUND-${booking.booking_code}`,
      description: `Refund for cancelled booking ${booking.booking_code}`
    }]);

  res.json(successResponse({
    message: 'Booking cancelled successfully',
    refundAmount,
    newBalance
  }));
}));

module.exports = router;
