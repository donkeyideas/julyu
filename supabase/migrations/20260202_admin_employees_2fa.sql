-- Admin Employees Table with 2FA Support and Permission-based Access Control
-- This replaces the hardcoded admin email check with a proper employee table

-- Admin Employees Table
CREATE TABLE IF NOT EXISTS admin_employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,

  -- Permission-based access control (JSONB for flexible page/action permissions)
  permissions JSONB NOT NULL DEFAULT '{
    "pages": {
      "dashboard": true,
      "stores": false,
      "store_applications": false,
      "orders": false,
      "employees": false,
      "commission_tiers": false,
      "payouts": false,
      "analytics": false,
      "rate_limits": false,
      "users": false,
      "ai_models": false,
      "delivery_partners": false
    },
    "actions": {
      "approve_stores": false,
      "reject_stores": false,
      "suspend_stores": false,
      "manage_employees": false,
      "generate_payouts": false,
      "edit_commission_tiers": false,
      "manage_users": false,
      "manage_ai_models": false
    }
  }'::jsonb,

  -- 2FA Fields (mandatory - must set up on first login)
  totp_secret VARCHAR(64), -- Base32 encoded TOTP secret (null = 2FA not set up yet)
  totp_enabled BOOLEAN DEFAULT FALSE,
  totp_verified_at TIMESTAMPTZ, -- When 2FA was first verified
  recovery_codes JSONB DEFAULT '[]'::jsonb, -- Array of hashed recovery codes
  recovery_codes_generated_at TIMESTAMPTZ,

  -- Security
  last_login TIMESTAMPTZ,
  last_login_ip VARCHAR(45), -- IPv6 compatible
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMPTZ, -- Account lockout after too many failed attempts
  must_change_password BOOLEAN DEFAULT TRUE, -- Force password change on first login

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_employees(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES admin_employees(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- Indexes for admin_employees
CREATE INDEX idx_admin_employees_email ON admin_employees(email);
CREATE INDEX idx_admin_employees_active ON admin_employees(is_active);

-- Admin Sessions Table (server-side session management)
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES admin_employees(id) ON DELETE CASCADE,
  session_token VARCHAR(64) UNIQUE NOT NULL, -- Crypto random token
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- 2FA session state
  requires_2fa BOOLEAN DEFAULT TRUE, -- Set to false after 2FA verification
  two_fa_verified_at TIMESTAMPTZ,

  -- Password change state
  requires_password_change BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL, -- 24 hours from creation
  last_activity TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for admin_sessions
CREATE INDEX idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX idx_admin_sessions_employee ON admin_sessions(employee_id);
CREATE INDEX idx_admin_sessions_expires ON admin_sessions(expires_at);

-- Admin Audit Log (for security tracking)
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES admin_employees(id),
  employee_email VARCHAR(255), -- Store email in case employee is deleted
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50), -- 'employee', 'store', 'user', etc.
  target_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for admin_audit_log
CREATE INDEX idx_admin_audit_employee ON admin_audit_log(employee_id);
CREATE INDEX idx_admin_audit_action ON admin_audit_log(action);
CREATE INDEX idx_admin_audit_created ON admin_audit_log(created_at);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_admin_employees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_employees_updated_at
  BEFORE UPDATE ON admin_employees
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_employees_updated_at();

-- Function to clean up expired sessions (can be called periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_admin_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM admin_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- RLS Policies (using service role client, so RLS is bypassed in admin routes)
ALTER TABLE admin_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Service role has full access (these policies allow service role to bypass RLS)
CREATE POLICY "Service role full access to admin_employees"
  ON admin_employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access to admin_sessions"
  ON admin_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access to admin_audit_log"
  ON admin_audit_log FOR ALL USING (true) WITH CHECK (true);

-- NOTE: Initial admin employee should be created via the seed API endpoint:
-- POST /api/admin/auth/seed
-- This endpoint will create the initial super admin with a properly hashed password.
-- The seed endpoint can only be called once when no employees exist.
