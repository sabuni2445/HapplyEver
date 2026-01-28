# Quick Start Guide - Spring Boot Backend

## Option 1: Using Maven Wrapper (No Maven Installation Needed!)

The project includes a Maven Wrapper, so you don't need to install Maven separately.

### Prerequisites
- Java 17 or higher installed
- MySQL installed and running

### Steps

1. **Check Java is installed:**
   ```powershell
   java -version
   ```
   Should show Java 17 or higher.

2. **Navigate to backend directory:**
   ```powershell
   cd backend
   ```

3. **Build the project using Maven Wrapper:**
   ```powershell
   .\mvnw.cmd clean install
   ```

4. **Run the application:**
   ```powershell
   .\mvnw.cmd spring-boot:run
   ```

The server will start on `http://localhost:8080`

---

## Option 2: Install Maven (If you prefer using `mvn` command)

### Install Maven on Windows

1. **Download Maven:**
   - Go to https://maven.apache.org/download.cgi
   - Download `apache-maven-3.9.5-bin.zip`

2. **Extract and Setup:**
   - Extract to `C:\Program Files\Apache\maven` (or any location)
   - Add to PATH:
     - Open System Properties → Environment Variables
     - Add `C:\Program Files\Apache\maven\bin` to PATH

3. **Verify Installation:**
   ```powershell
   mvn -version
   ```

4. **Then use:**
   ```powershell
   cd backend
   mvn clean install
   mvn spring-boot:run
   ```

---

## Option 3: Use an IDE (Easiest!)

### IntelliJ IDEA or Eclipse

1. **Open the `backend` folder as a Maven project**
2. **Wait for Maven to download dependencies** (automatic)
3. **Run `ElegantEventsApplication.java`** (right-click → Run)

Most IDEs have Maven built-in, so no installation needed!

---

## Configure MySQL

Before running, make sure to:

1. **Start MySQL service:**
   ```powershell
   # If MySQL is installed as a service, it should be running
   # Check with: Get-Service MySQL*
   ```

2. **Update `application.properties`:**
   - Open `backend/src/main/resources/application.properties`
   - Set your MySQL password:
     ```properties
     spring.datasource.password=your_mysql_password
     ```

3. **Create database (optional - Spring Boot can create it):**
   ```sql
   CREATE DATABASE elegantevents;
   ```

---

## Troubleshooting

### "JAVA_HOME not found"
- Install Java 17+ from https://adoptium.net/
- Set JAVA_HOME environment variable to Java installation path

### "Cannot connect to MySQL"
- Make sure MySQL is running
- Check username/password in `application.properties`
- Verify MySQL is on port 3306

### "Port 8080 already in use"
- Change port in `application.properties`: `server.port=8081`
- Or stop the application using port 8080

---

## Test the Backend

Once running, test the health endpoint:

```powershell
curl http://localhost:8080/api/users/health
```

Or open in browser: http://localhost:8080/api/users/health

You should see: `{"status":"OK","message":"User service is running"}`










