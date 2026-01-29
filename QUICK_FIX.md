# 🚨 QUICK FIX: Store Signup Not Working

## The Problem
Store signup returns: **"Failed to create account. This email may already be in use."**

## Root Cause
❌ Database tables don't exist yet (migration not run)

## The Fix (3 minutes)

### 1. Run Migration in Supabase (2 min)
1. Open https://supabase.com/dashboard → Your Project
2. Click **SQL Editor** → **New query**
3. Copy ALL from: `supabase/migrations/20260129_bodega_safe_migration.sql`
4. Paste in editor → Click **Run**
5. Wait for: **"Success. No rows returned"**

### 2. Verify Tables Created (30 sec)
Click **Table Editor** - should see 8 new tables:
- store_owners
- bodega_stores
- bodega_inventory
- pos_integrations
- bodega_orders
- commission_tiers
- store_payouts
- delivery_jobs

### 3. Test Signup (30 sec)
1. Go to `/for-stores/apply`
2. Fill form with any test data
3. Use email: `test@example.com` (or any unused email)
4. Click Submit
5. Should see success message

### 4. Check Admin (30 sec)
1. Go to `/admin/stores/applications`
2. Should see your test store
3. Click **Approve**
4. Go to `/admin/stores`
5. Should see approved store

---

## ⚠️ If You Already Tried Signup

The email might be stuck in auth. Two options:

**Option 1: Use different email** (easiest)
- Just use a different email for testing

**Option 2: Delete orphaned user**
1. Supabase Dashboard → **Authentication** → **Users**
2. Find and delete the test user
3. Try again with same email

---

## Full Details
See [STORE_SIGNUP_FIX.md](STORE_SIGNUP_FIX.md) for complete step-by-step guide.
