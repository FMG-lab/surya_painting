## Summary

This PR adds Branches management to the Admin app, including UI, serverless CRUD endpoints, RLS policies, tests, and user feedback (toasts).

## Changes
- API: `api/admin/branches` (GET, POST) and `api/admin/branches/[id]` (GET, PUT, DELETE)
- UI: `pages/branches.tsx`, `components/BranchForm.tsx`, `components/ToastProvider.tsx`
- DB: RLS policies and seeds for `branches` in `sql/supabase_schema.sql`
- Tests: Cypress E2E `cypress/e2e/admin_branches.spec.ts` and API unit tests `apps/admin/tests/api/branches.test.js`

## How to test
1. Run admin locally: `cd apps/admin && npm run dev`
2. Open app and navigate to `/branches` to try add/edit/delete (in dev, endpoints fall back to fixtures)
3. Run Cypress tests: `cd apps/admin && npm run cypress:run -- --spec "cypress/e2e/admin_branches.spec.ts"`
4. Run API tests: `cd apps/admin && npm run test:api`

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated (README, CHANGELOG)
- [ ] Reviewed RBAC / RLS policies

