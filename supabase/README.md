# Supabase setup

1. Create a Supabase project and enable **Anonymous Sign-Ins** in Authentication.
2. Run `schema.sql` once in the Supabase SQL Editor.
3. Create the Edge Function using `functions/ingest-session/index.ts`, then deploy it with JWT verification enabled (do not use `--no-verify-jwt`).
4. Set the function secret `ALLOWED_ORIGIN` to your exact GitHub Pages origin, for example `https://your-name.github.io`. Do not add a trailing slash.
5. In `index.html`, set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` from your project’s API settings. A publishable key is designed for browser use; never use a `service_role` or secret key in the page.

The table has no client grants or public RLS policies. The browser signs in anonymously and calls the Edge Function; the function validates and bounds the aggregate payload, then uses its server-only service key to write it. Players cannot read the research records or database credentials from the game.

For production research, also enable Supabase Auth rate limits and CAPTCHA to reduce automated anonymous-signup abuse.
