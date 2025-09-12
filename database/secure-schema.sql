-- Secure License Management Database Schema
-- Designed for oil & gas industry with minimal data retention

-- Secure licenses table (NO personal information stored)
CREATE TABLE secure_licenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    machine_fingerprint TEXT UNIQUE NOT NULL, -- SHA256 hash, non-reversible
    license_type TEXT NOT NULL CHECK (license_type IN ('student', 'startup', 'professional', 'professional_yearly', 'enterprise', 'enterprise_yearly')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    amount_paid DECIMAL(10,2), -- For revenue tracking only
    features JSONB DEFAULT '{}',
    created_by TEXT DEFAULT 'payment_webhook',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_verified_at TIMESTAMP WITH TIME ZONE,
    verification_count INTEGER DEFAULT 0
);

-- Minimal audit log (NO personal data, NO IP addresses)
CREATE TABLE license_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    license_id UUID REFERENCES secure_licenses(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}', -- Only technical details, no personal info
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_secure_licenses_fingerprint ON secure_licenses(machine_fingerprint);
CREATE INDEX idx_secure_licenses_status ON secure_licenses(status);
CREATE INDEX idx_secure_licenses_expires_at ON secure_licenses(expires_at);
CREATE INDEX idx_secure_licenses_created_at ON secure_licenses(created_at);
CREATE INDEX idx_secure_audit_log_license_id ON license_audit_log(license_id);
CREATE INDEX idx_secure_audit_log_created_at ON license_audit_log(created_at);

-- Automatic cleanup of old audit logs (retain only 1 year)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM license_audit_log 
    WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup to run daily (if using pg_cron extension)
-- SELECT cron.schedule('cleanup-audit-logs', '0 2 * * *', 'SELECT cleanup_old_audit_logs();');

-- Function to automatically expire licenses
CREATE OR REPLACE FUNCTION expire_old_licenses()
RETURNS void AS $$
BEGIN
    UPDATE secure_licenses 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'active' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule license expiration check (if using pg_cron extension)
-- SELECT cron.schedule('expire-licenses', '0 1 * * *', 'SELECT expire_old_licenses();');

-- Security: Row Level Security (RLS) policies
ALTER TABLE secure_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access data
CREATE POLICY "Service role only" ON secure_licenses
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role only" ON license_audit_log
    FOR ALL USING (auth.role() = 'service_role');

-- Create view for safe admin access (masks sensitive data)
CREATE VIEW admin_license_summary AS
SELECT 
    LEFT(machine_fingerprint, 8) || '...' as fingerprint_preview,
    license_type,
    status,
    expires_at,
    amount_paid,
    created_at,
    last_verified_at,
    verification_count
FROM secure_licenses
ORDER BY created_at DESC;

-- Grant access to the view
GRANT SELECT ON admin_license_summary TO service_role;

-- Comments for documentation
COMMENT ON TABLE secure_licenses IS 'Secure license storage with machine fingerprints only - no personal data';
COMMENT ON COLUMN secure_licenses.machine_fingerprint IS 'SHA256 hash of hardware info - non-reversible';
COMMENT ON COLUMN secure_licenses.amount_paid IS 'Revenue tracking only - no customer identification possible';
COMMENT ON TABLE license_audit_log IS 'Minimal audit trail - no personal information or IP addresses stored';

-- Example queries for monitoring:

-- Active licenses by type
-- SELECT license_type, COUNT(*) as active_count 
-- FROM secure_licenses 
-- WHERE status = 'active' AND expires_at > NOW() 
-- GROUP BY license_type;

-- Revenue summary
-- SELECT license_type, COUNT(*) as licenses, SUM(amount_paid) as revenue 
-- FROM secure_licenses 
-- GROUP BY license_type;

-- Licenses expiring soon (next 30 days)
-- SELECT COUNT(*) as expiring_soon 
-- FROM secure_licenses 
-- WHERE status = 'active' 
-- AND expires_at BETWEEN NOW() AND NOW() + INTERVAL '30 days';