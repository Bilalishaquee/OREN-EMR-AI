import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file in the server directory
dotenv.config({ path: path.resolve(__dirname, './.env') });

// Log email configuration status on server start (for debugging)
console.log('=== SERVER STARTUP - EMAIL CONFIGURATION ===');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM ? 'SET' : 'NOT SET');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'NOT SET');
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET');
console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'SET' : 'NOT SET');
console.log('===========================================');

import reportsRoutes from './routes/reports.js';
console.log('Loaded MONGODB_URI:', process.env.MONGODB_URI);


import express from 'express';
import mongoose from 'mongoose';
import visitRoutes from './routes/visits.js';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { authenticateToken } from './middleware/authMiddleware.js';

// Import routes
import authRoutes from './routes/auth.js';
import authUpdateRoutes from './routes/auth-update.js';
import patientRoutes from './routes/patients.js';
import appointmentRoutes from './routes/appointments.js';
import billingRoutes from './routes/billing.js';
import aiRoutes from './routes/aiRoutes.js';
import notesRoutes from './routes/notes.js';
import googleCalendarRoutes from './routes/googleCalendar.js';
import taskRoutes from './routes/tasks.js';
import notificationRoutes from './routes/notifications.js';
import formTemplateRoutes from './routes/formTemplates.js';
import formResponseRoutes from './routes/formResponses.js';
import intakeFormDataRoutes from './routes/intakeFormData.js';
import stripeRoutes from './routes/stripe.js';
import emailRoutes from './routes/email.js';
import payment from './routes/payments.js'
import Template from './routes/Template.js';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const allowedOrigins = [
  'https://oren-emr-ai-ashen.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      // In production, you might want to log this
      if (process.env.NODE_ENV === 'production') {
        console.log('CORS blocked origin:', origin);
      }
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static('uploads'));

// MongoDB connection check middleware (except for health check)
app.use((req, res, next) => {
  // Allow health check endpoint without MongoDB connection
  if (req.path === '/api/health') {
    return next();
  }

  // Check if MongoDB is connected
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: 'Database connection not available. Please try again in a moment.',
      error: 'DATABASE_NOT_CONNECTED',
      readyState: mongoose.connection.readyState
    });
  }

  next();
});

// Connect to MongoDB
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

// MongoDB connection options
const mongooseOptions = {
  serverSelectionTimeoutMS: 30000, // 30 seconds
  socketTimeoutMS: 45000, // 45 seconds
  connectTimeoutMS: 30000, // 30 seconds
  maxPoolSize: 10,
  minPoolSize: 5,
  retryWrites: true,
  w: 'majority',
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected');
});

// Connect to MongoDB and start server only after connection
async function startServer() {
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials

    await mongoose.connect(process.env.MONGODB_URI, mongooseOptions);
    console.log('✅ Connected to MongoDB successfully');

    // Start server only after MongoDB connection is established
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    console.error('Error details:', {
      name: error.name,
      code: error.code,
      message: error.message
    });

    // Provide helpful troubleshooting tips
    if (error.message.includes('ETIMEOUT') || error.message.includes('queryTxt')) {
      console.error('\n💡 Troubleshooting tips:');
      console.error('1. Check your internet connection');
      console.error('2. Verify MongoDB Atlas IP whitelist includes your IP (0.0.0.0/0 for all)');
      console.error('3. Check if MongoDB Atlas cluster is running');
      console.error('4. Verify MONGODB_URI is correct in .env file');
      console.error('5. Try using a local MongoDB instance for development');
    }

    process.exit(1);
  }
}

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', authUpdateRoutes);
app.use('/api/patients', authenticateToken, patientRoutes);
app.use('/api/appointments', authenticateToken, appointmentRoutes);
app.use('/api/billing', authenticateToken, billingRoutes);
app.use('/api', authenticateToken, aiRoutes);
app.use('/api/notes', authenticateToken, notesRoutes);
// Google Calendar routes - callback is public, others require auth
app.use('/api/google-calendar', googleCalendarRoutes);
app.use('/api/tasks', authenticateToken, taskRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);
app.use('/api/form-templates', authenticateToken, formTemplateRoutes);
app.use('/api/form-responses', authenticateToken, formResponseRoutes);
app.use('/api/intake-form-data', authenticateToken, intakeFormDataRoutes);
app.use('/api/stripe', authenticateToken, stripeRoutes);
app.use('/api/email', authenticateToken, emailRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Server is running' });
});

app.use('/api/reports', authenticateToken, reportsRoutes);
app.use('/api/visits', authenticateToken, visitRoutes);
app.use('/api/payments', authenticateToken, payment)
// PDF Templates route
app.use('/api/templates', Template);
// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// ✅ Start server after MongoDB connection
startServer();