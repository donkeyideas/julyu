#  Quick Access Guide - Test Auth (No Supabase)

## Direct URLs

### User Dashboard
```
http://localhost:3825/dashboard
```

### Admin Dashboard  
```
http://localhost:3825/admin
```

---

##  Fastest Way to Test

### 1. Start Server
```powershell
cd C:\Users\beltr\Julyu
npm run dev
```

### 2. Sign Up or Login
**Option A: Sign Up**
- Go to: http://localhost:3825/auth/signup
- Enter any email/password
- Click "Get Started"

**Option B: Login (Test User)**
- Go to: http://localhost:3825/auth/login
- Email: `test@julyu.com`
- Password: `password` (any password works)
- Click "Sign In"

### 3. Access Dashboards

**User Dashboard:**
- Auto-redirected after signup/login
- Or manually: http://localhost:3825/dashboard

**Admin Dashboard:**
- Go to: http://localhost:3825/admin
-  Test user has enterprise tier (admin access)
-  New users default to free tier (can still access admin for testing)

---

##  What Works

-  **No Supabase required** - Uses test authentication
-  **All pages accessible** - User and admin dashboards
-  **Session persists** - Stored in browser localStorage
-  **Sign up/Login** - Any email/password works

---

##  When You Add Supabase

Once you configure Supabase in `.env.local`, the app automatically switches from test auth to real Supabase. No code changes needed!

---

**That's it! Both dashboards are accessible without Supabase!** 

