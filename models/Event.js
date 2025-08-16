const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  date: {
    type: Date,
    required: [true, 'Event date is required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Event date must be in the future'
    }
  },
  location: {
    type: String,
    required: [true, 'Event location is required'],
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  max_volunteers: {
    type: Number,
    required: [true, 'Maximum volunteers is required'],
    min: [1, 'Must allow at least 1 volunteer'],
    max: [1000, 'Cannot exceed 1000 volunteers']
  },
  category: {
    type: String,
    enum: ['Environment', 'Education', 'Health', 'Community', 'Animals', 'Elderly', 'General'],
    default: 'General'
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  volunteers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Virtual field: Current number of volunteers
eventSchema.virtual('current_volunteers').get(function() {
  return this.volunteers.length;
});

// Virtual field: Check if event is full
eventSchema.virtual('is_full').get(function() {
  return this.volunteers.length >= this.max_volunteers;
});

// Virtual field: Spots remaining
eventSchema.virtual('spots_remaining').get(function() {
  return this.max_volunteers - this.volunteers.length;
});

// Include virtual fields when converting to JSON
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

// Index for performance
eventSchema.index({ date: 1 }); // Events sorted by date
eventSchema.index({ created_by: 1 }); // Events by creator
eventSchema.index({ category: 1 }); // Events by category

module.exports = mongoose.model('Event', eventSchema);