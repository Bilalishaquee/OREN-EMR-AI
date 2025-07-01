import { google } from 'googleapis';
import dotenv from 'dotenv';
import Appointment from '../models/Appointment.js';

dotenv.config();

// Google Calendar API configuration
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const calendar = google.calendar('v3');

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL
);

/**
 * Generate a URL for user authorization
 * @param {string} userId - The user ID to associate with the token
 * @returns {string} The authorization URL
 */
export const getAuthUrl = (userId) => {
  // Store the user ID in the state parameter for retrieval after authorization
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: userId,
    prompt: 'consent' // Force to get refresh token
  });
};

/**
 * Handle the OAuth2 callback and save tokens
 * @param {string} code - The authorization code
 * @param {string} state - The state parameter containing userId
 * @returns {Promise<Object>} The tokens
 */
export const handleAuthCallback = async (code, state) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    // Here you would typically store these tokens in your database
    // associated with the user ID from the state parameter
    return tokens;
  } catch (error) {
    console.error('Error getting tokens:', error);
    throw error;
  }
};

/**
 * Set credentials for the OAuth2 client
 * @param {Object} tokens - The OAuth2 tokens
 */
export const setCredentials = (tokens) => {
  oauth2Client.setCredentials(tokens);
};

/**
 * Sync an appointment to Google Calendar
 * @param {Object} appointment - The appointment to sync
 * @param {Object} tokens - The OAuth2 tokens
 * @returns {Promise<Object>} The created Google Calendar event
 */
export const syncAppointmentToCalendar = async (appointment, tokens) => {
  try {
    setCredentials(tokens);
    
    // Format the appointment date and time for Google Calendar
    const startDateTime = new Date(appointment.date);
    const [startHours, startMinutes] = appointment.time.start.split(':');
    startDateTime.setHours(parseInt(startHours, 10), parseInt(startMinutes, 10));
    
    const endDateTime = new Date(appointment.date);
    const [endHours, endMinutes] = appointment.time.end.split(':');
    endDateTime.setHours(parseInt(endHours, 10), parseInt(endMinutes, 10));
    
    // Get patient name for the event title
    const patientName = `${appointment.patient.firstName} ${appointment.patient.lastName}`;
    
    // Determine color based on appointment type or patient
    // Google Calendar uses colorId from 1-11 for events
    let colorId;
    
    // If appointment has a colorCode, map it to Google Calendar colorId
    if (appointment.colorCode) {
      // This is a simple mapping example - you may need to adjust based on your color codes
      colorId = mapColorToGoogleColorId(appointment.colorCode);
    }
    
    const event = {
      summary: `Appointment: ${patientName}`,
      description: appointment.notes || 'No additional notes',
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'America/New_York', // Adjust to your timezone
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'America/New_York', // Adjust to your timezone
      },
      colorId: colorId,
      // Store the appointment ID in the event's extended properties
      // This allows us to link the Google Calendar event back to our appointment
      extendedProperties: {
        private: {
          appointmentId: appointment._id.toString()
        }
      }
    };
    
    const response = await calendar.events.insert({
      auth: oauth2Client,
      calendarId: 'primary',
      resource: event,
    });
    
    return response.data;
  } catch (error) {
    console.error('Error syncing appointment to Google Calendar:', error);
    throw error;
  }
};

/**
 * Update a Google Calendar event for an appointment
 * @param {Object} appointment - The updated appointment
 * @param {string} eventId - The Google Calendar event ID
 * @param {Object} tokens - The OAuth2 tokens
 * @returns {Promise<Object>} The updated Google Calendar event
 */
export const updateCalendarEvent = async (appointment, eventId, tokens) => {
  try {
    setCredentials(tokens);
    
    // Format the appointment date and time for Google Calendar
    const startDateTime = new Date(appointment.date);
    const [startHours, startMinutes] = appointment.time.start.split(':');
    startDateTime.setHours(parseInt(startHours, 10), parseInt(startMinutes, 10));
    
    const endDateTime = new Date(appointment.date);
    const [endHours, endMinutes] = appointment.time.end.split(':');
    endDateTime.setHours(parseInt(endHours, 10), parseInt(endMinutes, 10));
    
    // Get patient name for the event title
    const patientName = `${appointment.patient.firstName} ${appointment.patient.lastName}`;
    
    // Determine color based on appointment type or patient
    let colorId;
    if (appointment.colorCode) {
      colorId = mapColorToGoogleColorId(appointment.colorCode);
    }
    
    const event = {
      summary: `Appointment: ${patientName}`,
      description: appointment.notes || 'No additional notes',
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'America/New_York', // Adjust to your timezone
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'America/New_York', // Adjust to your timezone
      },
      colorId: colorId,
      extendedProperties: {
        private: {
          appointmentId: appointment._id.toString()
        }
      }
    };
    
    const response = await calendar.events.update({
      auth: oauth2Client,
      calendarId: 'primary',
      eventId: eventId,
      resource: event,
    });
    
    return response.data;
  } catch (error) {
    console.error('Error updating Google Calendar event:', error);
    throw error;
  }
};

/**
 * Delete a Google Calendar event
 * @param {string} eventId - The Google Calendar event ID
 * @param {Object} tokens - The OAuth2 tokens
 * @returns {Promise<void>}
 */
export const deleteCalendarEvent = async (eventId, tokens) => {
  try {
    setCredentials(tokens);
    
    await calendar.events.delete({
      auth: oauth2Client,
      calendarId: 'primary',
      eventId: eventId,
    });
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    throw error;
  }
};

/**
 * Map a hex color code to Google Calendar colorId
 * @param {string} hexColor - The hex color code
 * @returns {string} The Google Calendar colorId
 */
const mapColorToGoogleColorId = (hexColor) => {
  // Google Calendar color IDs (approximate mapping)
  // 1: Blue, 2: Green, 3: Purple, 4: Red, 5: Yellow, 
  // 6: Orange, 7: Turquoise, 8: Gray, 9: Bold Blue, 10: Bold Green, 11: Bold Red
  
  // Convert hex to lowercase for comparison
  hexColor = hexColor.toLowerCase();
  
  // Simple mapping based on common colors
  // You can customize this mapping based on your needs
  switch (hexColor) {
    case '#4285f4':
    case '#5484ed':
    case '#0000ff':
    case '#1a73e8':
      return '1'; // Blue
    case '#0b8043':
    case '#51b749':
    case '#00ff00':
    case '#7ae7bf':
      return '2'; // Green
    case '#8e24aa':
    case '#a32929':
    case '#dc2127':
    case '#ff0000':
      return '4'; // Red
    case '#f4511e':
    case '#ff7537':
    case '#ffad46':
    case '#ffa500':
      return '6'; // Orange
    case '#ffff00':
    case '#fbd75b':
    case '#ffbc00':
      return '5'; // Yellow
    case '#46bdc6':
    case '#33b679':
      return '7'; // Turquoise
    case '#e1e1e1':
    case '#9e9e9e':
    case '#616161':
      return '8'; // Gray
    case '#3f51b5':
    case '#5c6bc0':
      return '9'; // Bold Blue
    case '#0b8043':
    case '#0f9d58':
      return '10'; // Bold Green
    case '#d50000':
    case '#db4437':
      return '11'; // Bold Red
    default:
      // Default to blue if no match
      return '1';
  }
};