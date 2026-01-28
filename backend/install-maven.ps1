# PowerShell script to install Maven on Windows

Write-Host "Installing Maven..." -ForegroundColor Green

# Check if Chocolatey is installed
$chocoInstalled = Get-Command choco -ErrorAction SilentlyContinue

if ($chocoInstalled) {
    Write-Host "Chocolatey found. Installing Maven via Chocolatey..." -ForegroundColor Yellow
    choco install maven -y
    Write-Host "Maven installed! Please restart your terminal." -ForegroundColor Green
    Write-Host "Then run: mvn -version" -ForegroundColor Cyan
} else {
    Write-Host "Chocolatey not found. Manual installation required." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please follow these steps:" -ForegroundColor Cyan
    Write-Host "1. Download Maven from: https://maven.apache.org/download.cgi" -ForegroundColor White
    Write-Host "2. Extract to C:\Program Files\Apache\maven" -ForegroundColor White
    Write-Host "3. Add C:\Program Files\Apache\maven\bin to your PATH" -ForegroundColor White
    Write-Host ""
    Write-Host "Or install Chocolatey first:" -ForegroundColor Yellow
    Write-Host "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Then run this script again." -ForegroundColor White
}










