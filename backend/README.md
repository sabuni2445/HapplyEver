# ElegantEvents Spring Boot Backend

Spring Boot backend with MySQL integration for saving Clerk user data.

## Prerequisites

- Java 17 or higher
- Maven 3.6+
- MySQL 8.0+
- Clerk account (for authentication)

## Setup

### 1. Database Setup

Create MySQL database:

```sql
CREATE DATABASE elegantevents CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Or let Spring Boot create it automatically (if `createDatabaseIfNotExist=true` is set).

### 2. Configuration

Update `src/main/resources/application.properties`:

```properties
# Update MySQL credentials
spring.datasource.username=your_mysql_username
spring.datasource.password=your_mysql_password

# Add Clerk webhook secret
clerk.webhook.secret=whsec_your_webhook_secret_here

# Set frontend URL if different
app.frontend.url=http://localhost:5173
```

### 3. Build and Run

```bash
# Build the project
mvn clean install

# Run the application
mvn spring-boot:run

# Or using the packaged JAR
java -jar target/elegantevents-backend-1.0.0.jar
```

The server will start on `http://localhost:8080`

## API Endpoints

### User Endpoints

- **POST** `/api/users/sync` - Sync user from Clerk to database
  ```json
  {
    "clerkId": "user_xxx",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "imageUrl": "https://..."
  }
  ```

- **GET** `/api/users/clerk/{clerkId}` - Get user by Clerk ID

- **GET** `/api/users/{id}` - Get user by database ID

- **PATCH** `/api/users/{clerkId}/role` - Update user role
  ```json
  {
    "selectedRole": "admin"  // Options: admin, manager, protocol, attendee, vendor, user
  }
  ```

- **PATCH** `/api/users/{clerkId}/profile` - Update user profile
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1234567890",
    "imageUrl": "https://..."
  }
  ```

- **GET** `/api/users/health` - Health check

### Webhook Endpoints

- **POST** `/api/webhooks/clerk` - Clerk webhook endpoint
  - Handles: `user.created`, `user.updated`, `user.deleted`

## User Roles

The `selectedRole` field supports these values:
- `ADMIN` - Administrator
- `MANAGER` - Manager
- `PROTOCOL` - Protocol officer
- `ATTENDEE` - Attendee
- `VENDOR` - Vendor
- `USER` - Couple/Regular user

## Clerk Webhook Setup

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → Your App → Webhooks
2. Click "Add Endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/webhooks/clerk`
   - For local development, use [ngrok](https://ngrok.com) or similar
4. Subscribe to events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Copy the **Signing Secret** and add to `application.properties` as `clerk.webhook.secret`

### Testing Webhooks Locally

```bash
# Install ngrok
npm install -g ngrok

# Expose your Spring Boot server
ngrok http 8080

# Use the ngrok URL in Clerk webhook settings
# Example: https://abc123.ngrok.io/api/webhooks/clerk
```

## Database Schema

The `users` table will be automatically created with these columns:

```sql
- id (BIGINT, PRIMARY KEY, AUTO_INCREMENT)
- clerk_id (VARCHAR, UNIQUE, NOT NULL)
- email (VARCHAR, UNIQUE, NOT NULL)
- first_name (VARCHAR)
- last_name (VARCHAR)
- username (VARCHAR)
- image_url (VARCHAR)
- phone_number (VARCHAR)
- selected_role (ENUM: ADMIN, MANAGER, PROTOCOL, ATTENDEE, VENDOR, USER)
- profile_completed (BOOLEAN, DEFAULT FALSE)
- created_at (DATETIME, NOT NULL)
- updated_at (DATETIME, NOT NULL)
```

## Development

### Running Tests

```bash
mvn test
```

### Building for Production

```bash
mvn clean package -Pprod
```

## Environment Variables

You can also use environment variables instead of `application.properties`:

```bash
export SPRING_DATASOURCE_USERNAME=root
export SPRING_DATASOURCE_PASSWORD=password
export CLERK_WEBHOOK_SECRET=whsec_xxx
export FRONTEND_URL=http://localhost:5173
```

## Troubleshooting

### "Cannot connect to MySQL" Error
- Check if MySQL is running
- Verify credentials in `application.properties`
- Ensure database exists or `createDatabaseIfNotExist=true`

### "CORS error" in Frontend
- Update `app.frontend.url` in `application.properties`
- Check `WebConfig.java` for CORS settings

### "Webhook verification failed"
- Verify `clerk.webhook.secret` is correct
- Make sure you're using the signing secret from Clerk dashboard
- For local testing, use ngrok or similar tunnel service










