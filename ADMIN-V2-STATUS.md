# Admin Dashboard v2 - Current Status

## Quick Start After Restart

1. **Navigate to project:**
   ```powershell
   cd C:\Users\beltr\Julyu
   ```

2. **Start development server:**
   ```powershell
   npm run dev
   ```

3. **Access Admin Dashboard v2:**
   - URL: `http://localhost:3825/admin-v2`
   - Main Dashboard: `/admin-v2`
   - AI Models: `/admin-v2/ai-models`
   - Usage & Costs: `/admin-v2/usage`
   - Performance: `/admin-v2/performance`
   - AI Performance: `/admin-v2/ai-performance`
   - Partnerships Costs: `/admin-v2/partnerships-costs`
   - Retailers: `/admin-v2/retailers`
   - Users: `/admin-v2/users`
   - Price Database: `/admin-v2/prices`

## What's Been Built

### Admin Dashboard v2 Structure
- **Location:** `/app/admin-v2/`
- **Layout:** `/app/admin-v2/layout.tsx` (includes sidebar)
- **Sidebar:** `/components/admin-v2/Sidebar.tsx`

### Pages Created
1. **Dashboard** (`/admin-v2/page.tsx`)
   - Stats cards: Users, Retailers, AI Requests, Cost, Active Models, Response Time
   - Quick action links

2. **AI Models** (`/admin-v2/ai-models/page.tsx`)
   - API key configuration for DeepSeek and OpenAI
   - Save and Test buttons
   - Direct API testing (bypasses encryption)
   - Shows token usage and costs

3. **Usage & Costs** (`/admin-v2/usage/page.tsx`)
   - Time range selector
   - Stats cards
   - Detailed usage table

4. **Performance** (`/admin-v2/performance/page.tsx`)
   - Model performance metrics
   - Success rates
   - Response times

5. **AI Performance** (`/admin-v2/ai-performance/page.tsx`)
   - Product Matching Accuracy
   - Receipt Parsing Accuracy
   - Substitution Acceptance Rate
   - Average Response Time

6. **Partnerships AI Costs** (`/admin-v2/partnerships-costs/page.tsx`)
   - Cost breakdown by model
   - Time range selector

7. **Retailer Partnerships** (`/admin-v2/retailers/page.tsx`)
   - Retailer list
   - Partnership tiers
   - Revenue share

8. **Users** (`/admin-v2/users/page.tsx`)
   - User statistics
   - Premium/Enterprise/Free breakdown
   - Distribution charts

9. **Price Database** (`/admin-v2/prices/page.tsx`)
   - Product and price statistics
   - Database overview

## API Routes

### Working API Routes
- `/api/admin/save-api-keys` - Save/Get API keys (POST/GET)
- `/api/admin/test-key-direct` - Direct API key test (bypasses encryption)
- `/api/ai/test-connection` - Test AI model connections
- `/api/ai/track-usage` - Track AI usage (server-side)
- `/api/admin/ai-usage-stats` - Get usage statistics
- `/api/admin/model-config` - Model configuration (GET/POST)

## Current Issues & Fixes Applied

### API Key Saving
- **Issue:** Keys were getting corrupted during encryption/decryption
- **Fix Applied:**
  - Added encryption verification in `encrypt()` function
  - Added post-save verification
  - Better error messages
  - Direct API testing bypasses encryption issues

### Encryption/Decryption
- **Location:** `app/api/admin/save-api-keys/route.ts`
- **Functions:** `encrypt()` and `decrypt()`
- **Status:** Now includes verification to prevent corruption

### Key Format Handling
- Automatically removes "Julyu " prefix if present
- Validates `sk-` prefix
- Validates minimum length (20 chars)

## Database Tables Used

1. **ai_model_config** - Stores encrypted API keys
2. **ai_model_usage** - Tracks API calls, tokens, costs
3. **ai_training_data** - Stores training data for future LLM training
4. **users** - User accounts
5. **partner_retailers** - Retailer partnerships
6. **products** - Product catalog
7. **prices** - Price records

## Environment Variables Needed

```env
# Optional - if not set, uses test auth mode
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# API Key Encryption (optional - has default)
API_KEY_ENCRYPTION_KEY=your-32-character-encryption-key

# Fallback API Keys (optional - can be set via UI)
DEEPSEEK_API_KEY=sk-...
OPENAI_API_KEY=sk-...
```

## Test Mode

- **Current Status:** Running in test mode (no Supabase configured)
- **Authentication:** Uses test auth (`lib/auth/test-auth.ts`)
- **Database:** Mock responses (returns empty arrays/null)
- **API Keys:** Can be saved via UI, stored in database if table exists

## Key Features

1. **API Key Management:**
   - Save keys via UI
   - Encrypted storage
   - Direct API testing
   - Status indicators

2. **Usage Tracking:**
   - Automatic tracking via `lib/ai/tracker.ts`
   - Server-side tracking via `/api/ai/track-usage`
   - Cost calculation
   - Token usage

3. **Performance Metrics:**
   - Real-time accuracy calculations
   - Response time tracking
   - Success/failure rates

## Next Steps After Restart

1. Start dev server: `npm run dev`
2. Go to `/admin-v2`
3. Test API key saving:
   - Enter key: `sk-b438d34d8d3a43a699c787ed0caf4b2b`
   - Click "Save Key"
   - Click "Test Connection"
4. Check console logs for debugging info

## Important Notes

- **Port:** 3825 (changed from 3000)
- **Test Auth:** Default user is enterprise tier (admin access)
- **API Keys:** Can be saved even without Supabase (will use env vars as fallback)
- **Direct Test:** Always tests key directly first (bypasses encryption issues)
- **Logging:** Extensive console logging for debugging

## File Locations

- Admin v2 pages: `app/admin-v2/`
- Sidebar: `components/admin-v2/Sidebar.tsx`
- API routes: `app/api/admin/` and `app/api/ai/`
- AI tracker: `lib/ai/tracker.ts`
- API config: `lib/api/config.ts`
- DeepSeek client: `lib/api/deepseek.ts`
- OpenAI client: `lib/api/openai.ts`

## Troubleshooting

If API keys still don't save:
1. Check browser console for errors
2. Check server console (where `npm run dev` is running)
3. Look for encryption/decryption logs
4. Verify database table exists (if using Supabase)
5. Try direct test first (bypasses encryption)


