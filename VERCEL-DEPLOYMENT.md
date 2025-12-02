# Vercel Server Deployment Guide

## ✅ Fixed Issues

### 1. Removed Built-in Node.js Modules
- Removed `fs`, `path`, and `url` from dependencies (these are built-in Node.js modules)
- These were causing installation errors on Vercel

### 2. Canvas Package
- Made `canvas` an optional dependency
- Canvas requires native bindings that may not work on Vercel serverless
- If canvas fails, the server will still start but canvas-related features may not work

### 3. Updated Vercel Configuration
- Increased function timeout to 300 seconds (5 minutes)
- Increased memory to 3008 MB
- Set Node.js runtime to 20.x
- Updated build commands to install server dependencies

## 📋 Pre-Deployment Checklist

### Environment Variables (Set in Vercel Dashboard)

**Required:**
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=production
```

**Optional but Recommended:**
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
FRONTEND_URL=https://your-frontend.vercel.app
STRIPE_SECRET_KEY=your_stripe_secret_key
OPENAI_API_KEY=your_openai_key
```

### Vercel Project Settings

1. **Root Directory:** Leave as default (root of repository)
2. **Framework Preset:** Vite
3. **Build Command:** `cd server && npm install && cd .. && npm install && npm run build`
4. **Output Directory:** `dist`
5. **Install Command:** `cd server && npm install && cd .. && npm install`

## 🚀 Deployment Steps

1. **Push to GitHub** (if not already)
   ```bash
   git add .
   git commit -m "Fix Vercel deployment configuration"
   git push
   ```

2. **Connect to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository

3. **Configure Project**
   - Framework: Vite
   - Root Directory: `./` (default)
   - Build Command: Will use vercel.json settings
   - Output Directory: `dist`

4. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all required variables listed above

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

## ⚠️ Known Limitations

### Canvas Package
- The `canvas` package may not work on Vercel serverless functions
- If you see canvas-related errors, the server will still function
- Canvas is only used in `server/routes/formResponses.js` for DOMMatrix
- Consider using a polyfill or alternative if canvas is critical

### File Uploads
- Vercel serverless functions have limited file system access
- Consider using cloud storage (Google Cloud Storage, AWS S3) for file uploads
- The `server/uploads/` directory won't persist between function invocations

### Long-Running Operations
- Maximum function duration: 300 seconds (5 minutes)
- For longer operations, consider:
  - Breaking into smaller functions
  - Using background jobs (Vercel Cron, external job queue)
  - Moving to a different platform (Render, Railway) for long-running tasks

## 🔧 Troubleshooting

### Build Fails
- Check that all dependencies are listed in `server/package.json`
- Verify Node.js version (should be 18+)
- Check build logs in Vercel dashboard

### Function Timeout
- Increase `maxDuration` in `vercel.json`
- Optimize slow operations
- Consider moving to a different platform for long-running tasks

### Canvas Errors
- If canvas fails, it's optional - server will still work
- Consider removing canvas if not needed
- Or use a canvas polyfill for serverless environments

### MongoDB Connection Issues
- Verify `MONGODB_URI` is set correctly
- Check MongoDB Atlas network access (allow all IPs: 0.0.0.0/0)
- Ensure MongoDB connection string is correct

## 📝 Alternative: Deploy Backend Separately

If you encounter issues with Vercel serverless:

1. **Keep Frontend on Vercel** (works great)
2. **Deploy Backend to Render/Railway** (better for long-running servers)
   - See `DEPLOYMENT-GUIDE.md` for Render deployment
   - Backend URL: `https://your-backend.onrender.com`
   - Update `VITE_API_URL` in Vercel to point to Render backend

## ✅ Success Indicators

After deployment, you should see:
- ✅ Build completes successfully
- ✅ API routes accessible at `https://your-app.vercel.app/api/*`
- ✅ Health check works: `https://your-app.vercel.app/api/health`
- ✅ Frontend loads correctly

## 🔗 Useful Links

- [Vercel Serverless Functions Docs](https://vercel.com/docs/functions)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Node.js Runtime](https://vercel.com/docs/functions/runtimes/node-js)

