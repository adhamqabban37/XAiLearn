# Video Resources Fix

## Issue

Video suggestions were not appearing in generated courses.

## Root Cause

The AI prompt in `src/ai/flows/restructure-messy-pdf.ts` was not explicitly requesting YouTube video resources in the correct format expected by the UI components.

## Solution Applied

### 1. Updated AI Prompt Structure

Modified the prompt to explicitly request:

- YouTube video resources with proper format
- Article/documentation URLs
- Proper JSON structure matching the schema

### 2. Expected JSON Format

```json
{
  "course_title": "Course Title Here",
  "modules": [{
    "module_title": "Module 1 Title",
    "lessons": [{
      "lesson_title": "Lesson Title",
      "key_points": ["point1", "point2", "point3"],
      "time_estimate_minutes": 15,
      "quiz": [...],
      "resources": {
        "youtube": [
          {"title": "Descriptive Video Title", "url": "https://www.youtube.com/watch?v=VIDEO_ID"}
        ],
        "articles": [
          {"title": "Article Title", "url": "https://example.com/article"}
        ],
        "pdfs_docs": []
      }
    }]
  }]
}
```

### 3. How It Works

**Flow**: User Text → AI Generation → Transform → UI Display

1. **AI Generation** (`src/ai/flows/restructure-messy-pdf.ts`)

   - Sends enhanced prompt requesting YouTube videos
   - Returns structured JSON with resources object

2. **Transformation** (`src/app/actions.ts`)

   - `transformAnalysisToCourse()` flattens resources
   - Categorizes by type: video, article, docs

   ```typescript
   const resources = [
     ...(lesson.resources?.youtube || []).map((r) => ({
       ...r,
       type: "video" as const,
     })),
     ...(lesson.resources?.articles || []).map((r) => ({
       ...r,
       type: "article" as const,
     })),
     ...(lesson.resources?.pdfs_docs || []).map((r) => ({
       ...r,
       type: "docs" as const,
     })),
   ];
   ```

3. **Display** (`src/components/lesson/resources-panel.tsx`)
   - Filters YouTube URLs from resources
   - Renders `YouTubeEmbed` component for each video
   - Shows other links as clickable items

### 4. Testing

To verify videos appear:

1. Start dev server:

   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:9002

3. Upload text or paste content to generate a course

4. Check each lesson for the "Additional Resources" section

5. Videos should appear as embedded YouTube players

### 5. Current Provider Configuration

**Active Provider**: GitHub Models (Azure endpoint)

- Endpoint: `https://models.inference.ai.azure.com`
- Model: `gpt-4o-mini`
- Token: Configured in `.env.local`

**Alternative Providers** (configured but not active):

- DeepSeek: Set `AI_PROVIDER=deepseek`
- Ollama (local): Set `AI_PROVIDER=ollama`

### 6. Troubleshooting

**If videos still don't appear:**

1. Check server logs for generation output:

   - Look for `✅ DeepSeek completed` message
   - Check character count (should be 3000+ for decent output)

2. Inspect the generated course JSON:

   ```javascript
   // In browser console after generation
   console.log(JSON.stringify(course, null, 2));
   ```

3. Verify resources structure:

   - Should have `resources.youtube` array
   - Each item needs `title` and `url` fields
   - URLs must be valid YouTube links

4. Check ResourcesPanel rendering:
   - Open lesson page
   - Check browser console for errors
   - Verify `lesson.resources.length > 0` is true

**Common Issues:**

- **Empty resources array**: AI didn't generate YouTube links
  - Solution: Regenerate course, AI should now follow updated prompt
- **Invalid YouTube URLs**: AI generated non-YouTube links
  - Solution: Check URL format in generated JSON
- **Resources not showing**: UI filtering issue
  - Solution: Check browser console for React errors

### 7. Files Modified

1. `src/ai/flows/restructure-messy-pdf.ts`

   - Updated prompt to explicitly request YouTube videos
   - Added detailed JSON structure example
   - Specified realistic video title requirements

2. `.env.local`
   - Updated GitHub Models endpoint and model
   - Verified token configuration

### 8. Next Steps

- Generate a new course after this fix
- Videos should now appear in the "Additional Resources" section
- Each video will be embedded with a YouTube player
- Fallback to external link if embed fails
