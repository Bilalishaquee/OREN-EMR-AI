import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import {
  getAuthUrl,
  handleAuthCallback,
  insertEventForAppointment,
  updateEventForAppointment,
  deleteEventById,
} from '../services/googleCalendarService.js';

const router = express.Router();

/** OAuth callback (PUBLIC) */
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) return res.status(400).send('Missing code/state');

    await handleAuthCallback(code, state);
    const client = process.env.CLIENT_URL || 'http://localhost:5173';
    return res.redirect(`${client}/settings?calendarConnected=true`);
  } catch (err) {
    console.error('Callback error:', err);
    const client = process.env.CLIENT_URL || 'http://localhost:5173';
    return res.redirect(`${client}/settings?calendarConnected=false`);
  }
});

// Everything below requires auth
router.use(authenticateToken);

/** Get OAuth URL */
router.get('/auth', async (req, res) => {
  try {
    const authUrl = getAuthUrl(req.user.id);
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/** Status – “connected” if we have either refresh or access token */
router.get('/status', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const connected = !!(user?.googleCalendar?.refreshToken || user?.googleCalendar?.accessToken);
    res.json({ connected });
  } catch (e) {
    console.error('Error checking status:', e);
    res.status(500).json({ connected: false, message: 'Server error', error: e.message });
  }
});

/** Manual sync (if you want to hit it) */
router.post('/sync/:appointmentId', async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.appointmentId)
      .populate('patient', 'firstName lastName')
      .populate('doctor', 'firstName lastName');
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });

    // Only allow doctor who owns it, or admin
    if (req.user.role === 'doctor' && String(appt.doctor._id) !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const data = await insertEventForAppointment(appt);
    appt.googleCalendarEventId = data.id;
    await appt.save();
    res.json({ message: 'Synced to Google Calendar', event: data });
  } catch (error) {
    console.error('Error syncing appointment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/sync/:appointmentId', async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.appointmentId)
      .populate('patient', 'firstName lastName')
      .populate('doctor', 'firstName lastName');
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });
    if (!appt.googleCalendarEventId) return res.status(400).json({ message: 'Not synced yet' });

    if (req.user.role === 'doctor' && String(appt.doctor._id) !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const data = await updateEventForAppointment(appt, appt.googleCalendarEventId);
    res.json({ message: 'Google Calendar event updated', event: data });
  } catch (error) {
    console.error('Error updating GC event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/sync/:appointmentId', async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.appointmentId);
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });
    if (!appt.googleCalendarEventId) return res.status(400).json({ message: 'Not synced yet' });

    if (req.user.role === 'doctor' && String(appt.doctor) !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await deleteEventById(appt.doctor, appt.googleCalendarEventId);
    appt.googleCalendarEventId = undefined;
    await appt.save();
    res.json({ message: 'Google Calendar event deleted' });
  } catch (error) {
    console.error('Error deleting GC event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
