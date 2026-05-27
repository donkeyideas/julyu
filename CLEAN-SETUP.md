#  Clean Setup Guide - No Mock Data

## Overview

The project is now **completely clean** with:
-  **No mock data** - All data comes from real APIs and database
-  **Port 3825** - Changed from 3000
-  **Clean codebase** - All mock files removed
-  **Real API integration** - Requires actual API keys

---

## ️ Required Setup

### 1. Supabase (REQUIRED)
You **must** set up Supabase:
1. Create account at https://supabase.com
2. Create a new project
3. Run `database/schema.sql` in SQL Editor
4. Get your URL and keys from Project Settings > API

### 2. API Keys (REQUIRED)
You need to add these to `.env.local`:

**Instacart Connect API:**
- Get from: https://docs.instacart.com/connect/
- You need to contact Instacart for API access
- They provide API key and secret

**DeepSeek API:**
- Get from: https://platform.deepseek.com
- Sign up and get your API key

**OpenAI API:**
- Get from: https://platform.openai.com
- Sign up and get your API key

---

##  Setup Commands

### 1. Install Dependencies
```powershell
cd C:\Users\beltr\Julyu
npm install
```

### 2. Create Environment File
```powershell
Copy-Item .env.example .env.local
notepad .env.local
```

### 3. Add Your API Keys
Edit `.env.local` and add:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

INSTACART_API_KEY=your_instacart_key
INSTACART_API_SECRET=your_instacart_secret

DEEPSEEK_API_KEY=your_deepseek_key

OPENAI_API_KEY=your_openai_key
```

### 4. Run Database Migration
1. Go to Supabase Dashboard
2. Open SQL Editor
3. Copy contents of `database/schema.sql`
4. Paste and execute

### 5. Start Server
```powershell
npm run dev
```

Server will run on: **http://localhost:3825**

---

##  Instacart API Setup

**I do NOT have Instacart API keys.** You need to:

1. **Contact Instacart:**
 - Visit: https://docs.instacart.com/connect/
 - Click "Contact us" or "Get Started"
 - Request API access for your project

2. **Provide Information:**
 - Your project details
 - Use case (grocery price comparison)
 - Expected volume

3. **Get Credentials:**
 - They'll provide:
 - API Key
 - API Secret
 - Base URL (usually https://api.instacart.com)

4. **Add to .env.local:**
 ```env
 INSTACART_API_KEY=your_key_here
 INSTACART_API_SECRET=your_secret_here
 INSTACART_BASE_URL=https://api.instacart.com
 ```

---

##  What's Clean Now

-  **No mock database** - Removed all mock files
-  **No mock data** - All pages show empty states until data exists
-  **No hardcoded values** - Everything comes from database/APIs
-  **Real Supabase** - Requires actual Supabase setup
-  **Real APIs** - Requires actual API keys

---

##  If You See Errors

### "Missing Supabase environment variables"
- Add Supabase credentials to `.env.local`

### "DeepSeek API key not configured"
- Add `DEEPSEEK_API_KEY` to `.env.local`

### "Instacart API key not configured"
- Add Instacart credentials to `.env.local`
- Or implement the API integration first

### "Port 3825 already in use"
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3825).OwningProcess | Stop-Process
```

---

##  Next Steps

1.  Set up Supabase
2.  Add API keys to `.env.local`
3.  Run database migration
4.  Start server: `npm run dev`
5.  Test at http://localhost:3825

---

**The codebase is now clean and ready for real API integration!** 


