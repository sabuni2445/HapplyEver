# Quick Setup Guide

This guide will help you set up the complete application with user synchronization from Clerk to MongoDB.

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory with these variables:

```env
# ===== CLERK AUTHENTICATION =====
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# ===== DATABASE =====
# Option 1: Local MongoDB
MONGODB_URI=mongodb://localhost:27017/elegantevents

# Option 2: MongoDB Atlas (Cloud)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/elegantevents?retryWrites=true&w=majority

# ===== SERVER CONFIGURATION =====
PORT=3001
FRONTEND_URL=http://localhost:5173

# ===== API CONFIGURATION (Optional) =====
VITE_API_URL=http://localhost:3001
```

### 3. Get Clerk Keys

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create or select your application
3. Go to **API Keys** → Copy **Publishable Key** → Add to `.env` as `VITE_CLERK_PUBLISHABLE_KEY`
4. Go to **Webhooks** → Create endpoint → Copy **Signing Secret** → Add to `.env` as `CLERK_WEBHOOK_SECRET`

### 4. Set Up MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB locally, then:
# MongoDB will run on mongodb://localhost:27017
MONGODB_URI=mongodb://localhost:27017/elegantevents
```

**Option B: MongoDB Atlas (Recommended)**
1. Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get your connection string
4. Add it to `.env` as `MONGODB_URI`

### 5. Set Up Clerk Webhooks (Optional but Recommended)

**For Local Development:**
```bash
# Install ngrok
npm install -g ngrok

# Start your backend server
npm run server

# In another terminal, expose your server
ngrok http 3001

# Copy the ngrok URL (e.g., https://abc123.ngrok.io)
```

**In Clerk Dashboard:**
1. Go to **Webhooks** → **Add Endpoint**
2. Enter URL: `https://your-ngrok-url.ngrok.io/api/webhooks/clerk`
3. Select events: `user.created`, `user.updated`, `user.deleted`
4. Copy the **Signing Secret** and add to `.env` as `CLERK_WEBHOOK_SECRET`

### 6. Start the Application

**Option A: Run Both Frontend and Backend Together**
```bash
npm run dev:full
```

**Option B: Run Separately (in two terminals)**
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run server
```

### 7. Test the Setup

1. Open `http://localhost:5173` in your browser
2. Click "Get Started" on the splash screen
3. Sign up/Sign in with Clerk
4. Check MongoDB to see if the user was created:
   ```javascript
   // Using MongoDB Compass or MongoDB shell
   db.users.find()
   ```

## How User Sync Works

### Method 1: Automatic (Webhooks) ✅ Recommended

When a user signs up, updates, or deletes their account in Clerk:
- Clerk sends a webhook to `/api/webhooks/clerk`
- Server verifies the webhook signature
- Server automatically creates/updates/deletes the user in MongoDB

**No frontend code needed** - it happens automatically!

### Method 2: Manual (Frontend Sync)

After a user logs in:
- Frontend calls `/api/users/sync` with Clerk user data
- Server checks if user exists
- Creates new user if not exists, updates if exists

This is handled automatically by the `useUserSync` hook in the frontend.

## Troubleshooting

### "Missing publishableKey" Error
- Make sure `VITE_CLERK_PUBLISHABLE_KEY` is in your `.env` file
- Restart the dev server after adding the key

### "Cannot connect to MongoDB" Error
- Check if MongoDB is running (if using local)
- Verify `MONGODB_URI` is correct in `.env`
- Make sure the database name doesn't have special characters

### "Webhook verification failed" Error
- Verify `CLERK_WEBHOOK_SECRET` is correct
- Make sure you're using the correct signing secret from Clerk dashboard
- For local development, use ngrok or similar tool

### Frontend can't connect to backend
- Make sure backend server is running on port 3001
- Check `VITE_API_URL` in `.env` matches your backend URL
- Check CORS settings in `server/index.js`

## Next Steps

1. ✅ Users are automatically synced to MongoDB
2. Create onboarding flow to set user roles
3. Build role-based dashboards
4. Add more features to your wedding management platform!

For more details, see:
- [Main README](./README.md)
- [Server README](./server/README.md)










