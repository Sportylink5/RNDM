RNDM Chat v27.3 — Owner Email Management

- Owner-only email management in Admin Center.
- Current email is fetched server-side through Supabase Edge Function owner-user-email.
- Email update is performed through Supabase Auth Admin API only after JWT + owner role verification.
- Changed email is marked confirmed immediately by the administrative action.
- Every change is written to admin_audit as owner_change_email.
- No service-role or secret keys are stored in frontend files.
- Cache/service-worker version: v27.3.
- No .sql files are included in the package.
