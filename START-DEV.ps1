# Start Development Server
# Run this script to start the Next.js development server

Write-Host "🚀 Starting Julyu development server..." -ForegroundColor Green

# Navigate to project directory
Set-Location "C:\Users\beltr\Julyu"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "❌ Dependencies not installed. Run SETUP-TESTING.ps1 first" -ForegroundColor Red
    exit 1
}

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  .env.local not found. Creating from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env.local"
    Add-Content ".env.local" "`nNEXT_PUBLIC_USE_MOCK_DB=true"
}

Write-Host "`n✅ Starting development server on http://localhost:3825" -ForegroundColor Green
Write-Host "`n💡 Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host "`n⚠️  Make sure you have configured:" -ForegroundColor Yellow
Write-Host "   - Supabase credentials in .env.local" -ForegroundColor White
Write-Host "   - API keys (Instacart, DeepSeek, OpenAI)" -ForegroundColor White
Write-Host "`n"

# Start the dev server
npm run dev

