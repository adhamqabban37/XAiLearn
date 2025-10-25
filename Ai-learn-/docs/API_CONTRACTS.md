# API Contracts

This document describes the interfaces for the app’s server APIs and key server actions.

## Upload PDF: POST /api/upload

- Purpose: Accepts a single PDF file, parses it server-side, and returns basic text/metadata.
- Auth: None (server-side parsing only).
- Content-Type: multipart/form-data
- Field: file (required)
- Limits: 20 MB

Request

- Headers (optional):
  - x-test-fail: "1" (for testing; injects a server error)
- Body: multipart form with `file`

Response 200 OK

```
{
  "text": string,           // Extracted text (may be empty)
  "numPages": number,       // Page count
  "info": object            // Metadata from the PDF (if available)
}
```

Response 400 Bad Request

```
{ "error": "No file uploaded. Please include a file in the \"file\" field." }
```

Response 405 Method Not Allowed

```
{ "error": "Method <METHOD> Not Allowed" }
```

Response 500 Server Error

```
{ "error": "Failed to parse PDF: <sanitized-message>" }
```

Notes

- The handler uses in-memory storage via `multer.memoryStorage()`.
- MIME type is not trusted; buffer parsing determines validity.

## Server Action: generateCourseFromText(text, duration?)

- Purpose: Produces a full Course object from raw text using AI flows.
- Module: `src/app/actions.ts`
- Input:
  - text: string (min ~100 chars; capped to ~12k for latency)
  - duration: string | undefined (optional hint to the AI)
- Output:
  - On success: `Course`
  - On error: `{ error: string }`
- Errors & timeouts:
  - 60-second timeout guard around the AI call.
  - Provides user-friendly error messages.

## Server Action: saveCourseForUser(uid, course)

- Purpose: Inserts or updates a course entry for a user (Supabase `user_courses`).
- Module: `src/app/course-actions.ts`
- Input: `uid: string`, `course: Course`
- Output: `string | { error: string }` — returns new course id or an error.
