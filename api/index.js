// Vercel Serverless Function - Express App Handler
// This file exports the Express app for Vercel's serverless functions

// Set VERCEL environment variable so server knows it's running on Vercel
process.env.VERCEL = '1';

// Import the Express app (it will handle MongoDB connection automatically)
// All routes are already registered in server/index.js
import app from '../server/index.js';

// Export the Express app directly - Vercel supports this format
// The app will handle all incoming requests
export default app;
