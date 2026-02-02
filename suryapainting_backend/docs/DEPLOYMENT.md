# Deployment ke Vercel

## Steps untuk Deploy di Vercel Dashboard

1. **Login ke Vercel** (https://vercel.com)
   - Gunakan akun GitHub yang sudah terhubung

2. **Setup Environment Variables** di Vercel Dashboard:
   - Buka Project Settings → Environment Variables
   - Tambahkan variable berikut dengan **sensitive** flag:
   
   ```
   DATABASE_URL = postgres://postgres.nsdidjnstgtcrbedliva:wgTVcTjH82SL9b9c@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
   SUPABASE_URL = https://nsdidjnstgtcrbedliva.supabase.co
   SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   NODE_ENV = production
   ```

3. **Deploy dari Dashboard**
   - Vercel akan otomatis trigger deployment ketika ada push ke GitHub main branch
   - Atau manual: buka project di Vercel → klik "Deploy" button

4. **Tunggu Build Selesai**
   - Build time biasanya 2-3 menit untuk Node.js project
   - Akan melihat status "Ready" kalau sukses

5. **Test Endpoint**
   ```bash
   curl https://surya-painting-api-production.vercel.app/health
   ```

## Environment Variables di Supabase

Pastikan Anda sudah mendapatkan:
- **DATABASE_URL**: Dari Supabase Dashboard → Settings → Database
- **SUPABASE_URL**: Dari Supabase Dashboard → Settings → API
- **SUPABASE_SERVICE_ROLE_KEY**: Dari Supabase Dashboard → Settings → API (secret key)

## Vercel Project URL

Setelah deployment sukses, API akan tersedia di:
```
https://<project-name>.vercel.app
```

## API Endpoints (Vercel)

- `GET /health` — Health check
- `GET /api/branches` — List all branches
- `POST /api/branches` — Create branch
- `GET /api/branches/:id` — Get branch by ID
- `PUT /api/admin/branches/:branchId` — Update branch
- `DELETE /api/admin/branches/:branchId` — Delete branch
- `GET /api/admin/staff` — List staff
- `POST /api/admin/staff` — Create staff
- `POST /api/bookings` — Create booking
- `GET /api/bookings/status?code=XXXX` — Get booking status
- `GET /api/payments/banks` — Get payment bank list
- `POST /api/payments/verify` — Verify payment
- `POST /api/payments/notify` — Payment notification (webhook)
- `PUT /api/technicians/tasks/:taskId` — Update task progress

## Notes

- Maximum function duration: 10 seconds (Hobby plan limit)
- Database queries should complete within 5 seconds for safety margin
- All endpoints return JSON responses with CORS headers enabled
- SSL mode required for Supabase connection (production)
