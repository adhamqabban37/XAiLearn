# AI Learning Platform — Setup Guide (Supabase + Next.js)

This guide helps a new developer set up the project locally on Windows using PowerShell, configure Supabase, and run the app end-to-end.

## Prerequisites

- Node.js 20.x and npm 10.x
- Git
- A Supabase project (free tier is fine)
- A Google Gemini API key
- Recommended: VS Code with these extensions:
  - ESLint, Prettier, Tailwind CSS IntelliSense

Verify versions:

```powershell
node -v
npm -v
```

## 1) Clone and install

```powershell
git clone <your-repo-url>
cd Ai-learn-
npm install
```

## 2) Configure environment variables

Copy the template and fill values:

```powershell
Copy-Item .env.example .env.local
```

Edit `.env.local` and set:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
GEMINI_API_KEY=your-gemini-api-key
```

Notes:

- Do not commit `.env.local`.
- Remove any leftover Firebase variables; they’re not used.

## 3) Set up Supabase

In Supabase Dashboard:

1. Go to Authentication → Settings → Enable Email/Password
2. Get your Project URL and anon key from Project Settings → API
3. Open SQL Editor and run this schema (creates `user_courses` + RLS):

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

Optional quick check:

```powershell
node .\scripts\supabase-selfcheck.ts
```

## 4) Run the app locally

From the `Ai-learn-` folder:

```powershell
npm run dev
```

This starts Next.js at http://localhost:9002

If port 9002 is busy:

```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 9002 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess | Stop-Process -Force -ErrorAction SilentlyContinue
```

## 5) Verify end-to-end

1. Open http://localhost:9002
2. Sign up a new user (email/password) via `/signup`
3. From home, upload a PDF or paste content to create a course
4. Open `/dashboard` and confirm the course appears
5. Open `/lesson`, complete a lesson, and refresh dashboard to see progress
6. In Supabase → Table Editor, confirm rows exist in `user_courses` with your `user_id`

## 6) Production-like check

```powershell
npm run typecheck
npm run build
$env:PORT=9010; npm run start
```

Open http://localhost:9010 and sanity check main routes.

## 7) Genkit development (optional)

If you’re iterating on AI flows, you can use the Genkit dev server:

```powershell
npm run genkit:dev
# or
npm run genkit:watch
```

App API endpoints are available under `/api/genkit/*`.

## Common issues

- “Auth doesn’t work” → verify `.env.local` Supabase URL and keys; ensure Email/Password is enabled.
- “Images blocked” → ensure image domains exist in `next.config.ts` remotePatterns.
- “Port in use” → free 9002 using the command above.
- “Build warnings” → benign OpenTelemetry warnings are expected; they don’t block builds.

For a deeper guide, see `ONBOARDING.md` and `TROUBLESHOOTING.md`.
