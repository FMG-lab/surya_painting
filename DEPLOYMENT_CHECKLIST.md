# ✅ Vercel Deployment Checklist

## Pre-Deployment ✓
- [x] Backend code complete (11 API endpoints)
- [x] Database migration script ready
- [x] Sample data seeded (6 branches)
- [x] Environment variables configured
- [x] All code pushed to GitHub (main branch)
- [x] Deployment guide created (VERCEL_DEPLOY_GUIDE.md)

## Deployment Checklist

### Step 1: Vercel Setup
- [ ] Login ke https://vercel.com/dashboard
- [ ] Import GitHub repo: `FMG-lab/surya_painting`
- [ ] Vercel akan auto-detect Node.js project

### Step 2: Environment Variables (CRITICAL)
- [ ] Add `DATABASE_URL`
- [ ] Add `SUPABASE_URL`
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Add `NODE_ENV` = production
- [ ] **Mark all as Sensitive ✓**
- [ ] **Mark all for Production ✓**

### Step 3: Deploy
- [ ] Vercel auto-redeploys after env vars saved
- [ ] Wait for build to finish (2-3 minutes)
- [ ] Check deployment status: **Ready** ✓

### Step 4: Verification
- [ ] Test `/health` endpoint
- [ ] Test `/api/branches` endpoint
- [ ] Test `/api/payments/banks` endpoint
- [ ] Verify CORS headers present

### Step 5: Post-Deployment
- [ ] Run migration: `npm run migrate` (via Vercel CLI if needed)
- [ ] Check database schema synced
- [ ] Update frontend API base URL to Vercel URL
- [ ] Test full integration with Flutter app

---

## 📝 Important Notes

**DATABASE_URL Format:**
```
postgres://postgres.nsdidjnstgtcrbedliva:wgTVcTjH82SL9b9c@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

**Final API Base URL:**
```
https://<your-project-name>.vercel.app
```

**Endpoints Ready:**
- GET `/health` → Health check
- GET `/api/branches` → List branches (6 seeded)
- GET `/api/payments/banks` → List payment options
- POST `/api/bookings` → Create booking
- + 10 more endpoints (see VERCEL_DEPLOY_GUIDE.md)

---

**Backend 100% ready for Vercel deployment!** 🚀
