The admin role is correctly assigned to your account, but the app is failing when it checks the role because the database helper function `has_role` is not executable by logged-in users. That makes the role lookup return a permissions error, so the page falls back to “No admin access”.

Plan:
1. Update the database permissions for the `has_role` helper so logged-in users can safely run the role check.
2. Keep the role data protected in the separate `user_roles` table; no roles will be stored on profiles or in browser storage.
3. Re-test the admin access flow for your user ID and confirm `/admin` loads the dashboard instead of the no-access screen.

Technical detail:
- Apply a small database migration that grants execute permission on `public.has_role(uuid, app_role)` to authenticated users, and likely anon if public read policies call it without a session.