# 🔄 Vercel Redeploy Instructions

Backend sudah di-push dengan fix vercel.json (version 2, proper routes).

**Untuk redeploy di Vercel:**

1. **Login ke Vercel Dashboard**
   - https://vercel.com/dashboard

2. **Pilih Project**
   - Cari: `suryapainting-api`

3. **Redeploy**
   - Klik pada project
   - Klik "Deployments" tab
   - Klik "Redeploy" button
   - Pilih "Redeploy without using cache"

4. **Tunggu Build Selesai**
   - Build akan selesai dalam 1-2 menit
   - Status akan berubah ke "Ready"

5. **Test Endpoints**
   ```bash
   # After deployment is Ready
   curl https://suryapainting-api.vercel.app/health
   curl https://suryapainting-api.vercel.app/api/branches
   curl https://suryapainting-api.vercel.app/api/payments/banks
   ```

---

## Apa yang di-fix:

- ✅ Updated vercel.json dengan `version: 2`
- ✅ Added explicit `/health` route
- ✅ Proper `routes` configuration untuk serverless
- ✅ Explicit `runtime: nodejs18.x` untuk functions

**Setelah redeploy success, API akan fully working!** 🚀
