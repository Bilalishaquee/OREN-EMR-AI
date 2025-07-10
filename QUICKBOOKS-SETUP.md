# QuickBooks Integration Setup Guide

This guide will help you set up the QuickBooks integration with email functionality for the OrenEMR billing system.

## 🚀 Quick Start

### 1. Environment Variables Setup

Create a `.env` file in the `server` directory with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/orenemr

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# Server Configuration
PORT=5001

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# QuickBooks API Configuration
QUICKBOOKS_CLIENT_ID=your_quickbooks_client_id
QUICKBOOKS_CLIENT_SECRET=your_quickbooks_client_secret
QUICKBOOKS_REALM_ID=your_quickbooks_realm_id
QUICKBOOKS_REFRESH_TOKEN=your_quickbooks_refresh_token

# Frontend URL (for payment links)
FRONTEND_URL=http://localhost:5173
```

### 2. QuickBooks API Setup

#### Step 1: Create QuickBooks Developer Account
1. Go to [QuickBooks Developer](https://developer.intuit.com/)
2. Sign up for a developer account
3. Create a new app

#### Step 2: Configure Your App
1. In your QuickBooks app dashboard:
   - Set the app type to "Web Application"
   - Add redirect URLs: `http://localhost:5001/api/quickbooks/callback`
   - Enable the following APIs:
     - QuickBooks API
     - Payments API

#### Step 3: Get Your Credentials
1. Note your **Client ID** and **Client Secret**
2. Get your **Realm ID** (Company ID) from your QuickBooks account
3. Add these to your `.env` file

### 3. Email Setup (Gmail)

#### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Enable 2-Factor Authentication

#### Step 2: Generate App Password
1. Go to Google Account → Security → App passwords
2. Generate a new app password for "Mail"
3. Use this password in your `.env` file (not your regular Gmail password)

### 4. Install Dependencies

Make sure you have the required packages installed:

```bash
cd server
npm install nodemailer axios
```

## 📧 How to Use the Email Integration

### Sending Invoice Emails

1. **From Invoice Form:**
   - Edit an existing invoice
   - Click the "Send Invoice" button (green button)
   - Enter recipient email address
   - Choose "Send Invoice" or "Send Reminder"

2. **From Invoice Details:**
   - View an invoice
   - Click "Send Invoice" button
   - Enter recipient email address
   - Choose action

3. **From Billing List:**
   - Click the Send icon (📧) next to any invoice
   - Enter recipient email address
   - Choose action

### Email Features

- **Professional HTML templates** with your clinic branding
- **QuickBooks payment links** for secure online payments
- **Payment reminders** for overdue invoices
- **PDF attachments** (invoice copies)
- **Responsive design** for mobile devices

## 🔧 API Endpoints

### QuickBooks Integration
- `POST /api/quickbooks/create-invoice/:invoiceId` - Create invoice in QuickBooks
- `POST /api/quickbooks/send-invoice-email/:invoiceId` - Send invoice email
- `POST /api/quickbooks/send-reminder/:invoiceId` - Send payment reminder
- `GET /api/quickbooks/invoice-status/:invoiceId` - Get invoice status

### General Email
- `POST /api/email/send` - Send custom emails

## 🧪 Testing the Integration

### 1. Test Configuration Status
```bash
curl -X GET http://localhost:5001/api/quickbooks/test-connection \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

This will show you the status of both QuickBooks and email configurations.

### 2. Test Email Configuration
```bash
curl -X POST http://localhost:5001/api/email/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "text": "This is a test email from OrenEMR"
  }'
```

### 3. Test QuickBooks Integration
1. Create an invoice in the system
2. Use the "Send Invoice" button
3. Check the recipient's email
4. Verify the payment link works

### 4. QuickBooks OAuth Setup
To get your refresh token:

1. **Get Authorization URL:**
   ```bash
   https://appcenter.intuit.com/connect/oauth2?client_id=YOUR_CLIENT_ID&response_type=code&scope=com.intuit.quickbooks.accounting&redirect_uri=YOUR_REDIRECT_URI&state=test
   ```

2. **Exchange Code for Tokens:**
   ```bash
   curl -X POST https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -H "Authorization: Basic BASE64_ENCODED_CREDENTIALS" \
     -d "grant_type=authorization_code&code=AUTHORIZATION_CODE&redirect_uri=YOUR_REDIRECT_URI"
   ```

3. **Save the refresh_token** to your `.env` file

## 🔒 Security Notes

- **Never commit your `.env` file** to version control
- **Use app passwords** for Gmail, not your regular password
- **Keep your QuickBooks credentials secure**
- **Use HTTPS in production** for all API calls

## 🐛 Troubleshooting

### Common Issues

1. **Email not sending:**
   - Check your Gmail app password
   - Verify 2-Factor Authentication is enabled
   - Check server logs for error messages

2. **QuickBooks errors:**
   - Verify your Client ID and Secret
   - Check your Realm ID
   - Ensure your app is properly configured

3. **Payment links not working:**
   - Verify your QuickBooks app has Payments API enabled
   - Check your redirect URLs configuration

### Debug Mode

Enable debug logging by adding to your `.env`:
```env
DEBUG=true
```

## 📞 Support

If you encounter issues:
1. Check the server logs for error messages
2. Verify all environment variables are set correctly
3. Test the email and QuickBooks APIs separately
4. Contact support with specific error messages

## 🚀 Production Deployment

For production deployment:
1. Use production QuickBooks URLs (not sandbox)
2. Set up proper SSL certificates
3. Use environment-specific configuration
4. Set up monitoring and logging
5. Configure backup and recovery procedures 