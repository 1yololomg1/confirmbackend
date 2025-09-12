# Deployment Guide - Vercel Hobby Plan Compatible

This system has been optimized to work within Vercel's Hobby plan limits (12 serverless functions max).

## Function Count: 2 Functions Total ✅

1. `/api/license-api.js` - Main consolidated API (handles 7 endpoints)
2. `/api/payment-webhook.js` - Stripe webhook handler

## Quick Deployment Steps

### 1. Set up Supabase Database
```sql
-- Run the SQL from /database/secure-schema.sql in your Supabase project
```

### 2. Configure Environment Variables in Vercel
```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_SECRET_KEY=your-secure-admin-password

# Stripe (Required for payments)
STRIPE_SECRET_KEY=sk_live_... # or sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional
FINGERPRINT_SALT=random-salt-string-for-extra-security
PAYMENT_BASE_URL=https://your-domain.com
```

### 3. Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# The system will automatically work within Hobby plan limits
```

### 4. Configure Stripe Webhook
- Go to Stripe Dashboard → Webhooks
- Add endpoint: `https://your-domain.com/api/payment-webhook`
- Select event: `checkout.session.completed`
- Copy webhook secret to `STRIPE_WEBHOOK_SECRET` env var

### 5. Test the System
- Access admin: `https://your-domain.com/secure-admin.html`
- Test license verification with hardware info
- Create test payment session

## API Usage

All endpoints use the consolidated API:

```javascript
// Machine fingerprint generation
fetch('/api/license-api?endpoint=machine-fingerprint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    hardware_info: {
      cpu_id: 'cpu-id',
      motherboard_id: 'mb-id',
      bios_serial: 'bios-serial',
      mac_address: 'mac-addr'
    }
  })
});

// License verification
fetch('/api/license-api?endpoint=verify-secure-license', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    hardware_info: { /* same as above */ },
    product: 'your-software',
    version: '1.0.0'
  })
});

// Admin operations (with admin key)
fetch('/api/license-api?endpoint=admin-analytics', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Admin-Key': 'your-admin-key'
  }
});
```

## Security Features

- **Minimal Data**: Only machine fingerprints stored (SHA256 hashes)
- **No Personal Info**: No emails, names, or addresses retained
- **Non-Transferable**: Licenses tied to hardware fingerprints
- **Automatic Expiration**: Licenses expire and lock software
- **Audit Trail**: Technical events only, no personal data

## File Structure (Optimized)

```
/workspace/
├── api/
│   ├── license-api.js          # Main consolidated API (7 endpoints)
│   └── payment-webhook.js      # Stripe webhook
├── database/
│   └── secure-schema.sql       # Database setup
├── client-examples/
│   └── hardware-fingerprint.js # Integration code
└── public/
    └── secure-admin.html       # Admin interface
```

## Troubleshooting

### Function Limit Error
If you still get function limit errors:
- Ensure old API files are deleted
- Check `/api/` directory only has 2 files
- Redeploy with `vercel --force`

### Database Connection Issues
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Check Supabase project is active
- Ensure database schema is applied

### Payment Issues
- Verify Stripe keys are correct (test vs live)
- Check webhook endpoint is configured in Stripe
- Ensure webhook secret matches environment variable

### License Verification Fails
- Check hardware info is being collected correctly
- Verify fingerprint generation is consistent
- Ensure database has licenses for testing

## Monitoring

Monitor your deployment:
- Vercel Functions dashboard for performance
- Supabase logs for database queries  
- Stripe webhooks dashboard for payment events
- Admin interface analytics for license statistics

## Scaling

When ready to scale beyond Hobby plan:
- Upgrade to Vercel Pro for unlimited functions
- Consider splitting endpoints back into separate files
- Add caching layer for better performance
- Implement rate limiting for security