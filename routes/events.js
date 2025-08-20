// Event management
const express = require('express');
const {
  getAllEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  joinEvent,
  leaveEvent,
  removeVolunteer,
  sendAnnouncement
} = require('../controllers/eventController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all events
router.get('/', getAllEvents);

// Get single event
router.get('/:id', getEvent);

// Create new event (Admin only)
router.post('/', auth, createEvent);

// Update event (Admin only)
router.put('/:id', auth, updateEvent);

// Delete event (Admin only)
router.delete('/:id', auth, deleteEvent);

// Join event (Volunteers)
router.post('/:id/join', auth, joinEvent);

// Leave event (Volunteers)
router.post('/:id/leave', auth, leaveEvent);

// Remove volunteer from event (Admin only)
router.delete('/:id/volunteers/:volunteerId', auth, removeVolunteer);

// Send announcement to event volunteers (Admin only)
router.post('/:id/announce', auth, sendAnnouncement);

module.exports = router;
