// Seed Admin Account
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'Othman@ga' });
    if (existingAdmin) {
      console.log('Admin already exists!');
      console.log('Email: Othman@ga');
      console.log('Password: 123456');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Create admin user
    const admin = new User({
      name: 'Othman',
      email: 'Othman@ga',
      password: hashedPassword,
      phone: '',
      address: '',
      role: 'admin'
    });

    await admin.save();
    console.log('Admin created successfully!');
    console.log('Email: Othman@ga');
    console.log('Password: 123456');

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

seedAdmin();
