# AI Learn 2.0

Next.js 15 + Supabase project for AI-powered course generation and learning.

• App Router • Tailwind • Genkit • AVIF/WebP images • Custom error pages • Redirects

## Quick Start (Windows PowerShell)

```powershell
git clone <your-repo-url>
cd Ai-learn-
npm install
Copy-Item .env.example .env.local
# Edit .env.local and set: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, GEMINI_API_KEY
npm run dev
```

Open http://localhost:9002

If the port is busy:

```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 9002 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess | Stop-Process -Force -ErrorAction SilentlyContinue
```

## Supabase schema (user_courses)

## Supabase schema (user_courses)

Execute this SQL in Supabase SQL Editor:

```sql
create table if not exists public.user_courses (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users(id) on delete cascade,
	course jsonb not null,
	progress jsonb not null default '[]'::jsonb,
	saved_at timestamptz not null default now(),
	last_accessed_at timestamptz not null default now()
);

alter table public.user_courses enable row level security;

create policy "users read own courses"
	on public.user_courses for select
	using (auth.uid() = user_id);

create policy "users insert own courses"
	on public.user_courses for insert
	with check (auth.uid() = user_id);

create policy "users update own courses"
	on public.user_courses for update
	using (auth.uid() = user_id);
```

## End-to-end test steps (Windows PowerShell)

1. Start dev server:

```powershell
npm run dev
```

2. Sign up a new user in the app UI. Verify authentication succeeds.

3. Save a course from the home/content form. Then open Dashboard; you should see the new course listed.

4. Open a lesson and complete it. Refresh Dashboard to see progress update; also check `user_courses.progress` JSON in Supabase.

5. RLS sanity check: While signed in as User A, ensure you don't see User B's courses. In SQL Editor, you can manually query as service role to verify rows are partitioned by `user_id`.

Optional helper:

```powershell
node ./scripts/supabase-selfcheck.ts
```

This prints basic auth state and a head count query against `user_courses` to confirm RLS behavior.

## Genkit flows and API routes

This project exposes Genkit flows via Next.js App Router endpoints using the @genkit-ai/next adapter:

- POST /api/genkit/analyzeDocument
- POST /api/genkit/auditCourse
- POST /api/genkit/generateQuizQuestions
- POST /api/genkit/suggestMissingContent

During local flow development, you can also run the Genkit dev server:

- npm run genkit:dev (or genkit:watch)

## 🚀 Production Deployment

### ✅ Deployment Status: **PRODUCTION READY**

This project has been verified and is ready for production deployment. See detailed verification in:

- **Quick Summary:** `DEPLOYMENT_SUMMARY.md`
- **Full Report:** `docs/VERIFICATION_REPORT.md`
- **Deployment Guide:** `docs/DEPLOYMENT_READINESS.md`

### Quick Deploy

#### Vercel (Recommended)

```bash
# Automated deployment with checks
.\scripts\deploy-vercel.ps1

# Or direct deploy
npx vercel --prod
```

#### Netlify

```bash
npx netlify deploy --prod
```

#### Firebase App Hosting

```bash
firebase deploy --only hosting
```

### Pre-Deployment Checks

```bash
# Run automated verification
.\scripts\pre-deploy.ps1

# Or manually
npm run typecheck
npm run build
npm run start
```

### Environment Variables for Production

Set these in your hosting platform dashboard:

- `GEMINI_API_KEY` - Your Gemini AI API key
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Post-Deployment

After deploying, test these routes:

- `/` - Homepage with PDF upload
- `/login` - Authentication
- `/signup` - User registration
- `/dashboard` - User dashboard
- `/lesson` - Lesson view

Run the smoke test:

```bash
$env:BASE_URL="https://your-domain.com"
node scripts/smoke.mjs
```

### Build Statistics

- Build time: ~34 seconds
- Startup time: ~3.4 seconds
- Bundle optimized with AVIF/WebP image support
- Code splitting and lazy loading enabled

For complete deployment documentation, see `docs/DEPLOYMENT_READINESS.md`.

## Developer docs

- Setup (full): `SETUP.md`
- Onboarding runbook: `ONBOARDING.md`
- Troubleshooting guide: `TROUBLESHOOTING.md`
- Rollback procedures: `ROLLBACK.md`
- Documentation index: `DOCUMENTATION_INDEX.md`
