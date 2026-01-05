# 🧪 Test Authentication Guide (No Supabase Required)

## Overview

The app now uses **test authentication** when Supabase is not configured. This allows you to test all features without setting up a database.

---

## 🚀 Quick Start

### 1. Start Server
```powershell
cd C:\Users\beltr\Julyu
npm run dev
```

### 2. Sign Up or Login
- **Sign Up:** http://localhost:3825/auth/signup
- **Login:** http://localhost:3825/auth/login
- **Test User:** `test@julyu.com` / `password` (any password works)

### 3. Access Dashboards
- **User Dashboard:** http://localhost:3825/dashboard
- **Admin Dashboard:** http://localhost:3825/admin

---

## ✅ What Works

### Authentication
- ✅ Sign up (creates user in memory + localStorage)
- ✅ Login (any email/password works)
- ✅ Sign out
- ✅ Session persists in localStorage

### User Dashboard
- ✅ All pages accessible
- ✅ Navigation works
- ✅ Empty states shown (no database data)

### Admin Dashboard
- ✅ All pages accessible
- ✅ Default test user has enterprise tier (admin access)
- ✅ Empty states shown (no database data)

---

## 🔑 Default Test User

**Email:** `test@julyu.com`  
**Password:** Any password  
**Tier:** Enterprise (admin access)

You can also create new users by signing up.

---

## 📝 How It Works

1. **In-Memory Storage:**
   - Users stored in memory (lost on server restart)
   - Sessions stored in browser localStorage

2. **No Database Required:**
   - All auth handled client-side
   - No Supabase needed for testing

3. **Seamless Switching:**
   - When you add Supabase credentials, it automatically switches
   - Test auth only used when Supabase not configured

---

## 🔄 Switching to Real Supabase

When ready to use Supabase:

1. **Add credentials to `.env.local`:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

2. **Restart server:**
   ```powershell
   npm run dev
   ```

3. **App automatically uses Supabase** instead of test auth

---

## 🎯 Testing Checklist

- [ ] Sign up with new account
- [ ] Login with test account
- [ ] Access user dashboard
- [ ] Access admin dashboard
- [ ] Navigate all pages
- [ ] Test sign out
- [ ] Test session persistence (refresh page)

---

## ⚠️ Notes

- **Data Persistence:** Test auth data is lost on server restart
- **No Database:** All data is in-memory or localStorage
- **Production:** Use Supabase for production deployment

---

**You can now test everything without Supabase!** 🎉


