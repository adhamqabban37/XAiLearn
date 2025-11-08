# Video Replacements Logging

This app logs automatic YouTube video replacements to a Supabase table named `video_replacements` (best-effort, safe to ignore if Supabase isn't configured).

## Table schema (SQL)

```sql
create table if not exists public.video_replacements (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  originalUrl text,
  originalId text,
  reason text,
  replacementId text,
  replacementTitle text,
  replacementAuthor text,
  replacementWatchUrl text,
  contextTitle text,
  contextLessonId text,
  contextCourseId text,
  metadata jsonb
);
```

Consider adding RLS as needed for your environment.

## Admin Review UI

- Navigate to `/dashboard/replacements` to view recent replacement logs.
- Data is fetched via `/api/video-replacements`.
- If Supabase is not configured, the table will appear empty.

## Notes

- Logging is non-blocking: if the insert fails, the user experience isn’t affected.
- You can expand the logger to include course/lesson context when available.
