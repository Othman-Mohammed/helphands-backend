const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { auth } = require('../middleware/auth'); 

const router = express.Router();

// GET all users - READ (Admin only)
router.get('/', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET specific user by ID - READ
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Users can only view their own profile OR admin can view anyone
    if (req.user.userId !== req.params.id && req.user.role !== 'admin') { 
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// UPDATE user - UPDATE
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, email, phone, address, role, status, password } = req.body;

    // Users can only edit their own profile OR admin can edit anyone
    if (req.user.userId !== req.params.id && req.user.role !== 'admin') { 
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    // Only admin can change role and status
    if (req.user.role === 'admin') {
      if (role) user.role = role;
      if (status) user.status = status;
    }

    // If new password provided, hash it
    if (password) {
      const saltRounds = 10;
      user.password = await bcrypt.hash(password, saltRounds);
    }

    await user.save();

    // Send updated user (without password)
    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE user - DELETE
router.delete('/:id', auth, async (req, res) => {
  try {
    // Users can delete their own account OR admin can delete anyone
    if (req.user.userId !== req.params.id && req.user.role !== 'admin') { 
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;