# Developer Guide

This guide summarizes the architecture, key modules, and conventions used in this project.

## Architecture Overview

- Next.js App Router (src/app) for UI and server actions.
- Genkit AI flows under `src/ai/flows/*` to analyze and audit content.
- Supabase for auth/storage (client in `src/lib/supabaseClient.ts`), data-layer helpers in `src/lib/auth.ts` and `src/lib/authSupabase.ts`.
- Tailwind for styling with design tokens defined in `src/app/globals.css` and `tailwind.config.ts`.
- Testing with Jest/RTL and Cypress.

## Key Modules

- `src/lib/types.ts` — Core domain types (`Course`, `Lesson`, storage types, sessions).
- `src/lib/course-slicer.ts` — Creates a `StudySession` from a stored course and a target duration.
- `src/lib/authSupabase.ts` — Authentication helpers (signUp/signIn/logOut/getCurrentUser/OAuth).
- `src/lib/auth.ts` — Data access to `user_courses` (save/list/update progress/read progress).
- `pages/api/upload.ts` — PDF parsing API endpoint (server-only parsing with multer).
- `src/app/actions.ts` — Server actions to generate a course from text; transforms AI output.
- `src/app/course-actions.ts` — Server action to save a course for a user.

## Conventions

- Use semantic Tailwind tokens: `bg-card`, `text-muted-foreground`, `bg-primary`, `ring`, etc.
- Prefer component variants (`<Button variant="…">`) over ad-hoc classes; gradient helpers are reserved for special CTAs.
- Error handling: data layer logs warnings on failures and returns safe defaults; server actions return `{ error: string }` instead of throwing.
- AI timeouts: wrap long AI calls in a timeout guard to improve UX.

## Extending the data layer

- Add new Supabase tables and declare JSON shapes in `types.ts`.
- Mirror access patterns used in `auth.ts` and write unit tests with a mocked `supabase.from()` chain.
- Keep `authSupabase.ts` free of non-auth responsibilities.

## Adding a new AI flow

- Place flow under `src/ai/flows/*` with clear input/output schemas in `schemas.ts`.
- Export a single function that returns typed data; add brief JSDoc.
- If invoked from the UI, add a server action wrapper.

## Testing

- Jest unit tests live near `src/lib/**/__tests__` and `src/hooks/**/__tests__`.
- Mock `@/lib/supabaseClient` in tests to avoid network calls.
- Keep tests deterministic; prefer explicit refresh calls for async hooks.

## Docs Index

- `docs/API_CONTRACTS.md`
- `docs/DB_SCHEMA.md`
- `docs/DEVELOPER_GUIDE.md`
