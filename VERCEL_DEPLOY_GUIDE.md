# Deploy Vercel - Step by Step Guide

## 🚀 Step 1: Login & Import Repository

1. **Buka Vercel Dashboard**
   - Kunjungi: https://vercel.com/dashboard
   - Login dengan GitHub account

2. **Add New Project**
   - Klik "Add New..." → "Project"
   - Pilih "Import Git Repository"
   - Cari dan pilih: `FMG-lab/surya_painting`
   - Klik "Import"

## ⚙️ Step 2: Configure Environment Variables

**Pada halaman Project Settings:**

1. Klik **"Settings"** tab
2. Pilih **"Environment Variables"** (di sidebar kiri)
3. Tambahkan 4 variables berikut dengan flag **Sensitive** checked:

```
Name: DATABASE_URL
Value: postgres://postgres.nsdidjnstgtcrbedliva:wgTVcTjH82SL9b9c@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
Production: ✓ checked
Sensitive: ✓ checked

Name: SUPABASE_URL
Value: https://nsdidjnstgtcrbedliva.supabase.co
Production: ✓ checked

Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zZGlkam5zdGd0Y3JiZWRsaXZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTgxMjgwMSwiZXhwIjoyMDg1Mzg4ODAxfQ.Gta-yOdy11bWbgwNegDLhtoMRWKOUy1wJ1UCTJJDdyI
Production: ✓ checked
Sensitive: ✓ checked

Name: NODE_ENV
Value: production
Production: ✓ checked
```

4. Klik **"Save"** setelah setiap variable

## 🔨 Step 3: Deploy

**Setelah environment variables tersimpan:**

1. Kembali ke **"Deployments"** tab
2. Klik **"Redeploy"** button (jika sudah ada deploy sebelumnya)
   - ATAU Vercel akan otomatis deploy saat Anda save env vars
3. Tunggu build selesai (biasanya 2-3 menit)
4. Tunggu status berubah menjadi **"Ready"** dengan badge hijau

## ✅ Step 4: Test Deployment

Setelah status "Ready", test endpoints:

```bash
# Ganti VERCEL_URL dengan URL yang Anda dapat
VERCEL_URL="https://YOUR-PROJECT.vercel.app"

# Test health check
curl $VERCEL_URL/health

# Test branches endpoint
curl $VERCEL_URL/api/branches

# Test payment banks
curl $VERCEL_URL/api/payments/banks

# Create booking (POST)
curl -X POST $VERCEL_URL/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"guest_name":"John Doe","guest_phone":"08123456789","branch_id":"1"}'
```

## 🎯 Project URL

Setelah deploy successful, API tersedia di:
```
https://<your-project-name>.vercel.app
```

## 📝 Environment Variables Reference

| Variable | Deskripsi | Value |
|----------|-----------|-------|
| DATABASE_URL | Supabase PostgreSQL pooler connection | Dari Supabase Settings |
| SUPABASE_URL | Supabase project URL | https://nsdidjnstgtcrbedliva.supabase.co |
| SUPABASE_SERVICE_ROLE_KEY | Service role API key | Dari Supabase Settings → API |
| NODE_ENV | Environment | production |

## 🔗 API Endpoints (Live)

```
GET     /health                          — Health check
GET     /api/branches                    — List branches
POST    /api/branches                    — Create branch
GET     /api/branches/:id                — Get branch by ID
PUT     /api/admin/branches/:branchId    — Update branch
DELETE  /api/admin/branches/:branchId    — Delete branch
GET     /api/admin/staff                 — List staff
POST    /api/admin/staff                 — Create staff
POST    /api/bookings                    — Create booking
GET     /api/bookings/status?code=XXX    — Get booking status
GET     /api/payments/banks              — Get bank list
POST    /api/payments/verify             — Verify payment
POST    /api/payments/notify             — Payment webhook
PUT     /api/technicians/tasks/:taskId   — Update task progress
```

## ⚠️ Troubleshooting

**Error: "The server does not support SSL connections"**
- Vercel menggunakan direct Supabase connection, bukan pooler
- Environment variables sudah correct
- Check DATABASE_URL di Vercel settings

**Error: "relation 'branches' does not exist"**
- Run migration di Vercel: `npx vercel exec scripts/migrate.js`
- ATAU klik "Redeploy" untuk trigger build fresh

**Build failed**
- Check build logs di Vercel dashboard
- Pastikan semua dependencies terinstall (`npm install` dalam build)
- Verifikasi `.env` variables sudah set

## ✨ Next Steps

1. Frontend akan connect ke: `https://<your-project>.vercel.app/api/`
2. Update Flutter app API base URL
3. Test end-to-end integration

---

**Backend deployment ke Vercel complete! 🎉**
