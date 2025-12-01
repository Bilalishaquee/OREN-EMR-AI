# Deployment Guide: Vercel (Frontend) + Render (Backend)

Complete step-by-step guide to deploy OrenEMR to production.

---

## 📋 Prerequisites

- [ ] GitHub account with repository pushed
- [ ] Vercel account (sign up at [vercel.com](https://vercel.com))
- [ ] Render account (sign up at [render.com](https://render.com))
- [ ] MongoDB Atlas account (sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas))

---

## Part 1: MongoDB Atlas Setup

### Step 1.1: Create Cluster
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Click "Build a Database" → Choose **Free (M0)** tier
4. Select cloud provider and region (choose closest to your users)
5. Click "Create" (takes 3-5 minutes)

### Step 1.2: Database Access
1. Go to **Database Access** → **Add New Database User**
2. Choose **Password** authentication
3. Set username and password (save password securely!)
4. Set user privileges: **Read and write to any database**
5. Click "Add User"

### Step 1.3: Network Access
1. Go to **Network Access** → **Add IP Address**
2. Click "Allow Access from Anywhere" (adds `0.0.0.0/0`)
   - **Note**: For production, restrict to Render's IPs later
3. Click "Confirm"

### Step 1.4: Get Connection String
1. Click **"Connect"** on your cluster
2. Choose **"Connect your application"**
3. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/
   ```
4. Replace `<username>` and `<password>` with your database user credentials
5. Add database name at the end:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/orenemr
   ```
6. **Save this connection string** - you'll need it for Render

---

## Part 2: Deploy Backend to Render

### Step 2.1: Create Web Service
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select your repository
5. Click **"Connect"**

### Step 2.2: Configure Service Settings

**Basic Settings:**
- **Name**: `orenemr-backend` (or your preferred name)
- **Region**: Choose closest to your users (e.g., `Oregon (US West)`)
- **Branch**: `main` (or your default branch)
- **Root Directory**: `server` ⚠️ **Important!**
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Step 2.3: Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add these:

```env
# Server Configuration
NODE_ENV=production
PORT=10000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/orenemr

# Authentication
JWT_SECRET=your_very_secure_random_string_here_min_32_chars

# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key-here

# Frontend URL (update after deploying frontend)
FRONTEND_URL=https://your-app-name.vercel.app

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password

# Google Calendar API
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URL=https://your-backend-name.onrender.com/api/google-calendar/callback

# Stripe
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key

# SendGrid (optional, if using SendGrid instead of Gmail)
SENDGRID_API_KEY=your_sendgrid_api_key
```

**Important Notes:**
- Replace all placeholder values with your actual credentials
- For `FRONTEND_URL`, use your Vercel URL (you'll update this after deploying frontend)
- For `GOOGLE_REDIRECT_URL`, use your Render backend URL
- Generate a secure `JWT_SECRET` (at least 32 characters)

### Step 2.4: Deploy
1. Scroll down and click **"Create Web Service"**
2. Render will start building and deploying
3. Wait for deployment to complete (5-10 minutes)
4. Once deployed, copy your service URL: `https://your-backend-name.onrender.com`

### Step 2.5: Test Backend
1. Visit: `https://your-backend-name.onrender.com/api/health`
2. You should see: `{"status":"Server is running"}`
3. If you see an error, check the **Logs** tab in Render dashboard

---

## Part 3: Deploy Frontend to Vercel

### Step 3.1: Import Project
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Select the repository

### Step 3.2: Configure Project

**Framework Preset:**
- Select **"Vite"** from the dropdown

**Project Settings:**
- **Root Directory**: `./` (leave as default)
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `dist` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

### Step 3.3: Environment Variables

Click **"Environment Variables"** and add:

```env
VITE_API_URL=https://your-backend-name.onrender.com
```

**Important:** Replace `your-backend-name` with your actual Render backend URL.

### Step 3.4: Deploy
1. Click **"Deploy"**
2. Wait for build to complete (2-5 minutes)
3. Once deployed, copy your deployment URL: `https://your-app-name.vercel.app`

### Step 3.5: Update Backend CORS
1. Go back to **Render Dashboard**
2. Navigate to your backend service
3. Go to **"Environment"** tab
4. Update `FRONTEND_URL` environment variable:
   ```
   FRONTEND_URL=https://your-app-name.vercel.app
   ```
5. Render will automatically redeploy with the new environment variable

---

## Part 4: Update Third-Party Services

### Step 4.1: Google Calendar Redirect URL
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:
   ```
   https://your-backend-name.onrender.com/api/google-calendar/callback
   ```
5. Click **"Save"**

---

## Part 5: File Uploads Configuration

### Current Setup
The application currently stores uploaded files in the `server/uploads` directory. On Render, this uses ephemeral storage, which means files will be lost when the service restarts.

### Recommended: Use Cloud Storage

For production, consider migrating to:
- **Google Cloud Storage** (already partially integrated)
- **AWS S3**
- **Cloudinary**

For now, files will work but may be lost on service restarts. This is acceptable for development but should be addressed for production.

---

## Part 6: Testing Deployment

### Test Checklist

1. **Backend Health Check**
   - [ ] Visit `https://your-backend.onrender.com/api/health`
   - [ ] Should return `{"status":"Server is running"}`

2. **Frontend Access**
   - [ ] Visit your Vercel URL
   - [ ] Should load the login page

3. **Authentication**
   - [ ] Register a new user or login
   - [ ] Should redirect to dashboard

4. **API Connection**
   - [ ] Check browser console for errors
   - [ ] Try creating a patient
   - [ ] Try generating an AI note

5. **CORS**
   - [ ] No CORS errors in browser console
   - [ ] API requests work from frontend

---

## Part 7: Troubleshooting

### Backend Issues

**Error: Cannot find module**
- **Solution**: Ensure all dependencies are in `server/package.json`
- Check Render build logs for missing packages

**Error: MongoDB connection failed**
- **Solution**: 
  - Verify `MONGODB_URI` is correct
  - Check MongoDB Atlas Network Access allows all IPs
  - Ensure database user has correct permissions

**Error: Port already in use**
- **Solution**: Render automatically sets PORT, ensure you're using `process.env.PORT` in code

**Build fails**
- **Solution**: 
  - Check Render logs for specific error
  - Verify `Root Directory` is set to `server`
  - Ensure `package.json` exists in server directory

### Frontend Issues

**Error: API connection failed**
- **Solution**: 
  - Verify `VITE_API_URL` is set correctly in Vercel
  - Check backend is running and accessible
  - Verify CORS is configured correctly

**Build fails**
- **Solution**: 
  - Check Vercel build logs
  - Verify all dependencies are in root `package.json`
  - Check for TypeScript errors

**CORS errors**
- **Solution**: 
  - Verify `FRONTEND_URL` in Render matches Vercel URL exactly
  - Check backend CORS configuration
  - Ensure no trailing slashes in URLs

### Database Issues

**Connection timeout**
- **Solution**: 
  - Check MongoDB Atlas Network Access
  - Verify connection string is correct
  - Check if database user exists

**Authentication failed**
- **Solution**: 
  - Verify username and password in connection string
  - Check database user permissions

---

## Part 8: Environment Variables Reference

### Backend (Render) - Required

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `10000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://app.vercel.app` |

### Backend (Render) - Optional

| Variable | Description |
|----------|-------------|
| `EMAIL_USER` | Gmail address |
| `EMAIL_PASSWORD` | Gmail app password |
| `SENDGRID_API_KEY` | SendGrid API key |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret |
| `GOOGLE_REDIRECT_URL` | Google OAuth redirect |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |

### Frontend (Vercel) - Required

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://backend.onrender.com` |

---

## Part 9: Custom Domains (Optional)

### Vercel Custom Domain
1. Go to Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Add your domain (e.g., `app.yourdomain.com`)
3. Follow DNS configuration instructions
4. Update `FRONTEND_URL` in Render with new domain

### Render Custom Domain
1. Go to Render Dashboard → Your Service → **Settings** → **Custom Domains**
2. Add your domain (e.g., `api.yourdomain.com`)
3. Update DNS records as instructed
4. Update `VITE_API_URL` in Vercel with new domain

---

## Part 10: Monitoring & Maintenance

### Render Monitoring
- Check **Logs** tab regularly for errors
- Monitor **Metrics** for performance
- Set up **Alerts** for service downtime

### Vercel Monitoring
- Check **Deployments** for build status
- Monitor **Analytics** for usage
- Review **Logs** for runtime errors

### Database Monitoring
- Monitor MongoDB Atlas **Metrics**
- Set up **Alerts** for connection issues
- Regular backups (MongoDB Atlas handles this automatically)

---

## Quick Reference

### URLs After Deployment
- **Frontend**: `https://your-app-name.vercel.app`
- **Backend**: `https://your-backend-name.onrender.com`
- **Health Check**: `https://your-backend-name.onrender.com/api/health`

### Important Files
- `server/package.json` - Backend dependencies
- `server/index.js` - Backend entry point
- `vite.config.ts` - Frontend build config
- `.env` files - Environment variables (not committed to git)

### Common Commands
```bash
# Test backend locally
cd server
npm install
npm start

# Test frontend locally
npm install
npm run dev

# Build frontend
npm run build
```

---

## Support

If you encounter issues:
1. Check the **Logs** in Render/Vercel dashboards
2. Verify all environment variables are set correctly
3. Test backend health endpoint
4. Check browser console for frontend errors
5. Verify MongoDB connection
6. Review CORS configuration

---

**Last Updated**: Based on current codebase structure
**Version**: 1.0.0

