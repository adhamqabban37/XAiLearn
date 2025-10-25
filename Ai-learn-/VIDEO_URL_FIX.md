# Video URL Issue - Fix Applied

## 🐛 Problem

Users were seeing this error when viewing lessons with video resources:

```
This video isn't available anymore
Invalid YouTube URL
Try opening in browser
```

## 🔍 Root Cause

The AI was generating video resources **without valid URLs** or with **placeholder/incomplete URLs**. The code expected all resources to have a `url` property, but:

1. **AI generated resources without URLs** - Only titles, no URLs
2. **AI used placeholder URLs** - Example URLs like `"https://www.youtube.com/watch?v=dQw4w9WgXcQ"` from the prompt example
3. **Missing URL validation** - Components didn't check if URLs existed before using them

## ✅ Solutions Implemented

### 1. **Enhanced AI Prompt** - More Explicit URL Requirements

**Before:**

```
- CRITICAL: Suggest only REAL, POPULAR YouTube videos that exist online
- Include 1-2 article/documentation URLs from reputable sources
```

**After:**

```
CRITICAL REQUIREMENTS FOR RESOURCES:
1. YOUTUBE VIDEOS - You MUST provide REAL, VALID YouTube URLs:
   * Search your knowledge for actual popular educational videos
   * Use videos from verified channels: Crash Course, Khan Academy, freeCodeCamp, etc.
   * Include the FULL URL starting with "https://www.youtube.com/watch?v="
   * DO NOT use placeholder URLs like "dQw4w9WgXcQ" - use REAL video IDs
   * Example REAL videos you might know:
     - Python: "https://www.youtube.com/watch?v=rfscVS0vtbw" (Python Full Course)
     - JavaScript: "https://www.youtube.com/watch?v=PkZNo7MFNFg" (JS Tutorial)
     - React: "https://www.youtube.com/watch?v=bMknfKXIFA8" (React Course)
```

**Key Changes:**

- ✅ Explicitly states "You MUST provide REAL, VALID YouTube URLs"
- ✅ Provides actual real video IDs from freeCodeCamp's training data
- ✅ Warns against using the placeholder example URL
- ✅ Emphasizes FULL URLs with https://www.youtube.com/watch?v= prefix
- ✅ Requires REAL article URLs from Wikipedia, MDN, official docs

### 2. **Added URL Validation** - Defensive Code in ResourcesPanel

**File:** `src/components/lesson/resources-panel.tsx`

**Added:**

```typescript
// Filter out resources without valid URLs
const validResources = resources.filter((r) => {
  if (!r.url || typeof r.url !== "string" || r.url.trim() === "") {
    console.warn("⚠️ Resource missing URL:", r);
    return false;
  }
  return true;
});
```

**What it does:**

- ✅ Checks if `url` property exists
- ✅ Verifies it's a string (not null, undefined, or other type)
- ✅ Ensures it's not empty or whitespace-only
- ✅ Logs warning for invalid resources (visible in browser console)
- ✅ Filters them out before rendering (prevents crashes)

### 3. **Enhanced Debug Logging** - Better Visibility

**File:** `src/app/actions.ts`

**Added:**

```typescript
// Log actual URLs for debugging
if (lesson.resources?.youtube && lesson.resources.youtube.length > 0) {
  console.log(
    `  YouTube URLs:`,
    lesson.resources.youtube.map((v) => ({
      title: v.title,
      url: v.url,
      hasUrl: !!v.url,
      urlType: typeof v.url,
    }))
  );
}
```

**What you'll see in logs:**

```
📹 Lesson "Introduction to AI" resources: { youtube: 2, articles: 1, total: 3 }
  YouTube URLs: [
    {
      title: "AI Crash Course",
      url: "https://www.youtube.com/watch?v=rfscVS0vtbw",
      hasUrl: true,
      urlType: "string"
    },
    {
      title: "Machine Learning Basics",
      url: "https://www.youtube.com/watch?v=Gv9_4yMHFhI",
      hasUrl: true,
      urlType: "string"
    }
  ]
```

**Or if there's a problem:**

```
📹 Lesson "Broken Lesson" resources: { youtube: 1, articles: 0, total: 1 }
  YouTube URLs: [
    {
      title: "Some Video",
      url: undefined,
      hasUrl: false,
      urlType: "undefined"
    }
  ]
⚠️ Resource missing URL: { title: "Some Video", type: "video" }
```

## 🧪 How to Test

### 1. Generate a New Course

1. Go to http://localhost:9002
2. Upload a PDF or paste content
3. Click "Generate Course"

### 2. Check Browser Console (F12)

Look for these logs:

```
📹 Lesson "Lesson Name" resources: { youtube: 2, articles: 1, total: 3 }
  YouTube URLs: [...]
```

**Good signs:**

- ✅ Each video has `hasUrl: true`
- ✅ URLs start with `https://www.youtube.com/watch?v=`
- ✅ No warnings about missing URLs

**Bad signs:**

- ❌ `hasUrl: false` or `url: undefined`
- ❌ `⚠️ Resource missing URL:` warnings
- ❌ URLs are placeholder examples (dQw4w9WgXcQ)

### 3. View a Lesson

1. Click on a lesson in the course
2. Scroll to "Video Resources" section

**Expected:**

- ✅ See video thumbnails with play buttons
- ✅ Video titles and channel names displayed
- ✅ Click thumbnail → video loads and plays

**If still seeing errors:**

- ❌ "Invalid YouTube URL" → AI generated bad URL or no URL
- ❌ "Video cannot be embedded" → Video exists but embedding disabled
- ❌ No videos show → Check console for `⚠️ Resource missing URL` warnings

## 📊 Expected AI Behavior

### What the AI Should Generate

```json
{
  "resources": {
    "youtube": [
      {
        "title": "Python Tutorial - Full Course for Beginners",
        "url": "https://www.youtube.com/watch?v=rfscVS0vtbw"
      },
      {
        "title": "JavaScript Crash Course For Beginners",
        "url": "https://www.youtube.com/watch?v=hdI2bqOjy3c"
      }
    ],
    "articles": [
      {
        "title": "Python (programming language) - Wikipedia",
        "url": "https://en.wikipedia.org/wiki/Python_(programming_language)"
      },
      {
        "title": "JavaScript - MDN Web Docs",
        "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript"
      }
    ]
  }
}
```

### What the AI Should NOT Generate

❌ **Missing URLs:**

```json
{
  "youtube": [
    { "title": "Some Video" } // NO URL!
  ]
}
```

❌ **Placeholder URLs:**

```json
{
  "youtube": [
    { "title": "Example", "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ" } // Placeholder!
  ]
}
```

❌ **Invalid URLs:**

```json
{
  "youtube": [
    { "title": "Video", "url": "youtube.com/watch" } // Missing https://
  ]
}
```

❌ **Made-up URLs:**

```json
{
  "youtube": [
    { "title": "Video", "url": "https://www.youtube.com/watch?v=ABCD123" } // Doesn't exist
  ]
}
```

## 🎯 Why This Happens with AI

LLMs sometimes:

1. **Follow examples too literally** - Used the placeholder URL from the example
2. **Hallucinate URLs** - Make up video IDs that don't exist
3. **Omit required fields** - Generate title without URL
4. **Mix up formats** - Use partial URLs or wrong syntax

**Our fixes:**

- ✅ Provide REAL video ID examples from the model's training data
- ✅ Explicitly warn against using placeholders
- ✅ Validate and filter out invalid resources defensively
- ✅ Log everything for debugging

## 🔧 Files Modified

1. **src/ai/flows/restructure-messy-pdf.ts**

   - Enhanced prompt with explicit URL requirements
   - Added real video ID examples
   - Emphasized "REAL, VALID" URLs multiple times

2. **src/components/lesson/resources-panel.tsx**

   - Added URL validation filter
   - Logs warnings for missing URLs
   - Prevents crashes from invalid data

3. **src/app/actions.ts**
   - Added detailed URL logging
   - Shows title, url, hasUrl, urlType for each video
   - Helps diagnose AI generation issues

## 🚀 Next Steps

1. **Generate a new course** to test the enhanced prompt
2. **Check the browser console** for URL logs
3. **Verify videos load** with thumbnails and play correctly
4. **Report any issues** - If AI still generates invalid URLs, we may need to:
   - Further strengthen the prompt
   - Add URL validation in the server action
   - Implement URL correction/normalization
   - Use a different AI model with better instruction following

## 💡 Alternative Solutions (If Still Not Working)

### Option A: Fallback to Search-Based Approach

Instead of asking AI for specific URLs, ask for search queries and use YouTube Search API to find real videos.

### Option B: Post-Processing Validation

Add a validation step that checks each URL via oEmbed before saving, removing invalid ones.

### Option C: Curated Video Database

Maintain a database of verified educational videos and have AI select from that list.

### Option D: User Override

Allow users to edit/replace videos after generation if AI suggestions are poor.

---

**Status:** ✅ Enhanced prompt + defensive validation implemented
**Next:** Test with new course generation to verify AI provides valid URLs
