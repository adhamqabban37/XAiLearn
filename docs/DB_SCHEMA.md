# Database Schema (Supabase)

This app stores user course data in a single table. JSON columns are used for flexible course content.

## Table: user_courses

- id: uuid (PK, default: gen_random_uuid())
- user_id: text (FK to auth.users.id or your custom users) — indexed
- course: jsonb — serialized `Course` object (see `src/lib/types.ts`)
- progress: jsonb — array of `LessonProgress` objects or key-value map, depending on version
- saved_at: timestamptz (default now())
- last_accessed_at: timestamptz (default now())

### Indexes

- idx_user_courses_user_id (user_id)
- idx_user_courses_saved_at (saved_at DESC) — optional for list sorting

### Example row shape

```
{
  id: "8f5f…",
  user_id: "u1",
  course: {
    course_title: "…",
    description: "…",
    sessions: [ { id: "session-0", session_title: "…", lessons: [ { id: "…" } ] } ],
    checklist: [],
    total_estimated_time: "120 minutes",
    readiness_score: 100,
    analysis_report: { …raw AI output… }
  },
  progress: [
    {
      courseId: "8f5f…",
      lessonId: "lesson-1",
      completed: true,
      completedAt: "2025-10-01T12:00:00.000Z",
      score: 90,
      timeSpent: 120
    }
  ],
  saved_at: "2025-10-01T10:00:00.000Z",
  last_accessed_at: "2025-10-02T10:00:00.000Z"
}
```

### Data access patterns (see `src/lib/auth.ts`)

- saveCourse(uid, course): inserts new row, returns id. On failure returns temporary `tmp_<timestamp>`.
- getUserCourses(uid): returns an array of simplified course entries; maps date strings to Date.
- updateLessonProgress(uid, courseId, lessonId, progress): reads current `progress`, merges or appends, writes back with `last_accessed_at` updated.
- getCourseProgress(uid, courseId): returns typed `LessonProgress[]` and coerces `completedAt` to Date.

### Notes

- JSONB is used for maximum flexibility across evolving schemas.
- Consider row-level security (RLS) to ensure users only see their own rows.
- Consider constraints:
  - CHECK (jsonb_typeof(course) = 'object')
  - CHECK (jsonb_typeof(progress) IN ('array', 'object'))
- Backups: enable Point-in-Time Recovery (PITR) for critical data.
