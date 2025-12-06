# Video Enhancement Configuration

This document explains how to configure the enhanced YouTube video integration system.

## Overview

The improved video pipeline now supports:

- **Semantic matching** of PDF-embedded videos to relevant lessons
- **YouTube Data API search** for discovering educational content
- **Graceful fallback** when no videos are found (lessons still work)
- **Validation** to ensure all videos are embeddable and appropriate

## Required Environment Variables

### YouTube Data API Key (Optional but Recommended)

To enable automatic video discovery via YouTube search, you need a YouTube Data API v3 key.

**Without this key:**

- PDF-embedded videos will still be matched to lessons
- AI-generated courses will include articles and quizzes
- No automatic video search will occur

**With this key:**

- System will search YouTube for relevant educational videos
- Videos are ranked by relevance, quality, and embeddability
- Lessons without PDF videos get appropriate search results

### How to Get YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **YouTube Data API v3**:
   - Navigate to "APIs & Services" → "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the generated key
5. (Optional) Restrict the API key:
   - Click on the key to edit
   - Under "API restrictions", select "Restrict key"
   - Choose "YouTube Data API v3"
   - Save

### Add to Environment Variables

**Local Development** (`.env.local`):

```bash
YOUTUBE_API_KEY=your_api_key_here
```

**Production** (Render.com):

1. Go to your service dashboard
2. Navigate to "Environment"
3. Add new environment variable:
   - Key: `YOUTUBE_API_KEY`
   - Value: Your API key
4. Save and redeploy

## How the Enhanced System Works

### 1. PDF Upload & Video Extraction

```
User uploads PDF → System extracts:
  - Text content (for AI analysis)
  - YouTube URLs (if any embedded in PDF)
  - Validates each URL immediately
```

### 2. AI Course Generation

```
AI receives:
  - PDF text (primary source)
  - List of validated PDF videos (context)

AI outputs:
  - Course structure (modules → lessons → quizzes)
  - For each lesson:
    • lesson_title
    • key_points
    • quiz questions
    • videoSearchQuery (optional, e.g., "python functions tutorial")
```

**Key Change**: AI no longer generates fake YouTube URLs. Instead, it suggests **search queries** for finding relevant videos.

### 3. Video Enrichment (Post-AI)

```
For each lesson:
  a) Try to match PDF videos semantically
     - Compare lesson title/keyPoints to video titles
     - Use keyword overlap scoring (Jaccard similarity)
     - Assign best match if score > 30%

  b) If no PDF match AND videoSearchQuery exists:
     - Search YouTube Data API
     - Filter: embeddable, not shorts/live, duration > 2min
     - Rank by view count & relevance
     - Validate top result
     - Add to lesson if valid

  c) If no video found:
     - Skip video for this lesson
     - Lesson still has: text, quizzes, articles
```

### 4. Final Course Assembly

```
Each lesson includes:
  ✅ Title, summary, key points
  ✅ 2-3 quiz questions
  ✅ Article/documentation links
  🎥 Video (if found and validated)

Lessons without videos are fully functional.
```

## Search Quality Configuration

You can adjust search behavior in `src/lib/youtube-search.ts`:

```typescript
// Minimum video duration (seconds)
minDuration: 120, // Default: 2 minutes

// Maximum results to fetch
maxResults: 5, // Default: 5 videos per search

// Preferred channels (future enhancement)
preferredChannels: [
  "freeCodeCamp.org",
  "Traversy Media",
  "Crash Course",
  "Khan Academy",
  "MIT OpenCourseWare"
]
```

## Testing Video Integration

### Test Case 1: PDF with Embedded Videos

1. Create a PDF with YouTube links
2. Upload to AI Learn 2.0
3. Expected: Videos matched to relevant lessons

### Test Case 2: PDF without Videos

1. Upload plain text PDF (no URLs)
2. Expected:
   - AI generates search queries
   - System searches YouTube (if API key configured)
   - Finds appropriate educational videos

### Test Case 3: No API Key Configured

1. Remove `YOUTUBE_API_KEY` from environment
2. Upload PDF
3. Expected:
   - PDF videos still matched
   - No YouTube search occurs
   - Warning logged: "YouTube API key not configured"
   - Lessons still work without videos

## Monitoring & Debugging

Check server logs for video pipeline activity:

```
🎥 Starting video enrichment pipeline...
   PDF videos: 3
   Total lessons: 6

🔍 Matching 3 PDF videos to lessons...
✅ Matched "Python Tutorial" to lesson "Introduction to Python" (score: 0.67)
ℹ️ No good video match for lesson "Advanced Concepts"

🔍 Searching YouTube for: "python advanced concepts tutorial"
✅ Found video for "Advanced Concepts": Real Python - Advanced Techniques

🎥 Video enrichment complete: 4 lessons have videos
```

## Cost Considerations

YouTube Data API v3 has a free tier:

- **10,000 quota units per day**
- Each search costs **100 units**
- Each video details fetch costs **1-3 units**
- **~90 course generations per day** with free tier

For higher volume, you may need to:

1. Request quota increase from Google
2. Implement caching for common searches
3. Use rate limiting to distribute requests

## Fallback Behavior

The system is designed to work gracefully without YouTube API:

| Scenario                | Behavior                                     |
| ----------------------- | -------------------------------------------- |
| No API key              | PDF videos matched, no search                |
| API key invalid         | Error logged, continues without search       |
| API rate limit exceeded | Warning logged, skips search for that lesson |
| No videos found         | Lesson created without video                 |

## Migration from Old System

Your existing courses are **not affected**. The new system:

- Only applies to newly generated courses
- Maintains backward compatibility
- Improves quality without breaking existing features

To regenerate an old course with new video logic:

1. Upload the same PDF again
2. New course will use enhanced video pipeline
3. Old course remains accessible in storage

## Support

For issues with video integration:

1. Check server logs for detailed error messages
2. Verify YouTube API key is valid and not rate-limited
3. Test with a simple PDF first
4. Report issues with log excerpts

---

**Last Updated**: December 2025
**System Version**: 2.0 (Enhanced Video Pipeline)
