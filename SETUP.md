# NSV Inquiries CRM — setup

Next.js app that manages `public.inquiries` in the same Supabase project as the
main NS Ventures portfolio site (`ozkhlknqrzhgsvrwjhtj`). Login is restricted to
`prateek@nsventures.in` at two layers: the middleware/layout only accept that
exact email, and the `admin_users` table gates row-level security on the
`inquiries` table itself.

## 1. Apply the database migration

Run `../nsvportfolio 1/supabase/migrations/017_inquiries_crm.sql` in the
Supabase Dashboard → SQL Editor (or via `supabase db push` if you have the CLI
linked to project `ozkhlknqrzhgsvrwjhtj`). It adds `status`, `notes`,
`updated_at` to `inquiries` and admin update/delete RLS policies.

Then run `../nsvportfolio 1/supabase/migrations/018_enable_inquiries_realtime.sql`
the same way. It adds `public.inquiries` to the `supabase_realtime` publication
so the dashboard can receive live inserts/updates/deletes over Supabase
Realtime — without it, new enquiries only appear after a manual refresh.

## 2. Create Prateek's login

1. Supabase Dashboard → Authentication → Users → **Add user**
   - Email: `prateek@nsventures.in`
   - Set a password, enable "Auto Confirm User"
2. Copy the generated user UUID.
3. Run `../nsvportfolio 1/supabase/seed-admin-prateek.sql` in the SQL Editor,
   replacing the placeholder UUID with the one you copied. This inserts him
   into `public.admin_users`, which the RLS policies check via `is_admin()`.

Without step 3, he can log in but every inquiries query will return empty
(RLS blocks it) and updates/deletes will fail.

## 3. Run the app

```bash
npm install
npm run dev
```

`.env.local` is already set with the Supabase URL/anon key (same project as
the main site) and `ADMIN_EMAIL=prateek@nsventures.in`. Only this exact email
can sign in — the login form's email field is fixed, and middleware +
dashboard layout redirect anyone else back to `/login`.

## What's included

- `/login` — email is fixed to `prateek@nsventures.in`, password-only sign-in.
- `/` — dashboard with live metrics (today/yesterday leads, converted,
  portfolio views, status breakdown) and a recent-activity feed.
- `/enquiries` — table of contact/callback enquiries with status tabs, search,
  and per-row status/notes/delete actions.
- `/portfolio` — table of portfolio-viewer access requests, same actions.
- All three routes share one Supabase Realtime subscription (see migration
  018 above), so new/updated/deleted rows appear instantly without a refresh.
