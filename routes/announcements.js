const express = require('express');
const Announcement = require('../models/Announcement');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/announcements - Get all announcements (Public - all users can see)
router.get('/', async (req, res) => {
  try {
    const { target_audience, priority, active } = req.query;
    
    // Build filter object
    let filter = {};
    
    if (target_audience) filter.target_audience = target_audience;
    if (priority) filter.priority = priority;
    if (active !== undefined) filter.is_active = active === 'true';
    
    const announcements = await Announcement.find(filter)
      .populate('created_by', 'name email role')
      .sort({ priority: -1, createdAt: -1 }); // High priority first, then newest
    
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/announcements/:id - Get specific announcement
router.get('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('created_by', 'name email role');
    
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/announcements - Create new announcement (Admin only)
router.post('/', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { title, content, priority, target_audience, is_active } = req.body;

    const announcement = new Announcement({
      title,
      content,
      priority: priority || 'medium',
      target_audience: target_audience || 'all',
      is_active: is_active !== undefined ? is_active : true,
      created_by: req.user.userId
    });

    await announcement.save();
    await announcement.populate('created_by', 'name email role');

    res.status(201).json({
      message: 'Announcement created successfully',
      announcement
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/announcements/:id - Update announcement (Admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { title, content, priority, target_audience, is_active } = req.body;

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Update fields
    if (title) announcement.title = title;
    if (content) announcement.content = content;
    if (priority) announcement.priority = priority;
    if (target_audience) announcement.target_audience = target_audience;
    if (is_active !== undefined) announcement.is_active = is_active;

    await announcement.save();
    await announcement.populate('created_by', 'name email role');

    res.json({
      message: 'Announcement updated successfully',
      announcement
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/announcements/:id - Delete announcement (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Announcement deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/announcements/:id/toggle - Toggle active status (Admin only)
router.put('/:id/toggle', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Toggle active status
    announcement.is_active = !announcement.is_active;
    await announcement.save();
    await announcement.populate('created_by', 'name email role');

    res.json({
      message: `Announcement ${announcement.is_active ? 'activated' : 'deactivated'} successfully`,
      announcement
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;