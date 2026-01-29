/**
 * Test Store Signup Script
 * Run this to create a test store application programmatically
 *
 * Usage: node test-store-signup.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3825'

const testStoreData = {
  businessName: "Joe's Test Bodega",
  businessType: "bodega",
  businessAddress: "456 Broadway, New York, NY 10013",
  businessPhone: "(212) 555-1234",
  businessEmail: "joes.bodega.test@example.com", // Use unique email
  taxId: "12-3456789",
  businessLicense: "BL-12345",
  storeName: "Joe's Bodega NYC",
  storeAddress: "456 Broadway",
  storeCity: "New York",
  storeState: "NY",
  storeZip: "10013",
  storePhone: "(212) 555-1234",
  hasPosSystem: false,
  posSystemName: ""
}

async function createStoreApplication() {
  console.log('🚀 Creating test store application...\n')
  console.log('Data:', JSON.stringify(testStoreData, null, 2), '\n')

  try {
    const response = await fetch(`${BASE_URL}/api/store-portal/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testStoreData)
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Error:', response.status, response.statusText)
      console.error('Response:', data)

      if (response.status === 400 && data.error?.includes('email may already be in use')) {
        console.log('\n💡 Solution: The email is already registered.')
        console.log('Either:')
        console.log('1. Delete the user from Supabase Auth > Users')
        console.log('2. Or use a different email address\n')
      }

      process.exit(1)
    }

    console.log('✅ Success! Store application created:')
    console.log('Store Owner ID:', data.data.storeOwnerId)
    console.log('Store ID:', data.data.storeId)
    console.log('Status:', data.data.status)
    console.log('\n📋 Next steps:')
    console.log('1. Go to /admin/stores/applications')
    console.log('2. You should see "Joe\'s Test Bodega" with Pending status')
    console.log('3. Click Approve to activate the store')
    console.log('4. Check /admin/stores to see the approved store\n')

  } catch (error) {
    console.error('❌ Network error:', error.message)
    console.log('\nMake sure:')
    console.log('1. The dev server is running (npm run dev)')
    console.log('2. The database migration has been run')
    console.log('3. You are connected to the internet\n')
    process.exit(1)
  }
}

// Run the test
createStoreApplication()
