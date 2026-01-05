# 🚀 PowerShell Commands - Complete Guide

## Quick Start (Copy & Paste)

### First Time Setup
```powershell
# Navigate to project
cd C:\Users\beltr\Julyu

# Run automated setup
.\SETUP-TESTING.ps1
```

### Start Development Server
```powershell
# Option 1: Use script
.\START-DEV.ps1

# Option 2: Manual
npm run dev
```

---

## All Available Commands

### Setup & Installation
```powershell
# Install dependencies
npm install

# Install specific package
npm install package-name

# Update dependencies
npm update
```

### Development
```powershell
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type check (no build)
npm run type-check

# Lint code
npm run lint
```

### Testing & Debugging
```powershell
# Clear Next.js cache
Remove-Item -Recurse -Force .next

# Clear node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install

# Check Node.js version
node --version

# Check npm version
npm --version

# Check if port 3000 is in use
Get-NetTCPConnection -LocalPort 3000

# Kill process on port 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

### File Operations
```powershell
# Create .env.local from example
Copy-Item .env.example .env.local

# View .env.local
Get-Content .env.local

# Edit .env.local (opens in notepad)
notepad .env.local

# Check if file exists
Test-Path .env.local
```

### Git Operations (if using Git)
```powershell
# Initialize git
git init

# Check status
git status

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Check git version
git --version
```

---

## Step-by-Step Setup

### 1. Check Prerequisites
```powershell
# Check Node.js (should be 18+)
node --version

# Check npm
npm --version

# If not installed, download from https://nodejs.org
```

### 2. Navigate to Project
```powershell
cd C:\Users\beltr\Julyu
```

### 3. Install Dependencies
```powershell
npm install
```

### 4. Configure Environment
```powershell
# Create .env.local
Copy-Item .env.example .env.local

# Add mock database flag
Add-Content .env.local "`nNEXT_PUBLIC_USE_MOCK_DB=true"
```

### 5. Start Server
```powershell
npm run dev
```

### 6. Open Browser
```
http://localhost:3825
```

---

## Troubleshooting Commands

### Port Already in Use
```powershell
# Find process using port 3825
Get-NetTCPConnection -LocalPort 3825 | Select-Object OwningProcess

# Kill process (replace PID with actual process ID)
Stop-Process -Id <PID> -Force

# Or kill all Node processes (be careful!)
Get-Process node | Stop-Process -Force
```

### Clear Everything and Start Fresh
```powershell
# Remove all generated files
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules
Remove-Item .env.local

# Reinstall
npm install

# Recreate .env.local
Copy-Item .env.example .env.local
Add-Content .env.local "`nNEXT_PUBLIC_USE_MOCK_DB=true"

# Start fresh
npm run dev
```

### Check for Errors
```powershell
# Build to check for TypeScript errors
npm run build

# Type check only
npm run type-check
```

### View Logs
```powershell
# If running in background, view npm logs
# (Not applicable for npm run dev, but useful for production)
```

---

## Environment Variables

### View Current Environment
```powershell
# View all environment variables
Get-ChildItem Env:

# View specific variable
$env:NODE_ENV

# Set environment variable (temporary)
$env:NEXT_PUBLIC_USE_MOCK_DB = "true"
```

### Edit .env.local
```powershell
# Open in notepad
notepad .env.local

# Or use VS Code (if installed)
code .env.local
```

---

## Project Structure Commands

### List Files
```powershell
# List all files
Get-ChildItem

# List only directories
Get-ChildItem -Directory

# List with details
Get-ChildItem | Format-Table Name, Length, LastWriteTime
```

### Find Files
```powershell
# Find all .tsx files
Get-ChildItem -Recurse -Filter *.tsx

# Find all .ts files
Get-ChildItem -Recurse -Filter *.ts

# Find files containing "supabase"
Get-ChildItem -Recurse | Select-String "supabase"
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Setup | `.\SETUP-TESTING.ps1` |
| Start Dev | `.\START-DEV.ps1` or `npm run dev` |
| Install | `npm install` |
| Build | `npm run build` |
| Type Check | `npm run type-check` |
| Clear Cache | `Remove-Item -Recurse -Force .next` |
| Kill Port 3825 | `Get-Process -Id (Get-NetTCPConnection -LocalPort 3825).OwningProcess \| Stop-Process` |

---

## Testing Checklist

After running setup, test these:

1. **Server starts:**
   ```powershell
   npm run dev
   # Should see: "Ready on http://localhost:3825"
   ```

2. **Website loads:**
   - Open http://localhost:3825
   - Should see home page

3. **Sign up works:**
   - Click "Get Started"
   - Enter any email/password
   - Should redirect to dashboard

4. **Dashboard loads:**
   - Should see dashboard with mock data

5. **Compare prices:**
   - Go to Compare Prices
   - Enter grocery list
   - Click "Compare Prices Across Stores"
   - Should see results

---

## Next Steps After Setup

1. ✅ Configure Supabase and API keys in .env.local
2. ✅ Run database migration (database/schema.sql)
3. ✅ Server running on http://localhost:3825
4. ✅ Test all pages
5. ✅ Try price comparison (requires API keys)
6. ✅ Check admin dashboard
7. ✅ Test responsive design

---

**All set! Happy coding! 🎉**

