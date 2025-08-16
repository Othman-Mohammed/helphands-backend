const express = require('express');
const Event = require('../models/Event'); 
const { auth } = require('../middleware/auth'); 

const router = express.Router();

// GET /api/events - Get all events (Public - volunteers can browse)
router.get('/', async (req, res) => {
  try {
    const events = await Event.find()
      .populate('created_by', 'name email')
      .populate('volunteers', 'name email')
      .sort({ date: 1 });
    
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/events/:id - Get specific event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('created_by', 'name email')
      .populate('volunteers', 'name email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/events - Create new event (Admin only)
router.post('/', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { title, description, date, location, max_volunteers, category } = req.body;

    const event = new Event({
      title,
      description,
      date,
      location,
      max_volunteers,
      category,
      created_by: req.user.userId, 
      volunteers: []
    });

    await event.save();
    await event.populate('created_by', 'name email');

    res.status(201).json({
      message: 'Event created successfully',
      event
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/events/:id - Update event (Admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { title, description, date, location, max_volunteers, category } = req.body;

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Validate new max_volunteers doesn't go below current volunteers
    if (max_volunteers && max_volunteers < event.volunteers.length) {
      return res.status(400).json({ 
        message: `Cannot reduce capacity below current ${event.volunteers.length} volunteers` 
      });
    }

    // Update fields
    if (title) event.title = title;
    if (description) event.description = description;
    if (date) event.date = date;
    if (location) event.location = location;
    if (max_volunteers) event.max_volunteers = max_volunteers;
    if (category) event.category = category;

    await event.save();
    await event.populate('created_by', 'name email');
    await event.populate('volunteers', 'name email');

    res.json({
      message: 'Event updated successfully',
      event
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/events/:id - Delete event (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/events/:id/join - Join event (Volunteers)
router.post('/:id/join', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if event is full
    if (event.volunteers.length >= event.max_volunteers) {
      return res.status(400).json({ message: 'Event is full' });
    }

    // Check if user already joined
    if (event.volunteers.includes(req.user.userId)) { 
      return res.status(400).json({ message: 'Already joined this event' });
    }

    // Add user to volunteers
    event.volunteers.push(req.user.userId);  
    await event.save();

    await event.populate('volunteers', 'name email');

    res.json({
      message: 'Successfully joined event',
      event
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/events/:id/leave - Leave event (Volunteers)
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is in volunteers list
    if (!event.volunteers.includes(req.user.userId)) {  
      return res.status(400).json({ message: 'Not joined in this event' });
    }

    // Remove user from volunteers
    event.volunteers = event.volunteers.filter(id => id.toString() !== req.user.userId); 
    await event.save();

    await event.populate('volunteers', 'name email');

    res.json({
      message: 'Successfully left event',
      event
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/events/:id/volunteers/:volunteerId - Remove volunteer (Admin only)
router.delete('/:id/volunteers/:volunteerId', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const { volunteerId } = req.params;

    // Check if volunteer is in the event
    if (!event.volunteers.includes(volunteerId)) {
      return res.status(404).json({ message: 'Volunteer not found in this event' });
    }

    // Remove volunteer
    event.volunteers = event.volunteers.filter(id => id.toString() !== volunteerId);
    await event.save();

    await event.populate('volunteers', 'name email');

    res.json({
      message: 'Volunteer removed successfully',
      event
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;