# Vercel Deployment Guide

This guide will help you deploy Drive Smart to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Vercel CLI installed (optional, for CLI deployment)
3. Your Neon DB credentials (already in README)

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import project to Vercel**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect the configuration

3. **Configure Environment Variables**
   In Vercel dashboard, go to Settings → Environment Variables and add:
   ```
   DATABASE_URL=postgresql://neondb_owner:npg_MlisGo3pyIc1@ep-delicate-river-aha074dk-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   NODE_ENV=production
   JWT_SECRET=b8542b31e6fb8ff70632567cefda43eaf06970b67f9b564abfefbc28efcc63aff5aba84c72989a512e7c074a95c2325cd0471c9b22cccbe1bfe6693bbb5884e8
   PORT=5000
   FRONTEND_URL=https://your-project-name.vercel.app
   ```

4. **Configure Build Settings**
   - Root Directory: Leave as default (root)
   - Build Command: Leave empty (Vercel will auto-detect)
   - Output Directory: Leave empty
   - Install Command: `npm install` (runs automatically)

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your app will be live at `https://your-project-name.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add DATABASE_URL
   vercel env add NODE_ENV
   vercel env add JWT_SECRET
   vercel env add PORT
   vercel env add FRONTEND_URL
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Post-Deployment Configuration

### Update Client API Endpoint

After deployment, you need to update the API endpoint in your client files:

1. **Update `client/auth.js`** (if it has hardcoded localhost):
   ```javascript
   const API_BASE = process.env.VERCEL_URL 
     ? `https://${process.env.VERCEL_URL}` 
     : 'http://localhost:5000';
   ```

2. **Or use environment variable**:
   Create a `.env.local` file in the client directory (for local development):
   ```
   VITE_API_BASE=http://localhost:5000
   ```

### Update CORS Settings

The server already handles CORS, but make sure `FRONTEND_URL` in Vercel environment variables matches your Vercel deployment URL.

## Important Notes

1. **File Size Limits**: Vercel has limits on serverless function size. Your 3D models in `assets/` might be large. Consider:
   - Using Vercel Blob Storage for large assets
   - Or using a CDN for 3D models

2. **Serverless Function Timeout**: Vercel serverless functions have a 10-second timeout on the free plan. If your database queries are slow, consider optimizing them.

3. **Database Connection**: Make sure your Neon DB allows connections from Vercel's IP addresses (usually enabled by default with SSL).

4. **Static Files**: The `vercel.json` configuration serves static files from `client/` and `assets/` directories.

## Troubleshooting

- **Build fails**: Check that all dependencies are in `package.json` in the root or server directory
- **API routes not working**: Verify `vercel.json` routes configuration
- **Database connection errors**: Check that `DATABASE_URL` is correctly set in Vercel environment variables
- **CORS errors**: Update `FRONTEND_URL` environment variable to match your Vercel deployment URL

## Testing the Deployment

1. Visit your Vercel URL
2. Test registration: `/register.html`
3. Test login: `/index.html`
4. Test game: `/game3d.html` (requires login)

