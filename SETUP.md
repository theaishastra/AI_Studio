# Sai Kumar Studio - Full Stack Setup Guide

## ✅ What's Been Done

1. **Database Seeded**: 4 site pages, 45 categories, and 218 products have been loaded
2. **Backend Configured**: FastAPI is ready with all routes and CORS enabled
3. **Frontend Updated**: All pages are ready to fetch products from the API

## 🚀 Quick Start

### Step 1: Start the Backend Server

**Windows (PowerShell):**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or use the startup script:
```powershell
cd backend
.\start.ps1
```

**Linux/Mac:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will start at: **http://localhost:8000**

### Step 2: Verify Backend is Running

Open in browser: http://localhost:8000/api/health

Should show: `{"status":"ok"}`

### Step 3: Check API Documentation

Open: http://localhost:8000/api/docs

This shows all available API endpoints

### Step 4: Start Frontend Server

You can use any local server. Option A (if you have Python 3):

```bash
# From the project root directory
python -m http.server 5500
```

Then open: **http://localhost:5500**

Option B (if you have Node.js):
```bash
npx http-server -p 5500
```

## 🔍 Verify Products are Loading

### Test API Endpoints

1. **Gifts Catalog**
   ```
   GET http://localhost:8000/api/catalog/gifts
   ```

2. **Photography Catalog**
   ```
   GET http://localhost:8000/api/catalog/photography
   ```

3. **Corporate Gifts Catalog**
   ```
   GET http://localhost:8000/api/catalog/corporate
   ```

4. **Studio Services Catalog**
   ```
   GET http://localhost:8000/api/catalog/studio
   ```

### Test Frontend Pages

1. **Homepage**: http://localhost:5500/index.html
   - Should show Featured Products from all categories

2. **Gifts Page**: http://localhost:5500/gifts.html
   - Should show Bestseller products and categories
   - Click on categories to filter products

3. **Photography Page**: http://localhost:5500/photography.html
   - Should show Photography packages and services

4. **Corporate Gifts**: http://localhost:5500/corporate.html
   - Should show Corporate gift options

5. **Studio Services**: http://localhost:5500/studio.html
   - Should show Studio services and products

## 🛠️ Database Management

### Re-seed Database (if needed)

```bash
cd backend
.\venv\Scripts\Activate.ps1
python -m app.seed
```

### View Database (using Supabase Dashboard)

Go to: https://app.supabase.com/project/xdjrtgfynnkmslpanmpb/editor

- Database: `postgres`
- Tables: `site_pages`, `categories`, `products`, `media`, `users`

## 📋 Default Admin Account

- **Email**: owner@saikumarstudio.in
- **Password**: ChangeMe@2026
- **Admin Panel**: http://localhost:8000/admin/dashboard.html (after setting up admin frontend)

## ⚙️ Environment Configuration

All settings are in `backend/.env`:
- Database connection (Supabase PostgreSQL)
- Cloudinary API keys (for image hosting)
- SMTP settings (for email OTP)
- Razorpay keys (for payments)

## 🎨 Project Structure

```
project-root/
├── index.html              # Homepage
├── gifts.html             # Gift shop
├── photography.html       # Photography services
├── studio.html           # Studio services
├── corporate.html        # Corporate gifts
├── css/                  # Stylesheets
├── js/                   # Frontend JavaScript
│   ├── gifts.js         # Gift page logic
│   ├── photography.js   # Photography page logic
│   ├── index-2.js       # Homepage logic
│   └── shared/          # Shared utilities
├── backend/             # FastAPI backend
│   ├── app/
│   │   ├── main.py      # FastAPI app setup
│   │   ├── models.py    # Database models
│   │   ├── routers/     # API endpoints
│   │   ├── seed.py      # Seed script
│   │   └── .env         # Configuration
│   └── requirements.txt  # Python dependencies
└── admin/               # Admin dashboard (separate)
```

## 🐛 Troubleshooting

### Products Not Showing on Gifts Page

1. ✅ Verify backend is running: `curl http://localhost:8000/api/health`
2. ✅ Check database has products:
   ```
   GET http://localhost:8000/api/catalog/gifts
   ```
3. ✅ Open browser console (F12) and check for errors
4. ✅ Verify frontend has correct API base URL (should be http://localhost:8000)

### Images Not Loading

- All images are hosted on Cloudinary CDN
- Check internet connection
- Verify Cloudinary is responsive

### CORS Errors

- Ensure backend is running on port 8000
- Check `CORS_ORIGINS` in `.env` includes your frontend URL
- Current CORS allows: `http://localhost:5500, http://127.0.0.1:5500`

### Database Connection Issues

- Verify Supabase is accessible: https://supabase.com
- Check DATABASE_URL in `.env` is correct
- Run `python -m app.seed` again to reinitialize

## 📱 Features Implemented

✅ Product catalog with categories
✅ Product search and filtering
✅ Shopping cart (localStorage-based)
✅ Wishlist functionality
✅ Product customization preview
✅ Mobile-responsive design
✅ User authentication ready (OTP-based)
✅ Order management backend
✅ Admin dashboard ready

## 🚀 Next Steps

1. Test all pages and verify products display correctly
2. Test shopping cart functionality
3. Configure payment gateway (Razorpay) if needed
4. Set up email service (SMTP) for OTP
5. Deploy to production

---

Need help? Check console errors (F12) for specific issues.
