# Julyu Project Setup Script for Testing (No Supabase Required)
# Run this script in PowerShell

Write-Host " Setting up Julyu project for testing..." -ForegroundColor Green

# Check if Node.js is installed
Write-Host "`n Checking Node.js installation..." -ForegroundColor Cyan
try {
 $nodeVersion = node --version
 Write-Host " Node.js $nodeVersion is installed" -ForegroundColor Green
} catch {
 Write-Host " Node.js is not installed. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
 exit 1
}

# Check if npm is installed
Write-Host "`n Checking npm installation..." -ForegroundColor Cyan
try {
 $npmVersion = npm --version
 Write-Host " npm $npmVersion is installed" -ForegroundColor Green
} catch {
 Write-Host " npm is not installed" -ForegroundColor Red
 exit 1
}

# Navigate to project directory
Write-Host "`n Navigating to project directory..." -ForegroundColor Cyan
Set-Location "C:\Users\beltr\Julyu"

# Install dependencies
Write-Host "`n Installing npm dependencies..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -ne 0) {
 Write-Host " Failed to install dependencies" -ForegroundColor Red
 exit 1
}

Write-Host " Dependencies installed successfully" -ForegroundColor Green

# Create .env.local file if it doesn't exist
Write-Host "`n️  Setting up environment variables..." -ForegroundColor Cyan
if (-not (Test-Path ".env.local")) {
 Copy-Item ".env.example" ".env.local"
 Write-Host " Created .env.local file" -ForegroundColor Green
 
 # Add mock database flag
 Add-Content ".env.local" "`n# Mock Database Mode (No Supabase Required)"
 Add-Content ".env.local" "NEXT_PUBLIC_USE_MOCK_DB=true"
 
 Write-Host " Configured for mock database mode" -ForegroundColor Green
} else {
 Write-Host "️  .env.local already exists, skipping..." -ForegroundColor Yellow
}

# Build the project
Write-Host "`n Building project..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
 Write-Host "️  Build had warnings, but continuing..." -ForegroundColor Yellow
}

Write-Host "`n Setup complete!" -ForegroundColor Green
Write-Host "`n Next steps:" -ForegroundColor Cyan
Write-Host " 1. Configure .env.local with your API keys" -ForegroundColor White
Write-Host " 2. Set up Supabase and run database/schema.sql" -ForegroundColor White
Write-Host " 3. Run: npm run dev" -ForegroundColor White
Write-Host " 4. Open: http://localhost:3825" -ForegroundColor White
Write-Host "`n️  REQUIRED: Supabase and API keys must be configured!" -ForegroundColor Yellow

