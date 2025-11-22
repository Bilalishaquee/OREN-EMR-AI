// services/googleCalendarService.js
import { google } from 'googleapis';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { Storage } from '@google-cloud/storage';

dotenv.config();

// const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const SCOPES = ['https://www.googleapis.com/auth/calendar','https://www.googleapis.com/auth/devstorage.read_write']; // includes read/write access to Google Calendar and Google Drive
const calendar = google.calendar('v3');

const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';
const DEFAULT_TIMEZONE = process.env.DEFAULT_TZ || 'Asia/Karachi'; // your local time

function makeOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URL
  );
}


export const getAuthUrl = (userId) => {
  const oauth2Client = makeOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // ensures refresh_token on first grant
    scope: SCOPES,
    state: userId,
  });
};

// Save tokens safely (keep old refresh_token if Google doesn’t resend it)
async function upsertUserTokens(userId, tokens) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found for token save');

  user.googleCalendar = user.googleCalendar || {};
  user.googleCalendar.accessToken = tokens.access_token || user.googleCalendar.accessToken;
  if (tokens.refresh_token) {
    user.googleCalendar.refreshToken = tokens.refresh_token;
  }
  user.googleCalendar.expiryDate = tokens.expiry_date || user.googleCalendar.expiryDate;
  await user.save();
  return user.googleCalendar;
}

export const handleAuthCallback = async (code, userId) => {
  const oauth2Client = makeOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  await upsertUserTokens(userId, tokens);
  return tokens;
};

// Get a ready-to-use OAuth client for a given user (auto-refresh if needed)
async function getAuthedClientForUser(userId) {
  const user = await User.findById(userId);
  if (!user?.googleCalendar?.refreshToken && !user?.googleCalendar?.accessToken) {
    throw new Error('Google Calendar not connected');
  }
  const oauth2Client = makeOAuthClient();
  oauth2Client.setCredentials({
    access_token: user.googleCalendar.accessToken,
    refresh_token: user.googleCalendar.refreshToken,
    expiry_date: user.googleCalendar.expiryDate,
  });

  // hook token refresh to keep DB updated
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token || tokens.refresh_token) {
      await upsertUserTokens(userId, tokens);
    }
  });

  return oauth2Client;
}

// Build a Calendar event from an appointment doc (expects populated patient/doctor)
function buildEventFromAppointment(appointment) {
  const start = new Date(appointment.date);
  const [sh, sm] = appointment.time.start.split(':').map((n) => parseInt(n, 10));
  start.setHours(sh, sm || 0, 0, 0);

  const end = new Date(appointment.date);
  const [eh, em] = appointment.time.end.split(':').map((n) => parseInt(n, 10));
  end.setHours(eh, em || 0, 0, 0);

  const patientName = `${appointment?.patient?.firstName || ''} ${appointment?.patient?.lastName || ''}`.trim();
  const doctorName  = `${appointment?.doctor?.firstName || ''} ${appointment?.doctor?.lastName || ''}`.trim();

  const event = {
    summary: `Appointment: ${patientName}`,
    description: [
      `Doctor: ${doctorName}`,
      `Type: ${appointment.type}`,
      `Status: ${appointment.status}`,
      appointment.notes ? `Notes: ${appointment.notes}` : ''
    ].filter(Boolean).join('\n'),
    start: { dateTime: start.toISOString(), timeZone: DEFAULT_TIMEZONE },
    end:   { dateTime: end.toISOString(),   timeZone: DEFAULT_TIMEZONE },
    extendedProperties: {
      private: { appointmentId: String(appointment._id) }
    }
  };

  // Optional: map colorCode (1–11 in Google Calendar)
  if (appointment.colorCode) {
    event.colorId = mapColorToGoogleColorId(appointment.colorCode);
  }
  return event;
}

// Public helpers used by routes / appointment controller

// Insert event **on the doctor’s calendar** of this appointment
export async function insertEventForAppointment(appointment) {
  const doctorId = appointment.doctor?._id || appointment.doctor;
  if (!doctorId) throw new Error('Appointment has no doctor');

  const oauth2Client = await getAuthedClientForUser(doctorId);
  const event = buildEventFromAppointment(appointment);

  const { data } = await calendar.events.insert({
    auth: oauth2Client,
    calendarId: GOOGLE_CALENDAR_ID,
    resource: event,
  });

  return data; // contains .id
}

export async function updateEventForAppointment(appointment, eventId) {
  const doctorId = appointment.doctor?._id || appointment.doctor;
  const oauth2Client = await getAuthedClientForUser(doctorId);
  const event = buildEventFromAppointment(appointment);

  const { data } = await calendar.events.update({
    auth: oauth2Client,
    calendarId: GOOGLE_CALENDAR_ID,
    eventId,
    resource: event,
  });

  return data;
}

export async function deleteEventById(doctorId, eventId) {
  const oauth2Client = await getAuthedClientForUser(doctorId);
  await calendar.events.delete({
    auth: oauth2Client,
    calendarId: GOOGLE_CALENDAR_ID,
    eventId,
  });
}

export async function storageForUser(user) {
  if (!user?.googleCalendar?.refreshToken) {
    throw new Error('User has not connected Google with Storage scope (missing refreshToken).');
  }
  const oauth2Client = makeOAuthClient();

  // Reuse the same oauth2Client but set THIS user's tokens
  oauth2Client.setCredentials({
    access_token: user.googleCalendar.accessToken,
    refresh_token: user.googleCalendar.refreshToken,
  });

  // Ensure we have a fresh access token
  await oauth2Client.getAccessToken();

  // Return a Storage client that uses this OAuth client (no key.json)
  const storage = new Storage({
    projectId: process.env.GOOGLE_PROJECT_ID, // set this in .env
    authClient: oauth2Client,
  });

  return storage;
}


export function mapColorToGoogleColorId(hex) {
  const h = String(hex).toLowerCase();
  switch (h) {
    case '#4285f4': case '#5484ed': case '#0000ff': case '#1a73e8': return '1';  // Blue
    case '#0b8043': case '#51b749': case '#00ff00': case '#7ae7bf': return '2';  // Green
    case '#8e24aa': case '#a32929': case '#dc2127': case '#ff0000': return '4';  // Red
    case '#f4511e': case '#ff7537': case '#ffad46': case '#ffa500': return '6';  // Orange
    case '#ffff00': case '#fbd75b': case '#ffbc00':                  return '5';  // Yellow
    case '#46bdc6': case '#33b679':                                  return '7';  // Turquoise
    case '#e1e1e1': case '#9e9e9e': case '#616161':                  return '8';  // Gray
    case '#3f51b5': case '#5c6bc0':                                  return '9';  // Bold Blue
    case '#0f9d58':                                                 return '10'; // Bold Green
    case '#d50000': case '#db4437':                                  return '11'; // Bold Red
    default: return '1';
  }
}
