// To handle event operations
const Event = require('../models/Event');
const User = require('../models/User');
const Announcement = require('../models/Announcement');

// Get all events
const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate('created_by', 'name')
      .populate('volunteers', 'name email')
      .sort({ date: 1 }); // Sort by date

    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single event
const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('created_by', 'name')
      .populate('volunteers', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new event (Admin only)
const createEvent = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can create events' });
    }

    const { title, description, date, time, location, max_volunteers } = req.body;

    const event = new Event({
      title,
      description,
      date,
      time,
      location,
      max_volunteers,
      created_by: req.user.userId,
      volunteers: []
    });

    await event.save();
    await event.populate('created_by', 'name');

    res.status(201).json({
      message: 'Event created successfully',
      event
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update event (Admin only)
const updateEvent = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can update events' });
    }

    const { title, description, date, time, location, max_volunteers } = req.body;

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Update fields if provided
    if (title) event.title = title;
    if (description) event.description = description;
    if (date) event.date = date;
    if (time) event.time = time;
    if (location) event.location = location;
    if (max_volunteers) event.max_volunteers = max_volunteers;

    await event.save();
    await event.populate('created_by', 'name');
    await event.populate('volunteers', 'name email');

    res.json({
      message: 'Event updated successfully',
      event
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete event (Admin only)
const deleteEvent = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can delete events' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Join event (Volunteers)
const joinEvent = async (req, res) => {
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
      return res.status(400).json({ message: 'You already joined this event' });
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
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Leave event (Volunteers)
const leaveEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is in volunteers list
    if (!event.volunteers.includes(req.user.userId)) {
      return res.status(400).json({ message: 'You are not enrolled in this event' });
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
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove volunteer from event (Admin only)
const removeVolunteer = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can remove volunteers' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const volunteerId = req.params.volunteerId;

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
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send announcement to event volunteers (Admin only)
const sendAnnouncement = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can send announcements' });
    }

    const event = await Event.findById(req.params.id).populate('volunteers', 'name email');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Announcement message is required' });
    }

    // Create announcement in database
    const announcement = new Announcement({
      title: `Announcement for ${event.title}`,
      message: message,
      event: event._id,
      created_by: req.user.userId
    });

    await announcement.save();

    // In a real application, you would send emails or notifications here
    res.json({
      message: 'Announcement sent successfully',
      announcement: {
        id: announcement._id,
        eventTitle: event.title,
        message: message,
        sentTo: event.volunteers.length,
        volunteers: event.volunteers.map(v => ({ name: v.name, email: v.email }))
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  joinEvent,
  leaveEvent,
  removeVolunteer,
  sendAnnouncement
};
