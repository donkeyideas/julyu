-- Create Test Store Owner Directly in Database
-- Run this in Supabase SQL Editor to bypass email validation

-- Step 1: Create a test auth user
-- Replace YOUR_ACTUAL_EMAIL with a real email you have access to
-- This will create a user with ID that we'll use

DO $$
DECLARE
    test_user_id UUID;
    test_store_owner_id UUID;
BEGIN
    -- Option 1: If you have an existing user ID, use it
    -- test_user_id := 'YOUR_EXISTING_USER_ID';

    -- Option 2: Generate a new UUID for testing (won't have real auth)
    test_user_id := gen_random_uuid();

    -- Insert test store owner
    INSERT INTO store_owners (
        user_id,
        business_name,
        business_type,
        business_address,
        business_phone,
        business_email,
        tax_id,
        business_license,
        application_status,
        commission_rate,
        accepts_orders,
        auto_accept_orders
    ) VALUES (
        test_user_id,
        'Joe''s Test Bodega',
        'bodega',
        '456 Broadway, New York, NY 10013',
        '(212) 555-1234',
        'joes.bodega@example.com',  -- This is stored but not validated by Supabase Auth
        '12-3456789',
        'BL-12345',
        'pending',  -- Start as pending so you can test approval
        15.00,
        false,
        false
    )
    RETURNING id INTO test_store_owner_id;

    -- Insert bodega store
    INSERT INTO bodega_stores (
        store_owner_id,
        name,
        address,
        city,
        state,
        zip,
        phone,
        latitude,
        longitude,
        is_active,
        verified
    ) VALUES (
        test_store_owner_id,
        'Joe''s Bodega NYC',
        '456 Broadway',
        'New York',
        'NY',
        '10013',
        '(212) 555-1234',
        40.7128,  -- NYC coordinates
        -74.0060,
        false,  -- Will be activated after approval
        false
    );

    RAISE NOTICE 'Test store created successfully!';
    RAISE NOTICE 'Store Owner ID: %', test_store_owner_id;
    RAISE NOTICE 'User ID: %', test_user_id;
END $$;

-- Verify the data was created
SELECT
    'Store Owner' as type,
    id,
    business_name,
    business_email,
    application_status
FROM store_owners
WHERE business_name = 'Joe''s Test Bodega';

SELECT
    'Bodega Store' as type,
    id,
    name,
    city,
    state,
    is_active
FROM bodega_stores
WHERE name = 'Joe''s Bodega NYC';
