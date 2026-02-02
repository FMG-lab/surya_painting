Surya Painting — Admin Dashboard (Next.js)

Setup
1. cd apps/admin
2. cp ../../.env.example .env.local
3. Fill `.env.local` with:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
4. npm install
5. npm run dev

Notes
- Create a Supabase Auth user for Super Admin and create a row in `users` table with `role = 'super_admin'` and `id` equal to the auth user's uid.
- The admin endpoints for verification (`/api/admin/payments/verify`) were added at the repo root under `api/` and will be available when deployed to Vercel.
- For viewing proof images stored in private Supabase Storage, this project includes a serverless endpoint `/api/admin/payments/proof` that returns signed URLs (Super Admin only). Set `SUPABASE_PROOF_BUCKET` env var if you use a different bucket name (default `payment_proofs`).
- Batch verification endpoint available: `/api/admin/payments/verify-batch` (body: { payment_ids: [] }).

PWA
- The admin app includes a `manifest.json` and a minimal `service-worker.js` to enable basic PWA behavior. Replace the placeholder icons in `public/icons/` with real PNGs for best compatibility.

E2E Tests
- This repo includes Cypress tests for admin flows. To run tests:
  - Install dependencies: `npm install`
  - Start dev server: `npm run dev`
  - In another terminal run: `npx cypress open` or `npm run cypress:open`
- You can configure test credentials via environment variables `SUP_ADMIN_EMAIL` and `SUP_ADMIN_PASSWORD` for convenience (Cypress reads them via `Cypress.env()`).
