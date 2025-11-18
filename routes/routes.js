const express = require('express');
const { supabasePublic } = require('../config/database');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { validateRouteId } = require('../middleware/validator');
const { successResponse } = require('../utils/helpers');

const router = express.Router();

/**
 * @route   GET /api/routes
 * @desc    Get all active routes
 * @access  Public
 */
router.get('/', asyncHandler(async (_req, res) => {
  const { data: routes, error } = await supabasePublic
    .from('routes')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Routes fetch error:', error);
    throw new AppError('Failed to fetch routes', 500);
  }

  res.json(successResponse({ routes: routes || [] }));
}));

/**
 * @route   GET /api/routes/:id
 * @desc    Get single route by ID
 * @access  Public
 */
router.get('/:id', validateRouteId, asyncHandler(async (req, res) => {
  const { data: route, error } = await supabasePublic
    .from('routes')
    .select('*')
    .eq('id', req.params.id)
    .eq('is_active', true)
    .single();

  if (error || !route) {
    throw new AppError('Route not found', 404);
  }

  res.json(successResponse({ route }));
}));

module.exports = router;
