# Backend Server Documentation

This backend server handles user synchronization from Clerk to MongoDB.

## Features

- ✅ Automatic user sync via Clerk webhooks
- ✅ Manual user sync via API endpoint
- ✅ User role management
- ✅ Profile updates

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory (same level as `package.json`):

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/elegantevents
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/elegantevents?retryWrites=true&w=majority

# Clerk Configuration
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### 3. Start the Server

```bash
# Run backend only
npm run server

# Run both frontend and backend together
npm run dev:full
```

## API Endpoints

### Health Check
- **GET** `/api/health` - Check if server is running

### User Endpoints

- **GET** `/api/users/clerk/:clerkId` - Get user by Clerk ID
- **GET** `/api/users/:id` - Get user by MongoDB ID
- **POST** `/api/users/sync` - Sync user from Clerk to database
- **PATCH** `/api/users/:clerkId/role` - Update user role
- **PATCH** `/api/users/:clerkId/profile` - Update user profile

### Webhook Endpoints

- **POST** `/api/webhooks/clerk` - Clerk webhook endpoint (handles user.created, user.updated, user.deleted)

## Clerk Webhook Setup

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → Your App → Webhooks
2. Click "Add Endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/webhooks/clerk`
   - For local development, use a tool like [ngrok](https://ngrok.com) or [localtunnel](https://localtunnel.github.io/www/)
4. Subscribe to these events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Copy the **Signing Secret** and add it to your `.env` as `CLERK_WEBHOOK_SECRET`

### Testing Webhooks Locally

```bash
# Install ngrok
npm install -g ngrok

# Start your server
npm run server

# In another terminal, expose your local server
ngrok http 3001

# Use the ngrok URL in Clerk webhook settings
# Example: https://abc123.ngrok.io/api/webhooks/clerk
```

## Database Schema

### User Model

```javascript
{
  clerkId: String (unique, indexed),
  email: String (required),
  firstName: String,
  lastName: String,
  username: String,
  imageUrl: String,
  selectedRole: String (enum: ['admin', 'manager', 'protocol', 'attendee', 'vendor', 'user']),
  profileCompleted: Boolean,
  phoneNumber: String,
  metadata: Object,
  createdAt: Date,
  updatedAt: Date
}
```

## How User Sync Works

### Method 1: Webhooks (Recommended - Automatic)

When a user signs up, updates, or deletes their account in Clerk:
1. Clerk sends a webhook to `/api/webhooks/clerk`
2. Server verifies the webhook signature
3. Server creates/updates/deletes the user in MongoDB automatically

### Method 2: Frontend Sync (Manual)

After a user logs in:
1. Frontend calls `/api/users/sync` with Clerk user data
2. Server checks if user exists in database
3. If not, creates new user; if exists, updates user data

## MongoDB Setup

### Option 1: Local MongoDB

1. Install MongoDB locally
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/elegantevents`

### Option 2: MongoDB Atlas (Cloud)

1. Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env`

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Server Error

Error responses follow this format:
```json
{
  "error": "Error message here"
}
```










