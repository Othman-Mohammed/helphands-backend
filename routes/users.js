// User Profile management
const express = require('express');
const { getProfile, updateProfile, getMyEvents } = require('../controllers/userController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', auth, getProfile);

// Update user profile
router.put('/profile', auth, updateProfile);

// Get user's enrolled events
router.get('/my-events', auth, getMyEvents);

module.exports = router;
