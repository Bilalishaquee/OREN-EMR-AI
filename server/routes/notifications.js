import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken } from '../middleware/authMiddleware.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Get all notifications for the current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { isRead, isDismissed, type, limit = 50 } = req.query;
    
    // Build filter object
    const filter = { user: userId };
    
    // Filter by read status if provided
    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }
    
    // Filter by dismissed status if provided
    if (isDismissed !== undefined) {
      filter.isDismissed = isDismissed === 'true';
    }
    
    // Filter by notification type if provided
    if (type) {
      filter.type = type;
    }
    
    // Get notifications with populated references
    const notifications = await Notification.find(filter)
      .populate('relatedTask')
      .populate('relatedPatient', 'firstName lastName dateOfBirth')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    // Get unread count
    const unreadCount = await Notification.countDocuments({ 
      user: userId, 
      isRead: false,
      isDismissed: false
    });
    
    res.status(200).json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;
    
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Ensure the notification belongs to the current user
    if (notification.user.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this notification' });
    }
    
    notification.isRead = true;
    await notification.save();
    
    res.status(200).json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ message: 'Failed to update notification', error: error.message });
  }
});

// Mark notification as dismissed
router.put('/:id/dismiss', authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;
    
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Ensure the notification belongs to the current user
    if (notification.user.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this notification' });
    }
    
    notification.isDismissed = true;
    await notification.save();
    
    res.status(200).json({ message: 'Notification dismissed', notification });
  } catch (error) {
    console.error('Error dismissing notification:', error);
    res.status(500).json({ message: 'Failed to dismiss notification', error: error.message });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;
    
    const filter = { 
      user: userId,
      isRead: false
    };
    
    // Filter by type if provided
    if (type) {
      filter.type = type;
    }
    
    const result = await Notification.updateMany(
      filter,
      { $set: { isRead: true } }
    );
    
    res.status(200).json({ 
      message: 'All notifications marked as read',
      count: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Failed to update notifications', error: error.message });
  }
});

// Delete a notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;
    
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Ensure the notification belongs to the current user
    if (notification.user.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this notification' });
    }
    
    await Notification.findByIdAndDelete(notificationId);
    
    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Failed to delete notification', error: error.message });
  }
});

export default router;