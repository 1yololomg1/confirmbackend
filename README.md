# CONFIRM License Management System

A comprehensive license management system for manually assigning licenses to clients based on their payment tier.

## Quick Start

1. **Set up environment variables:**
   ```env
   SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ADMIN_SECRET_KEY=your-secure-admin-key
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Access admin interface:**
   Open `http://localhost:3000/admin.html`

## Features

- **Manual License Creation** - Create licenses for specific clients  
- **6 License Tiers** - Student, Startup, Professional, Enterprise  
- **Advanced Search** - Find licenses by email, machine ID, or customer  
- **Analytics Dashboard** - Revenue tracking and usage statistics  
- **Client Management** - Track customer information and history  
- **License Verification API** - Programmatic license validation  
- **Modern UI** - Beautiful, responsive admin interface  

## License Tiers - **ALL GET FULL FEATURES!**

> **Simple Model**: All paying customers get access to ALL features. Tiers are pricing only!

| Tier | Price | Users | Features |
|------|-------|-------|----------|
| Student | $49/year | Unlimited | **FULL FEATURES** - Student pricing |
| Startup | $99/month | Unlimited | **FULL FEATURES** - Monthly billing |
| Professional | $199/month | Unlimited | **FULL FEATURES** - Standard pricing |
| Enterprise | $499/month | Unlimited | **FULL FEATURES** - Premium pricing |

**What "Full Features" means:**
- All analysis capabilities
- Unlimited users & projects
- Full API access  
- All export formats
- Custom integrations
- White-label reports  
- Advanced security
- Unlimited data retention
- Complete support

## API Endpoints

**Consolidated API** - All endpoints use `/api/license-api?endpoint=<endpoint-name>`

### Secure License Operations
- `POST /api/license-api?endpoint=machine-fingerprint` - Generate machine fingerprint
- `POST /api/license-api?endpoint=verify-secure-license` - Verify license with hardware info
- `POST /api/license-api?endpoint=create-payment-session` - Create Stripe payment session

### Admin Operations (require X-Admin-Key header)
- `POST /api/license-api?endpoint=admin-analytics` - Get system analytics
- `POST /api/license-api?endpoint=admin-licenses` - View all licenses
- `POST /api/license-api?endpoint=admin-create-license` - Manually create license
- `POST /api/license-api?endpoint=admin-revoke-license` - Revoke license

### Webhook
- `POST /api/payment-webhook` - Stripe payment webhook (auto-creates licenses)

## Documentation

See [LICENSE_MANAGEMENT_GUIDE.md](./LICENSE_MANAGEMENT_GUIDE.md) for complete documentation.

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Node.js, Vercel Functions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Admin key-based
- **Deployment**: Vercel
