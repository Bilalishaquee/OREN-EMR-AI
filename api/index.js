// Vercel Serverless Function - Express App Handler
// This file exports a handler function for Vercel's serverless functions

// Set VERCEL environment variable so server knows it's running on Vercel
process.env.VERCEL = '1';

// Import the Express app (it will handle MongoDB connection automatically)
// All routes are already registered in server/index.js
import app from '../server/index.js';

// Vercel serverless function handler
// Express app can be used directly as a handler
export default app;
