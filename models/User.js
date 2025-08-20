const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    default: 'volunteer' // Everyone is volunteer by default, except  foe the pre created admin that I created
  }
}, {
  timestamps: true // Adds createdat and updatedat automatically
});

module.exports = mongoose.model('User', userSchema);
