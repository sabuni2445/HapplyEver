# Spring Boot + MySQL Setup Guide

This guide will help you set up the Spring Boot backend with MySQL to save Clerk users to your database with custom roles.

## Quick Start

### 1. Prerequisites

- Java 17 or higher
- Maven 3.6+
- MySQL 8.0+ installed and running
- Clerk account

### 2. Database Setup

**Create MySQL Database:**

```sql
CREATE DATABASE elegantevents CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Or let Spring Boot create it automatically (configured in `application.properties`).

### 3. Configure Application

Edit `backend/src/main/resources/application.properties`:

```properties
# Update these with your MySQL credentials
spring.datasource.username=root
spring.datasource.password=your_mysql_password

# Add your Clerk webhook secret (get from Clerk Dashboard)
clerk.webhook.secret=whsec_your_webhook_secret_here

# Frontend URL (for CORS)
app.frontend.url=http://localhost:5173
```

### 4. Build and Run

```bash
# Navigate to backend directory
cd backend

# Build the project
mvn clean install

# Run the application
mvn spring-boot:run
```

The server will start on `http://localhost:8080`

### 5. Verify It's Working

Test the health endpoint:
```bash
curl http://localhost:8080/api/users/health
```

Should return: `{"status":"OK","message":"User service is running"}`

## User Roles

Since Clerk doesn't support roles natively, we store them in MySQL:

- `ADMIN` - Administrator
- `MANAGER` - Manager  
- `PROTOCOL` - Protocol officer
- `ATTENDEE` - Attendee
- `VENDOR` - Vendor
- `USER` - Couple/Regular user (default)

## How User Sync Works

### Method 1: Webhooks (Automatic - Recommended)

1. Set up webhook in Clerk Dashboard:
   - URL: `https://yourdomain.com/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`
   - Copy the signing secret to `application.properties`

2. When a user signs up in Clerk:
   - Clerk sends webhook → Spring Boot receives it
   - Verifies webhook signature
   - Saves user to MySQL automatically
   - **No frontend code needed!**

### Method 2: Frontend Sync (Manual Fallback)

After user logs in:
- Frontend calls `/api/users/sync`
- Spring Boot checks if user exists
- Creates or updates user in MySQL

This is already handled by the `useUserSync` hook in the React frontend.

## API Endpoints

### Sync User
```bash
POST /api/users/sync
Content-Type: application/json

{
  "clerkId": "user_xxx",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "imageUrl": "https://..."
}
```

### Get User by Clerk ID
```bash
GET /api/users/clerk/{clerkId}
```

### Update User Role
```bash
PATCH /api/users/{clerkId}/role
Content-Type: application/json

{
  "selectedRole": "admin"
}
```

### Update User Profile
```bash
PATCH /api/users/{clerkId}/profile
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890"
}
```

## Database Schema

Spring Boot will automatically create this table:

```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    clerk_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    username VARCHAR(255),
    image_url VARCHAR(500),
    phone_number VARCHAR(50),
    selected_role ENUM('ADMIN', 'MANAGER', 'PROTOCOL', 'ATTENDEE', 'VENDOR', 'USER'),
    profile_completed BOOLEAN DEFAULT FALSE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);
```

## Testing Locally with Webhooks

Since Clerk webhooks need a public URL, use ngrok for local testing:

```bash
# Install ngrok
npm install -g ngrok

# Start Spring Boot first
cd backend
mvn spring-boot:run

# In another terminal, expose port 8080
ngrok http 8080

# Use the ngrok URL (e.g., https://abc123.ngrok.io) in Clerk webhook settings
# URL: https://abc123.ngrok.io/api/webhooks/clerk
```

## Troubleshooting

### "Cannot connect to MySQL"
- Check if MySQL is running: `mysql -u root -p`
- Verify credentials in `application.properties`
- Ensure database exists or `createDatabaseIfNotExist=true` is set

### "CORS error" in frontend
- Update `app.frontend.url` in `application.properties`
- Check `WebConfig.java` CORS settings
- Ensure frontend is running on the configured URL

### "Webhook verification failed"
- Verify `clerk.webhook.secret` is correct in `application.properties`
- Make sure you copied the signing secret (not publishable key) from Clerk
- For local testing, restart ngrok and update webhook URL in Clerk

### "User not found" errors
- Check if user exists in MySQL: `SELECT * FROM users;`
- Verify Clerk ID is correct
- Check application logs for errors

## Production Deployment

1. Update `application.properties` with production MySQL credentials
2. Set `spring.jpa.hibernate.ddl-auto=validate` (don't auto-create tables in prod)
3. Set up proper MySQL database with backups
4. Configure webhook URL to your production domain
5. Use environment variables for sensitive data:
   ```bash
   export SPRING_DATASOURCE_PASSWORD=your_prod_password
   export CLERK_WEBHOOK_SECRET=your_prod_secret
   ```

## Next Steps

1. ✅ Users are automatically synced from Clerk to MySQL
2. ✅ Roles are stored in database (not in Clerk)
3. Build onboarding flow to assign roles
4. Create role-based access control (RBAC)
5. Add more custom fields as needed

For more details, see [Backend README](./backend/README.md)










