const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/database');
const { config } = require('../config/env');
const { asyncHandler } = require('../middleware/errorHandler');
const { authLimiter } = require('../middleware/rateLimiter');
const { validateRegistration, validateLogin } = require('../middleware/validator');
const { successResponse, errorResponse } = require('../utils/helpers');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authLimiter, validateRegistration, asyncHandler(async (req, res) => {
  const { fullName, email, studentId, password, phoneNumber, department, level } = req.body;

  // Check if user already exists
  const { data: existingUser, error: checkError } = await supabaseAdmin
    .from('users')
    .select('email, student_id')
    .or(`email.eq.${email},student_id.eq.${studentId}`)
    .maybeSingle();

  if (checkError) {
    console.error('Database check error:', checkError);
    return res.status(500).json(errorResponse('Database error while checking existing user'));
  }

  if (existingUser) {
    const conflictField = existingUser.email === email ? 'email' : 'student ID';
    return res.status(409).json(
      errorResponse(`User with this ${conflictField} already exists`)
    );
  }

  // Hash password with configurable salt rounds
  const hashedPassword = await bcrypt.hash(password, config.bcrypt.saltRounds);

  // Create user
  const { data: user, error: insertError } = await supabaseAdmin
    .from('users')
    .insert([{
      full_name: fullName,
      email: email.toLowerCase(),
      student_id: studentId,
      password: hashedPassword,
      phone_number: phoneNumber,
      department: department || null,
      level: level || null,
      balance: 0.00,
      total_rides: 0,
      total_spent: 0.00,
      is_active: true
    }])
    .select('id, full_name, email, student_id, balance, phone_number, department, level')
    .single();

  if (insertError) {
    console.error('User creation error:', insertError);

    // Handle specific database errors
    if (insertError.code === '23505') {
      return res.status(409).json(errorResponse('User already exists'));
    }

    return res.status(500).json(errorResponse('Failed to create user'));
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  res.status(201).json(successResponse({
    token,
    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      studentId: user.student_id,
      phoneNumber: user.phone_number,
      department: user.department,
      level: user.level,
      balance: user.balance
    }
  }, 'Registration successful'));
}));

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return token
 * @access  Public
 */
router.post('/login', authLimiter, validateLogin, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const { data: user, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('is_active', true)
    .maybeSingle();

  if (fetchError) {
    console.error('User fetch error:', fetchError);
    return res.status(500).json(errorResponse('Database error'));
  }

  if (!user) {
    return res.status(401).json(errorResponse('Invalid email or password'));
  }

  // Check if account is active
  if (!user.is_active) {
    return res.status(403).json(errorResponse('Account is inactive. Please contact support.'));
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    return res.status(401).json(errorResponse('Invalid email or password'));
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  // Return user data without password
  res.json(successResponse({
    token,
    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      studentId: user.student_id,
      phoneNumber: user.phone_number,
      department: user.department,
      level: user.level,
      balance: user.balance,
      totalRides: user.total_rides,
      totalSpent: user.total_spent
    }
  }, 'Login successful'));
}));

module.exports = router;
