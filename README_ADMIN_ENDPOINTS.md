Surya Painting — Admin Endpoints (Local dev / Vercel)

Overview
- Two serverless endpoints implemented for Super Admin operations:
  - POST /api/admin/payments/verify  -> verify payment and assign queue (body: { payment_id })
  - POST /api/admin/bookings/assign-queue -> assign queue manually (body: { booking_id })
  - GET /api/admin/payments/proof?payment_id=<id> -> return signed URL for proof (Super Admin only); bucket from `SUPABASE_PROOF_BUCKET` (default `payment_proofs`)
  - POST /api/admin/payments/verify-batch -> batch verify payments (body: { payment_ids: [..] })
  - GET /api/admin/branches -> list branches (Super Admin; Branch Manager sees their branch)
  - POST /api/admin/branches -> create branch (Super Admin only)
  - PUT /api/admin/branches/<id> -> update branch (Super Admin only)
  - DELETE /api/admin/branches/<id> -> delete branch (Super Admin only)

Environment
- Set the following env vars in Vercel or locally via .env:
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY

Authentication
- Endpoints expect an Authorization: Bearer <access_token> header. Use a Supabase-authenticated Super Admin access token.
- Only users with `role = 'super_admin'` (in `users` table) are allowed.

Testing (curl examples)
1) Verify payment
curl -X POST https://your-deployment.vercel.app/api/admin/payments/verify \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"payment_id":"<PAYMENT_UUID>"}'

2) Assign queue manually
curl -X POST https://your-deployment.vercel.app/api/admin/bookings/assign-queue \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"booking_id":"<BOOKING_UUID>"}'

Notes
- The heavy lifting (atomicity) is done inside Postgres RPCs (`verify_payment`, `assign_queue_for_booking`).
- Keep Supabase Service Role key secret; set it only in server environment variables.
