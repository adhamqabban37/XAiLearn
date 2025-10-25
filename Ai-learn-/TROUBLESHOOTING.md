# Troubleshooting Guide (Windows PowerShell)

Use this guide to diagnose and fix common issues during local development and deployment.

## Environment & Configuration

- Validate `.env.local` exists and includes required keys:
  - `GEMINI_API_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Ensure `.env.local` is not committed. Copy from `.env.example` when in doubt.

```powershell
# Print env file quickly
Get-Content .env.local
```

## Dependency & Build Issues

- Install dependencies again:

```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm install
```

- TypeScript errors:

```powershell
npm run typecheck
```

- Production build:

```powershell
npm run build
```

## Port / Server Issues

- Dev server port 9002 in use:

```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 9002 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess | Stop-Process -Force -ErrorAction SilentlyContinue
npm run dev
```

- Prod-like start on 9010:

```powershell
$env:PORT=9010; npm run start
```

## Authentication Problems (Supabase)

1. Check `.env.local` values (URL and anon key)
2. In Supabase → Auth → Settings, ensure Email/Password is enabled
3. In Supabase SQL Editor, confirm RLS policies exist for `user_courses`
4. Create a fresh user via `/signup` and test login at `/login`

## Database Checks (Supabase)

- Verify data is saved:
  - Table: `public.user_courses`
  - Columns: `user_id`, `course` (JSON), `progress` (JSON)
- If reads fail, verify RLS policies and that `auth.uid()` matches the row `user_id`.

## Images / Asset Issues

- Remote images allowed? Check `next.config.ts` `images.remotePatterns` for domains.
- SVGs:
  - `dangerouslyAllowSVG: true` with CSP is enabled; ensure SVG sources are trusted.

## API / AI Errors

- Gemini key invalid or quota exceeded → update `GEMINI_API_KEY` and retry
- Inspect API responses in browser devtools → Network tab → Response body

## Deployment Issues

### Vercel

- Configure environment variables in Vercel Project Settings → Environment Variables
- Check `vercel.json` for redirects and headers
- Redeploy after changes

### Netlify

- Ensure `@netlify/plugin-nextjs` is listed in `netlify.toml`
- Environment variables → Site settings → Build & deploy → Environment
- Check `[[redirects]]` entries

### Firebase App Hosting

- Ensure `apphosting.yaml` exists
- Use `firebase deploy --only hosting`

## Rollback (quick)

- Vercel: Re-deploy a previous commit from the dashboard (Promote an older deployment)
- Netlify: Restore an older deploy (`Deploys` tab → Roll back)
- Supabase: Restore from a Branch/Point-in-time recovery if enabled; otherwise revert schema change and re-deploy app

## Logging & Monitoring

- Add Sentry for error monitoring (recommended)
- Check hosting provider logs for server-side errors
- Supabase logs → Log Explorer

## Still stuck?

- Compare with `docs/VERIFICATION_REPORT.md` build outputs
- Re-run `.\\scripts\\pre-deploy.ps1` for automated checks
- Ask for help with the exact command output and error message
