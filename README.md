# ElegantEvents - Wedding Management Platform

A beautiful React application for managing weddings, built with Vite, Clerk authentication, and React Router.

## Features

- ✨ Elegant splash screen with animations
- 🔐 Clerk authentication integration
- 🗄️ Spring Boot + MySQL backend
- 🔄 Automatic user synchronization via webhooks
- 👤 Custom user roles (since Clerk doesn't support roles)
- 🎨 Beautiful, responsive design
- 🚀 Fast development with Vite
- 📱 Mobile-friendly interface

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here

# Backend API URL (Spring Boot default port is 8080)
VITE_API_URL=http://localhost:8080
```

### 3. Set Up Clerk Authentication

1. Create a free account at [Clerk](https://clerk.com)
2. Create a new application in the Clerk dashboard
3. Copy your **Publishable Key** and add it to `.env` as `VITE_CLERK_PUBLISHABLE_KEY`
4. (Optional) Set up webhooks for automatic user sync (see [Spring Boot Setup Guide](./SPRING_BOOT_SETUP.md))

### 4. Set Up Spring Boot Backend

See the [Backend README](./backend/README.md) for detailed setup instructions.

**Quick Setup:**
1. Navigate to the `backend` directory
2. Update `src/main/resources/application.properties` with your MySQL credentials
3. Build and run:
   ```bash
   cd backend
   mvn clean install
   mvn spring-boot:run
   ```

**Key Configuration:**
- MySQL connection in `application.properties`
- Clerk webhook secret for automatic user sync
- Frontend URL for CORS configuration

### 5. Set Up MySQL Database

**Option A: Local MySQL**
- Install MySQL locally
- Create database: `CREATE DATABASE elegantevents;`
- Update credentials in `backend/src/main/resources/application.properties`

**Option B: MySQL on Cloud**
- Use any MySQL hosting service
- Update connection string in `application.properties`

### 6. Start the Application

**Start separately (recommended):**

Terminal 1 - Frontend:
```bash
npm run dev
```

Terminal 2 - Backend (Spring Boot):
```bash
cd backend
mvn spring-boot:run
```

7. Open your browser and navigate to `http://localhost:5173` (frontend)

## Available Scripts

### Frontend
- `npm run dev` - Start the frontend development server (Vite)
- `npm run build` - Build the app for production
- `npm run preview` - Preview the production build locally

### Backend (Spring Boot)
- `cd backend && mvn spring-boot:run` - Start the Spring Boot backend server
- `cd backend && mvn clean install` - Build the backend

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── SplashScreen.jsx      # Main splash screen component
│   │   └── SplashScreen.css      # Splash screen styles
│   ├── pages/
│   │   └── Onboarding.jsx        # Onboarding page
│   ├── hooks/
│   │   └── useUserSync.js        # Hook for syncing users to database
│   ├── utils/
│   │   └── api.js                # API utility functions
│   ├── App.jsx                   # Main App component with routing
│   ├── main.jsx                  # Entry point with Clerk provider
│   ├── index.css                 # Global styles
│   └── App.css                   # App component styles
├── backend/
│   ├── src/main/java/com/elegantevents/
│   │   ├── model/
│   │   │   └── User.java         # User entity (JPA)
│   │   ├── repository/
│   │   │   └── UserRepository.java  # JPA repository
│   │   ├── service/
│   │   │   └── UserService.java  # Business logic
│   │   ├── controller/
│   │   │   ├── UserController.java  # REST API endpoints
│   │   │   └── ClerkWebhookController.java  # Webhook handler
│   │   ├── dto/
│   │   │   ├── UserSyncRequest.java
│   │   │   └── UserResponse.java
│   │   └── ElegantEventsApplication.java
│   ├── src/main/resources/
│   │   └── application.properties  # Spring Boot configuration
│   └── pom.xml                    # Maven dependencies
└── package.json
```

## Technologies Used

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Clerk** - Authentication
- **React Router** - Routing
- **Lucide React** - Icons
- **Axios** - HTTP client
- **Google Fonts** - Typography (Playfair Display, Cormorant Garamond)

### Backend
- **Spring Boot 3.2** - Java web framework
- **MySQL** - Relational database
- **Spring Data JPA** - Data persistence
- **Svix** - Webhook verification for Clerk
- **Lombok** - Java boilerplate reduction

## User Sync Methods

### Method 1: Webhooks (Recommended - Automatic)
- Set up Clerk webhooks to automatically sync users when they sign up, update, or delete their account
- See [Server README](server/README.md) for webhook setup instructions

### Method 2: Frontend Sync (Manual)
- Users are automatically synced to the database after login via the `useUserSync` hook
- This happens on the splash screen and onboarding pages

## Notes

- The splash screen automatically redirects signed-in users based on their role
- User roles are stored in both MongoDB and localStorage
- After sign-in, users are redirected to the onboarding page
- Users are automatically synced to MongoDB when they log in

## Documentation

- [Frontend Documentation](./README.md) - This file
- [Spring Boot Setup Guide](./SPRING_BOOT_SETUP.md) - Complete Spring Boot setup guide
- [Backend README](./backend/README.md) - Backend API documentation and details

