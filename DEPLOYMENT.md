# Deployment Checklist for Asset Register System

## ✅ Current Status
- **Supabase Configuration**: ✅ Configured
- **Environment Variables**: ✅ Set in `.env.local`
- **Database Tables**: ⚠️ Need to verify tables exist in Supabase

## 📋 Pre-Deployment Checklist

### 1. **Verify Supabase Database Setup**
   - [ ] Log in to your Supabase dashboard: https://cjqbipjyxiryhekilfkt.supabase.co
   - [ ] Go to **SQL Editor**
   - [ ] Run the complete setup script: `scripts/00-complete-database-setup.sql`
   - [ ] Verify all tables are created:
     - `devices`
     - `received_items`
     - `issued_items`
     - `toner_stock`
   - [ ] Check if tables have data (if not, data is in mock mode)

### 2. **Verify Data is Saving to Supabase** (Local Testing)
   - [ ] Add a new device in the application
   - [ ] Check Supabase dashboard → Table Editor → `devices` table
   - [ ] Verify the device appears in the database
   - [ ] Test receiving an item
   - [ ] Verify it appears in `received_items` table
   - [ ] Test issuing an item
   - [ ] Verify it appears in `issued_items` table

### 3. **Environment Variables for Deployment**
   Set these in your deployment platform (Vercel, Netlify, etc.):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://cjqbipjyxiryhekilfkt.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqcWJpcGp5eGlyeWhla2lsZmt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NjU5NDQsImV4cCI6MjA2NTE0MTk0NH0.kR63F-Rj5JF3prILS0_oCIPOQZaBkV6cYlzmW9ye2HM
   ```

### 4. **Deployment Platform Setup**

#### **If deploying to Vercel:**
   ```bash
   # Install Vercel CLI (if not installed)
   npm i -g vercel
   
   # Deploy
   vercel
   
   # Or connect via GitHub and set env vars in Vercel dashboard
   ```

   In Vercel Dashboard:
   - Go to **Settings** → **Environment Variables**
   - Add `NEXT_PUBLIC_SUPABASE_URL`
   - Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Redeploy after adding variables

#### **If deploying to Netlify:**
   ```bash
   # Install Netlify CLI
   npm i -g netlify-cli
   
   # Deploy
   netlify deploy --prod
   ```

   In Netlify Dashboard:
   - Go to **Site Settings** → **Environment Variables**
   - Add both environment variables
   - Redeploy

### 5. **Build and Test Locally**
   ```bash
   # Build the project
   npm run build
   
   # Test the production build locally
   npm start
   ```
   
   - [ ] Verify no build errors
   - [ ] Test all major features:
     - [ ] Dashboard loads
     - [ ] Devices page works
     - [ ] Add/Edit/Delete devices
     - [ ] Receive items
     - [ ] Issue items
     - [ ] Toner stock
     - [ ] Reports

### 6. **Supabase Row Level Security (RLS)**
   - [ ] Verify RLS policies are enabled in Supabase
   - [ ] Check that policies allow:
     - SELECT (read) for all authenticated users
     - INSERT (create) for all authenticated users
     - UPDATE (edit) for all authenticated users
     - DELETE for all authenticated users
   
   **Note**: If you're not using authentication, you may need to disable RLS or make tables public.

### 7. **Post-Deployment Verification**
   After deployment:
   - [ ] Visit the deployed URL
   - [ ] Check browser console for any errors
   - [ ] Test adding a device
   - [ ] Verify data appears in Supabase dashboard
   - [ ] Test all CRUD operations
   - [ ] Check that reports export correctly

## 🔍 How to Check if Data is Saving to Supabase

1. **Via Application**: Look for any "Mock Data" banners or warnings in the UI
2. **Via Browser Console**: 
   - Open DevTools (F12)
   - Check for console warnings about "Supabase environment variables not found"
   - Check Network tab for requests to Supabase API
3. **Via Supabase Dashboard**:
   - Go to Table Editor
   - Check if new data appears after actions in the app

## ⚠️ Important Notes

- **Never commit `.env.local` to Git** - it contains sensitive keys
- The system automatically falls back to mock data if Supabase is not configured
- All CRUD operations (Create, Read, Update, Delete) are implemented for:
  - Devices
  - Received Items
  - Issued Items
  - Toner Stock

## 🚀 Quick Deploy Commands

```bash
# 1. Build
npm run build

# 2. Deploy to Vercel
vercel --prod

# Or deploy to Netlify
netlify deploy --prod
```

## 📞 Troubleshooting

If data is not saving:
1. Check environment variables are set correctly
2. Verify tables exist in Supabase
3. Check RLS policies allow operations
4. Check browser console for errors
5. Verify Supabase URL and key are correct

