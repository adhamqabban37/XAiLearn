# Rollback Procedures

This document outlines safe rollback strategies for deployments and data.

## Principles

- Prefer rolling back via deployment history (fast, low-risk)
- Keep environment variables stable when rolling back
- For data changes, prefer forward fixes; use restores only when necessary

## App Rollback

### Vercel

1. Open your project in Vercel dashboard
2. Go to `Deployments`
3. Find the last good deployment (green check)
4. Click `Promote to Production`
5. Verify status and smoke test main routes

CLI alternative:

- Re-deploy a specific commit:

```powershell
# From a local checkout of the desired commit
git checkout <commit-sha>
vercel --prod
```

### Netlify

1. Open your site → `Deploys`
2. Scroll to previous successful deploy
3. Click `Rollback to this` (or `Publish deploy`)
4. Verify status and smoke test

CLI alternative:

```powershell
# Deploy a previous folder build if you have it locally
netlify deploy --prod --dir=.next
```

### Firebase App Hosting

1. Use Hosting versions in Firebase Console to revert to previous version
2. Or re-deploy from a known-good commit:

```powershell
git checkout <commit-sha>
firebase deploy --only hosting
```

## Environment Configuration Rollback

- If a new environment variable breaks prod:
  1. Revert its value to the previous known-good
  2. Re-deploy the app (if needed)
  3. Avoid deleting variables; prefer toggling feature flags

## Database Rollback (Supabase)

- If a schema change breaks the app:

  1. Revert the migration SQL (apply inverse change)
  2. Re-run the app and verify
  3. If data was corrupted, consider restore options below

- Restore options:

  - Point-in-time recovery (if enabled on your plan)
  - Manual restore from a backup export

- Minimal-impact approach:
  - Create a new table with corrected schema
  - Migrate data with SQL `INSERT INTO .. SELECT ..`
  - Swap references in the app

## Post-Rollback Verification

- Run smoke tests:

```powershell
$env:BASE_URL="https://your-domain.com"
node scripts/smoke.mjs
```

- Manually verify:
  - `/` loads
  - `/login` and `/signup` work
  - `/dashboard` and `/lesson` function
- Check logs for errors

## Recordkeeping

- Document:
  - What was rolled back (commit/URL)
  - Why it was rolled back
  - Next steps to fix forward
