import express from 'express';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Middleware to check if user is authenticated
router.use(authenticateToken);

/**
 * @route   PUT /api/auth/update-profile
 * @desc    Update user profile information
 * @access  Private
 */
router.put('/update-profile', async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    const userId = req.user.id;
    
    // Check if email is already in use by another user
    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already in use' });
    }
    
    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, email },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;