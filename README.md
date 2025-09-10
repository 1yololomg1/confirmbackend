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

✅ **Manual License Creation** - Create licenses for specific clients  
✅ **6 License Tiers** - Student, Startup, Professional, Enterprise  
✅ **Advanced Search** - Find licenses by email, machine ID, or customer  
✅ **Analytics Dashboard** - Revenue tracking and usage statistics  
✅ **Client Management** - Track customer information and history  
✅ **License Verification API** - Programmatic license validation  
✅ **Modern UI** - Beautiful, responsive admin interface  

## License Tiers

| Tier | Price | Users | Features |
|------|-------|-------|----------|
| 🎓 Student | $49/year | 1 | Basic features, educational use |
| 🚀 Startup | $99/month | 5 | Standard features, commercial use |
| 💼 Professional | $199/month | Unlimited | Advanced features, API access |
| 🏢 Enterprise | $499/month | Unlimited | All features, 24/7 support |

## API Endpoints

### Admin Operations (require X-Admin-Key header)
- `POST /api/admin/create-license` - Create new license
- `POST /api/admin/search-licenses` - Search existing licenses  
- `POST /api/admin/revoke-license` - Revoke license
- `POST /api/admin/analytics` - Get analytics data
- `GET /api/admin/client-management` - Manage clients

### License Verification
- `POST /api/verify-license` - Basic license verification
- `POST /api/verify-license-enhanced` - Advanced verification with feature checking

## Documentation

See [LICENSE_MANAGEMENT_GUIDE.md](./LICENSE_MANAGEMENT_GUIDE.md) for complete documentation.

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Node.js, Vercel Functions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Admin key-based
- **Deployment**: Vercel
