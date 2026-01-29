# How to Run the Bodega Database Migration

## Quick Steps

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your Julyu project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Paste the Migration**
   - Open file: `supabase/migrations/20260129_bodega_safe_migration.sql`
   - Copy ALL the contents (Ctrl+A, Ctrl+C)
   - Paste into the SQL Editor

4. **Run the Migration**
   - Click "Run" button (or press Ctrl+Enter)
   - Wait for it to complete (should take 5-10 seconds)

5. **Verify Success**
   - You should see "Success. No rows returned"
   - Check the Tables section - you should now see these new tables:
     - store_owners
     - bodega_stores
     - bodega_inventory
     - pos_integrations
     - bodega_orders
     - commission_tiers
     - store_payouts
     - delivery_jobs

## What This Migration Does

- Creates all bodega system tables
- Sets up Row Level Security (RLS) policies
- Creates indexes for performance
- Inserts a default commission tier (15%)

## If You Get an Error

The migration is safe to run multiple times. If you see any "already exists" errors, that's normal - it means some tables were already created. The migration will skip those and create the missing ones.

## After Running

Once the migration completes:
1. All admin bodega pages will show empty data (not errors)
2. The store application form will work
3. You can start testing store applications

## Next Steps

1. Test the application form at: `/for-stores/apply`
2. Fill out the form completely
3. Submit the application
4. Go to `/admin/stores/applications` to review and approve it
