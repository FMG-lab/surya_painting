# Changelog

## Unreleased

### Added
- Feature: Branches management UI in admin (list/add/edit/delete) with client-side validation and confirmation modal. ✅
- API: CRUD serverless endpoints for branches (`/api/admin/branches`, `/api/admin/branches/:id`) with dev-mode fixture fallback. 🔁
- Security: Row-Level Security (RLS) policies for `branches` and additional seed data. 🔐
- UX: Global Toast notifications for success/error feedback. 🔔
- Tests: Simple server-side API unit tests for branches fixture behavior and Cypress E2E tests for branch flows. 🧪

### Changed
- Updated `README_ADMIN_ENDPOINTS.md` with branches endpoints documentation.

### Notes
- Dev-mode endpoints fall back to `apps/admin/public/fixtures/branches.json` when Supabase credentials are not provided.
