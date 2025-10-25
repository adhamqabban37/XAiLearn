# New Developer Onboarding

Welcome! This runbook gets you productive fast.

## 0) Overview

- Stack: Next.js 15 (App Router), React 18, TypeScript, Tailwind, Supabase, Genkit
- Auth/Storage: Supabase Auth + `public.user_courses`
- AI endpoints: Next.js API routes under `/api/genkit/*`

## 1) Install prerequisites

- Node.js 20.x and npm 10.x
- VS Code + recommended extensions (ESLint, Prettier, Tailwind CSS IntelliSense)

Verify:

```powershell
node -v
npm -v
```

## 2) Clone + install

```powershell
git clone <your-repo-url>
cd Ai-learn-
npm install
```

## 3) Configure environment

```powershell
Copy-Item .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
GEMINI_API_KEY=your-gemini-api-key
```

## 4) Supabase setup

- Enable Email/Password auth
- Run schema from `SETUP.md` to create `user_courses` + RLS
- Optional: `node .\\scripts\\supabase-selfcheck.ts`

## 5) Run locally

```powershell
npm run dev
```

Open http://localhost:9002

If port is busy:

```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 9002 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess | Stop-Process -Force -ErrorAction SilentlyContinue
```

## 6) First-time E2E sanity

1. Sign up at `/signup`, then log in at `/login`
2. Create a course from the home page (upload PDF or paste text)
3. Confirm it appears on `/dashboard`
4. Open `/lesson`, complete a lesson, refresh dashboard → progress updates
5. Check Supabase Table Editor → `public.user_courses` rows exist

## 7) Production-like check

```powershell
npm run typecheck
npm run build
$env:PORT=9010; npm run start
```

Visit http://localhost:9010 and test the main routes.

## 8) Dev scripts cheat-sheet

- `npm run dev` — start dev server on port 9002
- `npm run typecheck` — TypeScript without emitting
- `npm run build` — production build
- `npm run start` — start production server (uses default port 3000 unless overridden)
- `npm run start:prod` — start on port 9010
- `npm run genkit:dev` — Genkit dev server
- `npm run smoke` — smoke test against http://localhost:9010

## 9) Deploy

- Quick path: `.\\scripts\\deploy-vercel.ps1`
- Or follow docs in `docs/DEPLOYMENT_READINESS.md`

## 10) Troubleshooting

- See `TROUBLESHOOTING.md` for common fixes
- For rollbacks, see `ROLLBACK.md`

Happy building! 🚀
