# 📊 How to View Admin and User Dashboards

## Quick Access URLs

### User Dashboard
```
http://localhost:3825/dashboard
```

### Admin Dashboard
```
http://localhost:3825/admin
```

---

## 🔐 Access Requirements

### User Dashboard
- ✅ Requires: **User account** (sign up or login)
- ✅ Access: Any authenticated user

### Admin Dashboard
- ✅ Requires: **User account** + **Enterprise subscription tier**
- ✅ Access: Only users with `subscription_tier = 'enterprise'`

---

## 🚀 Step-by-Step Guide

### Option 1: Full Setup (Recommended)

#### 1. Set Up Supabase
```powershell
# 1. Create account at https://supabase.com
# 2. Create new project
# 3. Run database/schema.sql in SQL Editor
# 4. Get credentials from Project Settings > API
```

#### 2. Configure Environment
```powershell
# Create .env.local
Copy-Item .env.example .env.local
notepad .env.local

# Add your Supabase credentials:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### 3. Create User Account
1. Go to: http://localhost:3825/auth/signup
2. Sign up with email/password
3. You'll be redirected to `/dashboard`

#### 4. Make User Admin (for Admin Dashboard)
Run this SQL in Supabase SQL Editor:
```sql
-- Replace 'user@example.com' with your email
UPDATE users 
SET subscription_tier = 'enterprise' 
WHERE email = 'user@example.com';
```

#### 5. Access Dashboards
- **User Dashboard:** http://localhost:3825/dashboard
- **Admin Dashboard:** http://localhost:3825/admin

---

### Option 2: Quick Test (Temporary Admin Access)

I'll create a temporary bypass so you can test the admin dashboard without setting up the database.

---

## 📝 Direct Links

Once authenticated:

| Dashboard | URL | Requirements |
|-----------|-----|--------------|
| **User Dashboard** | http://localhost:3825/dashboard | Any user |
| **Admin Dashboard** | http://localhost:3825/admin | Enterprise user |

---

## 🔧 Troubleshooting

### "Redirected to /auth/login"
- You're not logged in
- Solution: Sign up or login first

### "Redirected to /dashboard" (when accessing /admin)
- Your user doesn't have enterprise tier
- Solution: Update user in database (see SQL above)

### "Redirected to /setup-required"
- Supabase not configured
- Solution: Add Supabase credentials to `.env.local`

---

## 🎯 Quick Test Flow

1. **Start server:**
   ```powershell
   npm run dev
   ```

2. **Sign up:**
   - Go to: http://localhost:3825/auth/signup
   - Create account

3. **View User Dashboard:**
   - Auto-redirected after signup
   - Or go to: http://localhost:3825/dashboard

4. **Make yourself admin:**
   - Run SQL in Supabase to set `subscription_tier = 'enterprise'`

5. **View Admin Dashboard:**
   - Go to: http://localhost:3825/admin

---

**That's it! You can now access both dashboards.** 🎉


