-- Demo System Database Schema
-- Tables for managing demo access requests and codes
-- Run this migration against your Supabase database

-- ============================================
-- Demo Requests Table
-- Stores demo access requests from the home page form
-- ============================================
CREATE TABLE IF NOT EXISTS demo_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  business_name VARCHAR(255),
  business_type VARCHAR(50) NOT NULL CHECK (business_type IN (
    'grocery_chain', 'independent_store', 'bodega', 'corner_store',
    'market', 'specialty_store', 'consumer', 'other'
  )),
  interest VARCHAR(20) NOT NULL CHECK (interest IN ('user_demo', 'store_demo', 'both')),
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demo_requests_status ON demo_requests(status);
CREATE INDEX IF NOT EXISTS idx_demo_requests_email ON demo_requests(email);
CREATE INDEX IF NOT EXISTS idx_demo_requests_created ON demo_requests(created_at DESC);

-- ============================================
-- Demo Codes Table
-- Stores generated demo access codes
-- ============================================
CREATE TABLE IF NOT EXISTS demo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  demo_type VARCHAR(20) NOT NULL CHECK (demo_type IN ('user', 'store', 'both')),
  request_id UUID REFERENCES demo_requests(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  uses_count INT DEFAULT 0,
  max_uses INT DEFAULT 100,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_demo_codes_code ON demo_codes(code);
CREATE INDEX IF NOT EXISTS idx_demo_codes_email ON demo_codes(email);
CREATE INDEX IF NOT EXISTS idx_demo_codes_active ON demo_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_demo_codes_request ON demo_codes(request_id);

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE demo_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_codes ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (used by API routes)
CREATE POLICY "Service role full access on demo_requests"
  ON demo_requests
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on demo_codes"
  ON demo_codes
  FOR ALL
  USING (true)
  WITH CHECK (true);
