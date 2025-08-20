// Announcement management for volunteers
const express = require('express');
const { getMyAnnouncements, markAsRead } = require('../controllers/announcementController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get my announcements (from events I'm enrolled in)
router.get('/my-announcements', auth, getMyAnnouncements);

// Mark announcement as read
router.post('/:id/read', auth, markAsRead);

module.exports = router;
