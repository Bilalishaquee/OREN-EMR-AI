# Google Calendar Integration for OrenEMR

This document provides instructions for setting up and using the Google Calendar integration with OrenEMR.

## Setup Instructions

### 1. Create Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API for your project
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application" as the application type
   - Add authorized redirect URIs: `http://localhost:5000/api/google-calendar/callback`
   - Click "Create"
5. Note your Client ID and Client Secret

### 2. Configure Environment Variables

1. Open the `.env` file in the server directory
2. Update the following variables with your Google Cloud credentials:
   ```
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GOOGLE_REDIRECT_URL=http://localhost:5000/api/google-calendar/callback
   ```

### 3. Install Dependencies

In the server directory, run:
```
npm install googleapis
```

## Usage Instructions

### Connecting to Google Calendar

1. Log in to OrenEMR
2. Navigate to Settings > Calendar
3. Click "Connect Google Calendar"
4. Follow the Google authentication flow
5. Grant permission to access your calendar

### Syncing Appointments

1. After connecting your Google Calendar, you can:
   - Sync all appointments at once by clicking "Sync All Appointments"
   - New appointments will automatically sync to Google Calendar
   - Updates to appointments will be reflected in Google Calendar

### Color Coding

Appointments are color-coded in Google Calendar based on the color code assigned to each patient in OrenEMR. This helps you visually identify appointments for specific patients.

## Troubleshooting

- **Authentication Issues**: If you encounter authentication problems, try reconnecting your Google Calendar in the Settings page.
- **Sync Failures**: Check the server logs for detailed error messages if appointments fail to sync.
- **Missing Appointments**: Ensure that appointments have all required fields (patient, doctor, date, time) before syncing.

## Security Notes

- Your Google Calendar access tokens are securely stored in the database.
- The application only requests the minimum permissions needed to manage calendar events.
- You can revoke access at any time through your Google Account settings or by disconnecting in the OrenEMR Settings page.