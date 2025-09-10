# CONFIRM License Management System

## Overview

This is a comprehensive license management system that allows you to manually assign licenses to clients based on their payment tier. The system provides a modern web interface for administrators to create, manage, and track licenses with detailed analytics and client management features.

## Features

### 🎯 Core Features
- **Manual License Creation**: Create licenses for specific clients with custom expiration dates
- **Multi-tier Licensing**: Support for 6 different license tiers with distinct feature sets
- **License Verification**: API endpoint for applications to verify license validity
- **Client Management**: Track customer information and license history
- **Analytics Dashboard**: Comprehensive analytics on license usage and revenue
- **Search & Filter**: Advanced search capabilities for license management

### 🏆 License Tiers - **ALL CUSTOMERS GET FULL FEATURES!**

> **Important**: All paying customers receive access to ALL features regardless of their payment tier. Tiers are for pricing only, not feature restrictions.

#### 1. Student License - $49/year
- **FULL FEATURES INCLUDED**
- All analysis capabilities
- Unlimited users and projects
- Full API access
- All export formats
- Complete feature set
- *Student pricing with professional features*

#### 2. Startup License - $99/month
- **FULL FEATURES INCLUDED**
- All analysis capabilities
- Unlimited users and projects
- Full API access
- All export formats
- Complete feature set
- *Monthly billing option*

#### 3. Professional License - $199/month or $1,999/year
- **FULL FEATURES INCLUDED**
- All analysis capabilities
- Unlimited users and projects
- Full API access
- All export formats
- Complete feature set
- *Standard pricing tier*

#### 4. Enterprise License - $499/month or $4,999/year
- **FULL FEATURES INCLUDED**
- All analysis capabilities
- Unlimited users and projects
- Full API access
- All export formats
- Complete feature set
- *Premium pricing tier*

### ✅ What "Full Features" Includes:
- **Analysis**: Basic, Advanced, Premium, Enterprise-level analysis
- **Users**: Unlimited users and projects
- **API**: Full API access with unlimited calls
- **Support**: Email, priority, and phone support
- **Exports**: All formats (PDF, Excel, CSV, JSON, XML, PowerBI, Tableau)
- **Integrations**: Custom integrations and SSO/LDAP
- **Branding**: White-label reports and custom branding
- **Security**: Advanced security and compliance reports
- **Data**: Unlimited data retention
- **Training**: Custom training and dedicated support

## API Endpoints

### Admin Endpoints (Require X-Admin-Key header)

#### Create License
```
POST /api/admin/create-license
```
Creates a new license for a client.

**Request Body:**
```json
{
  "machine_id": "unique-machine-identifier",
  "customer_email": "client@example.com",
  "customer_name": "John Doe",
  "organization": "Acme Corp",
  "license_type": "professional",
  "expires_at": "2025-12-31",
  "notes": "Custom license for enterprise client"
}
```

#### Search Licenses
```
POST /api/admin/search-licenses
```
Search and filter existing licenses.

**Request Body:**
```json
{
  "search": "john@example.com",
  "type": "professional",
  "status": "active"
}
```

#### Revoke License
```
POST /api/admin/revoke-license
```
Revoke an existing license.

**Request Body:**
```json
{
  "machine_id": "machine-to-revoke",
  "reason": "Payment failed"
}
```

#### Analytics
```
POST /api/admin/analytics
```
Get comprehensive analytics about license usage.

#### Client Management
```
GET /api/admin/client-management?search=john
POST /api/admin/client-management
PUT /api/admin/client-management
DELETE /api/admin/client-management
```

### Public Endpoints

#### Verify License
```
POST /api/verify-license
```
Verify if a license is valid and active.

**Request Body:**
```json
{
  "machine_id": "machine-identifier",
  "product": "confirm_analyzer",
  "version": "1.0.0"
}
```

#### Enhanced License Verification
```
POST /api/verify-license-enhanced
```
Advanced license verification with feature checking.

**Request Body:**
```json
{
  "machine_id": "machine-identifier",
  "product": "confirm_analyzer",
  "version": "1.0.0",
  "feature_check": ["api_access", "max_users", "advanced_analytics"]
}
```

## Admin Interface

The admin interface is available at `/admin.html` and provides:

### 📝 Create License Tab
- Visual license tier comparison
- Form with all necessary fields
- Auto-expiration date setting based on license type
- Success/error feedback

### 🔍 Manage Licenses Tab
- Search by customer email, name, or machine ID
- Filter by license type and status
- Table view with all license details
- Inline revoke functionality

### ✅ Verify License Tab
- Quick license verification
- Detailed feature information display
- Expiration warnings

### 📊 Analytics Tab
- Total licenses overview
- Revenue estimates
- License type distribution
- Expiring licenses alerts

## Environment Variables

Required environment variables:

```env
# Supabase Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Admin Security
ADMIN_SECRET_KEY=your-secure-admin-key

# Optional: SendGrid for email notifications
SENDGRID_API_KEY=your-sendgrid-key
```

## Database Schema

The system uses Supabase with the following main table:

### licenses
- `id` (uuid, primary key)
- `machine_id` (text, unique)
- `customer_email` (text)
- `customer_name` (text)
- `organization` (text)
- `license_type` (text)
- `status` (text: 'active', 'expired', 'cancelled')
- `expires_at` (timestamp)
- `features` (jsonb)
- `notes` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `last_verified_at` (timestamp)
- `verification_count` (integer)

### license_audit_log
- `id` (uuid, primary key)
- `license_id` (uuid, foreign key)
- `action` (text)
- `details` (jsonb)
- `created_at` (timestamp)

## Security Features

- **Admin Key Protection**: All admin endpoints require a secret key
- **CORS Configuration**: Properly configured cross-origin requests
- **Input Validation**: Comprehensive validation of all inputs
- **Audit Logging**: All license operations are logged
- **Rate Limiting**: Built-in protection against abuse

## Usage Examples

### Creating a License for a New Client

1. Open the admin interface at `/admin.html`
2. Enter your admin key
3. Fill in the client details:
   - Machine ID (provided by client)
   - Customer email and name
   - Select appropriate license tier
   - Set expiration date (auto-suggested based on tier)
4. Click "Create License"

### Searching for Client Licenses

1. Go to the "Manage Licenses" tab
2. Enter admin key
3. Use search filters:
   - Search by email, name, or machine ID
   - Filter by license type or status
4. Click "Search" to view results
5. Use "View" or "Revoke" buttons as needed

### Verifying a License (API)

```javascript
const response = await fetch('/api/verify-license', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    machine_id: 'client-machine-id',
    product: 'confirm_analyzer',
    version: '1.0.0'
  })
});

const result = await response.json();
if (result.status === 'valid') {
  console.log('License is valid');
  console.log('Expires:', result.expires_at);
  console.log('Features:', result.features);
} else {
  console.log('License invalid:', result.message);
}
```

## Deployment

This system is designed to work with Vercel and Supabase:

1. **Set up Supabase database** with the required tables
2. **Configure environment variables** in your deployment platform
3. **Deploy to Vercel** using `npm run deploy`
4. **Access admin interface** at `your-domain.com/admin.html`

## Support and Maintenance

### Regular Tasks
- Monitor license expiration dates
- Review analytics for usage patterns
- Update client information as needed
- Audit license compliance

### Troubleshooting
- Check environment variables if endpoints fail
- Verify Supabase connection and permissions
- Review audit logs for suspicious activity
- Monitor rate limiting and usage patterns

## Future Enhancements

Potential improvements to consider:

1. **Email Notifications**: Automatic expiration warnings
2. **Bulk Operations**: Import/export license data
3. **Advanced Reporting**: Custom report generation
4. **Integration APIs**: Connect with payment processors
5. **Mobile Interface**: Responsive design improvements
6. **Multi-tenant Support**: Support for multiple organizations

---

For technical support or questions about this license management system, please contact your system administrator.