# Deploying AI Skill Academy on Vercel

The build auto-detects Vercel (Nitro `vercel` preset), so no code changes are needed.

1. Push the code to GitHub (Lovable: GitHub button → connect repo).
2. In Vercel: **Add New → Project → import the repo**. Keep the defaults from `vercel.json`.
3. Add these Environment Variables (Production + Preview):

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | from the project `.env` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | from the project `.env` |
| `VITE_SUPABASE_PROJECT_ID` | from the project `.env` |
| `SUPABASE_URL` | same as `VITE_SUPABASE_URL` |
| `SUPABASE_PUBLISHABLE_KEY` | same as `VITE_SUPABASE_PUBLISHABLE_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | server key of the backend (see note) |
| `ADMIN_EMAILS` | `pawanmj111@gmail.com` |

4. Deploy. Add your domain under Vercel → Settings → Domains.

## Important note
Registration saving and the admin dashboard run on the server and need
`SUPABASE_SERVICE_ROLE_KEY`. Lovable Cloud does not expose this key, so on Vercel
those features only work if the backend is your own Supabase project (where you can
copy the key). The simplest fully working option is Lovable's own Publish button.
