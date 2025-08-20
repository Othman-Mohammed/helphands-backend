// Announcement Controller - Handle announcement operations
const Announcement = require('../models/Announcement');
const Event = require('../models/Event');

// Get announcements for current user's events
const getMyAnnouncements = async (req, res) => {
  try {
    // Get events that the user is enrolled in
    const userEvents = await Event.find({
      volunteers: req.user.userId
    }).select('_id');

    const eventIds = userEvents.map(event => event._id);

    // Get announcements for those events
    const announcements = await Announcement.find({
      event: { $in: eventIds }
    })
    .populate('event', 'title date location')
    .populate('created_by', 'name')
    .sort({ createdAt: -1 }); // Most recent first

    res.json(announcements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark announcement as read
const markAsRead = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Check if user is enrolled in the event
    const event = await Event.findById(announcement.event);
    if (!event.volunteers.includes(req.user.userId)) {
      return res.status(403).json({ message: 'You are not enrolled in this event' });
    }

    // Check if already marked as read
    const alreadyRead = announcement.read_by.some(
      read => read.user.toString() === req.user.userId
    );

    if (!alreadyRead) {
      announcement.read_by.push({
        user: req.user.userId,
        read_at: new Date()
      });
      await announcement.save();
    }

    res.json({ message: 'Announcement marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getMyAnnouncements,
  markAsRead
};
