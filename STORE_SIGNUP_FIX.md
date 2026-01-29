# Fix Store Signup Issue - Step by Step

## The Problem

The store application is failing with "Failed to create account. This email may already be in use." because:

1. **Database tables don't exist yet** - The migration hasn't been run
2. When someone tries to apply:
   - ✅ Supabase auth creates user successfully
   - ❌ Insert to `store_owners` table fails (table doesn't exist)
   - ❌ Error shows "email already in use" if you retry with same email

## The Solution

Run the database migration to create all required tables, then test the signup flow.

---

## Step 1: Run the Database Migration

### Option A: Using Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard
2. Select your **Julyu** project
3. Click **SQL Editor** in left sidebar
4. Click **New query**
5. Open this file: `supabase/migrations/20260129_bodega_safe_migration.sql`
6. Copy ALL contents (198 lines)
7. Paste into SQL Editor
8. Click **Run** button (or press Ctrl+Enter)
9. Wait 5-10 seconds
10. You should see: **"Success. No rows returned"**

### Option B: Using Supabase CLI (If installed)

```bash
supabase db push
```

---

## Step 2: Verify Tables Were Created

1. In Supabase Dashboard, click **Table Editor**
2. You should now see these 8 new tables:
   - ✅ `store_owners`
   - ✅ `bodega_stores`
   - ✅ `bodega_inventory`
   - ✅ `pos_integrations`
   - ✅ `bodega_orders`
   - ✅ `commission_tiers`
   - ✅ `store_payouts`
   - ✅ `delivery_jobs`

3. Click on **commission_tiers** table
4. You should see 1 row: "Standard" tier at 15%

---

## Step 3: Clean Up Test Data (If Needed)

If you already tried to sign up and got the error, you may have an orphaned auth user.

### Check for orphaned users:
1. In Supabase Dashboard, go to **Authentication** > **Users**
2. Look for any users with the email you tried (e.g., test@bodega.com)
3. If you find one, **delete it** (it won't have a store_owners record)

**OR** just use a different email for testing (easier).

---

## Step 4: Test Store Signup

1. Go to http://localhost:3825/for-stores/apply (or your production URL)
2. Fill out the form with test data:

```
Business Information:
- Business Name: Joe's Bodega
- Business Type: Bodega
- Business Address: 456 Broadway, New York, NY 10013
- Business Phone: (212) 555-1234
- Business Email: joesbodega@test.com
- Tax ID: (leave blank or enter 12-3456789)
- Business License: (leave blank or enter BL-12345)

Store Location:
- Store Name: Joe's Bodega NYC
- Store Address: 456 Broadway
- City: New York
- State: NY
- ZIP Code: 10013
- Store Phone: (212) 555-1234

POS System (optional):
- Do you have a POS system?: No
```

3. Click **Submit Application**
4. You should see: **"Application submitted successfully!"**
5. The form should show success message

---

## Step 5: Verify in Admin Dashboard

1. Go to http://localhost:3825/admin/stores/applications
2. You should see "Joe's Bodega" in the applications list
3. Status should be **Pending** (yellow badge)
4. You should see:
   - Business Name: Joe's Bodega
   - Type: Bodega
   - Location: Joe's Bodega NYC, New York, NY 10013
   - Created date: Today's date

---

## Step 6: Test Approval Workflow

1. On the applications page, click **Approve** button for Joe's Bodega
2. The status should change to **Approved** (green badge)
3. Go to http://localhost:3825/admin/stores
4. You should now see "Joe's Bodega" in the All Stores list

---

## Step 7: Test Store Owner Login (Optional)

1. Log out of admin account
2. Try to log in with the email you used for the store (joesbodega@test.com)
3. Problem: You don't know the password (it was auto-generated)

**To fix this:**
1. Go to Supabase Dashboard > **Authentication** > **Users**
2. Find the user with email joesbodega@test.com
3. Click the user
4. Click **Send password recovery email**
5. Check the email inbox (if using real email) OR
6. In Supabase, go to **Authentication** > **Email Templates**
7. Copy the reset link format and create your own

**OR** just test with the admin approval flow for now.

---

## Expected Results After All Steps

### In Supabase Table Editor:

**store_owners table:**
- 1 row with:
  - business_name: "Joe's Bodega"
  - application_status: "approved"
  - commission_rate: 15.00

**bodega_stores table:**
- 1 row with:
  - name: "Joe's Bodega NYC"
  - address: "456 Broadway"
  - city: "New York"
  - state: "NY"
  - zip: "10013"
  - is_active: true (after approval)

### In Admin Dashboard:

**Admin > Store Applications:**
- Shows Joe's Bodega with "Approved" status

**Admin > All Stores:**
- Shows Joe's Bodega card with details

**Admin > Commission Tiers:**
- Shows "Standard - 15%" tier with 1 store using it

---

## Troubleshooting

### Issue: Migration fails with "relation already exists"
**Solution:** The migration is safe to run multiple times. Just click Run again.

### Issue: Still getting "email already in use"
**Solution:**
1. Delete the user from Supabase Auth > Users
2. Use a different email address
3. Make sure the migration ran successfully

### Issue: Application submits but doesn't show in admin
**Solution:**
1. Check browser console for errors
2. Verify you're logged in as enterprise tier admin
3. Check Supabase Table Editor to see if row was created

### Issue: Tables exist but RLS blocks access
**Solution:** Make sure you're logged in as the correct user type (admin = enterprise tier)

---

## What Happens Behind the Scenes

When you submit the store application form:

1. **POST to /api/store-portal/apply**
2. **Create auth user** (if not logged in)
   - Email: joesbodega@test.com
   - Auto-generated password
   - User metadata: `user_type: 'store_owner'`
3. **Insert store_owners record**
   - Links to auth user
   - Status: 'pending'
   - Commission rate: 15%
4. **Geocode address** (using Google Maps API)
   - Gets latitude/longitude for store
5. **Insert bodega_stores record**
   - Links to store_owner
   - Status: inactive until approved
6. **Return success**

When admin approves:

1. **Update store_owners**
   - application_status: 'approved'
   - approval_date: NOW()
   - reviewed_by: admin user ID
2. **Update bodega_stores**
   - is_active: true
   - verified: true
3. **Enable ordering**
   - accepts_orders: true

---

## Next Steps After Testing

Once you've verified the store signup and approval works:

1. ✅ Store applications - WORKING
2. ⏳ Inventory management - Build next
3. ⏳ Order placement - Build after inventory
4. ⏳ DoorDash delivery - Build with orders
5. ⏳ Stripe Connect payouts - Build last

---

## Quick Test Checklist

- [ ] Run migration in Supabase SQL Editor
- [ ] Verify 8 tables created in Table Editor
- [ ] Go to /for-stores/apply
- [ ] Fill out form with test data
- [ ] Click Submit Application
- [ ] See success message
- [ ] Go to /admin/stores/applications
- [ ] See "Joe's Bodega" in pending applications
- [ ] Click Approve button
- [ ] Go to /admin/stores
- [ ] See "Joe's Bodega" in stores list
- [ ] Verify commission tier shows 1 store using it

**If all checkboxes pass: Store signup system is WORKING! ✅**
