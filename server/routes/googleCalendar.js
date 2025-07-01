import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import mongoose from 'mongoose';
import {
  getAuthUrl,
  handleAuthCallback,
  syncAppointmentToCalendar,
  updateCalendarEvent,
  deleteCalendarEvent
} from '../services/googleCalendarService.js';

const router = express.Router();

// Middleware to check if user is authenticated
router.use(authenticateToken);

/**
 * @route   GET /api/google-calendar/auth
 * @desc    Get Google OAuth2 authorization URL
 * @access  Private
 */
router.get('/auth', async (req, res) => {
  try {
    const userId = req.user.id;
    const authUrl = getAuthUrl(userId);
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/google-calendar/callback
 * @desc    Handle Google OAuth2 callback
 * @access  Public (but validates state parameter)
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }
    
    // The state parameter contains the user ID
    const userId = state;
    
    // Get tokens from the authorization code
    const tokens = await handleAuthCallback(code, state);
    
    // Store tokens in the user document
    await User.findByIdAndUpdate(userId, {
      googleCalendar: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date
      }
    });
    
    // Redirect to a success page or send a success response
    res.redirect('/settings?calendarConnected=true');
  } catch (error) {
    console.error('Error handling callback:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/google-calendar/sync/:appointmentId
 * @desc    Sync an appointment to Google Calendar
 * @access  Private
 */
router.post('/sync/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;
    
    // Get user's Google Calendar tokens
    const user = await User.findById(userId);
    if (!user.googleCalendar || !user.googleCalendar.accessToken) {
      return res.status(400).json({ message: 'Google Calendar not connected' });
    }
    
    // Get the appointment
    const appointment = await Appointment.findById(appointmentId)
      .populate('patient', 'firstName lastName')
      .populate('doctor', 'firstName lastName');
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Check if user has permission to sync this appointment
    if (req.user.role === 'doctor' && appointment.doctor._id.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Sync appointment to Google Calendar
    const event = await syncAppointmentToCalendar(appointment, user.googleCalendar);
    
    // Store the Google Calendar event ID in the appointment
    appointment.googleCalendarEventId = event.id;
    await appointment.save();
    
    res.json({
      message: 'Appointment synced to Google Calendar',
      event
    });
  } catch (error) {
    console.error('Error syncing appointment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/google-calendar/sync/:appointmentId
 * @desc    Update a synced appointment in Google Calendar
 * @access  Private
 */
router.put('/sync/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;
    
    // Get user's Google Calendar tokens
    const user = await User.findById(userId);
    if (!user.googleCalendar || !user.googleCalendar.accessToken) {
      return res.status(400).json({ message: 'Google Calendar not connected' });
    }
    
    // Get the appointment
    const appointment = await Appointment.findById(appointmentId)
      .populate('patient', 'firstName lastName')
      .populate('doctor', 'firstName lastName');
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Check if user has permission to update this appointment
    if (req.user.role === 'doctor' && appointment.doctor._id.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Check if appointment has a Google Calendar event ID
    if (!appointment.googleCalendarEventId) {
      return res.status(400).json({ message: 'Appointment not synced to Google Calendar' });
    }
    
    // Update the Google Calendar event
    const event = await updateCalendarEvent(
      appointment,
      appointment.googleCalendarEventId,
      user.googleCalendar
    );
    
    res.json({
      message: 'Google Calendar event updated',
      event
    });
  } catch (error) {
    console.error('Error updating Google Calendar event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   DELETE /api/google-calendar/sync/:appointmentId
 * @desc    Delete a synced appointment from Google Calendar
 * @access  Private
 */
router.delete('/sync/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;
    
    // Get user's Google Calendar tokens
    const user = await User.findById(userId);
    if (!user.googleCalendar || !user.googleCalendar.accessToken) {
      return res.status(400).json({ message: 'Google Calendar not connected' });
    }
    
    // Get the appointment
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Check if user has permission to delete this appointment
    if (req.user.role === 'doctor' && appointment.doctor.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Check if appointment has a Google Calendar event ID
    if (!appointment.googleCalendarEventId) {
      return res.status(400).json({ message: 'Appointment not synced to Google Calendar' });
    }
    
    // Delete the Google Calendar event
    await deleteCalendarEvent(appointment.googleCalendarEventId, user.googleCalendar);
    
    // Remove the Google Calendar event ID from the appointment
    appointment.googleCalendarEventId = undefined;
    await appointment.save();
    
    res.json({ message: 'Google Calendar event deleted' });
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/google-calendar/sync-all
 * @desc    Sync all appointments to Google Calendar
 * @access  Private (Admin or Doctor)
 */
router.post('/sync-all', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's Google Calendar tokens
    const user = await User.findById(userId);
    if (!user.googleCalendar || !user.googleCalendar.accessToken) {
      return res.status(400).json({ message: 'Google Calendar not connected' });
    }
    
    // Build filter based on user role
    const filter = {};
    if (req.user.role === 'doctor') {
      filter.doctor = userId;
    }
    
    // Get all appointments that haven't been synced yet
    const appointments = await Appointment.find({
      ...filter,
      googleCalendarEventId: { $exists: false },
      status: { $nin: ['cancelled', 'no-show'] }
    })
      .populate('patient', 'firstName lastName')
      .populate('doctor', 'firstName lastName');
    
    // Sync each appointment
    const results = [];
    for (const appointment of appointments) {
      try {
        const event = await syncAppointmentToCalendar(appointment, user.googleCalendar);
        
        // Store the Google Calendar event ID in the appointment
        appointment.googleCalendarEventId = event.id;
        await appointment.save();
        
        results.push({
          appointmentId: appointment._id,
          eventId: event.id,
          status: 'success'
        });
      } catch (error) {
        results.push({
          appointmentId: appointment._id,
          status: 'error',
          error: error.message
        });
      }
    }
    
    res.json({
      message: `Synced ${results.filter(r => r.status === 'success').length} of ${appointments.length} appointments`,
      results
    });
  } catch (error) {
    console.error('Error syncing all appointments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;