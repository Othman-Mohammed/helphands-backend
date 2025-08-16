const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Announcement title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Announcement content is required'],
    trim: true,
    maxlength: [2000, 'Content cannot exceed 2000 characters']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  target_audience: {
    type: String,
    enum: ['all', 'volunteers', 'admins'],
    default: 'all'
  },
  is_active: {
    type: Boolean,
    default: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Index for performance
announcementSchema.index({ priority: -1 }); // High priority first
announcementSchema.index({ created_at: -1 }); // Newest first
announcementSchema.index({ target_audience: 1 }); // By audience
announcementSchema.index({ is_active: 1 }); // Active announcements

module.exports = mongoose.model('Announcement', announcementSchema);