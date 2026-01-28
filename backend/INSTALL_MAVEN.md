# Install Maven on Windows - Quick Guide

## Option 1: Install Maven using Chocolatey (Easiest!)

If you have Chocolatey installed:

```powershell
choco install maven
```

If you don't have Chocolatey, install it first:
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

Then install Maven:
```powershell
choco install maven
```

## Option 2: Install Maven using Scoop

If you have Scoop installed:

```powershell
scoop install maven
```

## Option 3: Manual Installation

1. **Download Maven:**
   - Go to: https://maven.apache.org/download.cgi
   - Download: `apache-maven-3.9.5-bin.zip`

2. **Extract:**
   - Extract to: `C:\Program Files\Apache\maven` (or any location)

3. **Add to PATH:**
   ```powershell
   # Run PowerShell as Administrator, then:
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Program Files\Apache\maven\bin", "Machine")
   ```

4. **Verify:**
   ```powershell
   mvn -version
   ```

## Option 4: Use an IDE (No Installation Needed!)

**IntelliJ IDEA or Eclipse:**
- Open the `backend` folder
- Maven is built-in
- Just run `ElegantEventsApplication.java`

**VS Code:**
- Install "Extension Pack for Java"
- Maven support is included

## After Installing Maven

```powershell
cd backend
mvn clean install
mvn spring-boot:run
```










