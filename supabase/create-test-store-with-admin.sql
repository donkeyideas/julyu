-- Create Test Store Using Your Admin Account
-- This will create a store owner linked to your existing user
-- Run this in Supabase SQL Editor

DO $$
DECLARE
    admin_user_id UUID;
    test_store_owner_id UUID;
    test_store_id UUID;
BEGIN
    -- Get your admin user ID from auth.users
    -- Replace 'your-email@example.com' with your actual admin email
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = 'beltr9510@gmail.com'  -- Change this to your admin email
    LIMIT 1;

    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Admin user not found. Update the email in this script.';
    END IF;

    -- Check if this user already has a store owner account
    SELECT id INTO test_store_owner_id
    FROM store_owners
    WHERE user_id = admin_user_id;

    IF test_store_owner_id IS NOT NULL THEN
        RAISE NOTICE 'Store owner already exists for this user: %', test_store_owner_id;
    ELSE
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
            admin_user_id,
            'Joe''s Test Bodega',
            'bodega',
            '456 Broadway, New York, NY 10013',
            '(212) 555-1234',
            'joes.bodega@example.com',
            '12-3456789',
            'BL-12345',
            'pending',
            15.00,
            false,
            false
        )
        RETURNING id INTO test_store_owner_id;

        RAISE NOTICE 'Created store owner: %', test_store_owner_id;
    END IF;

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
        'Joe''s Bodega NYC - ' || TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI'),  -- Unique name with timestamp
        '456 Broadway',
        'New York',
        'NY',
        '10013',
        '(212) 555-1234',
        40.7128,
        -74.0060,
        false,
        false
    )
    RETURNING id INTO test_store_id;

    RAISE NOTICE 'Created bodega store: %', test_store_id;
    RAISE NOTICE '---';
    RAISE NOTICE 'Success! Test store created.';
    RAISE NOTICE 'Go to /admin/stores/applications to see it.';
END $$;

-- Show the created data
SELECT
    'Store Owner' as type,
    so.id,
    so.business_name,
    so.business_email,
    so.application_status,
    so.created_at,
    u.email as user_email
FROM store_owners so
LEFT JOIN auth.users u ON so.user_id = u.id
WHERE so.business_name LIKE 'Joe''s Test Bodega%'
ORDER BY so.created_at DESC
LIMIT 1;

SELECT
    'Bodega Store' as type,
    bs.id,
    bs.name,
    bs.city,
    bs.state,
    bs.is_active,
    bs.created_at
FROM bodega_stores bs
WHERE bs.name LIKE 'Joe''s Bodega NYC%'
ORDER BY bs.created_at DESC
LIMIT 1;
