# Bulletproof YouTube Embed System

A production-ready YouTube video embedding system that guarantees **something is always displayed** for every video URL, regardless of availability, restrictions, or format.

## 🎯 Features

### Core Capabilities
- ✅ **Universal Display Guarantee** - Never shows empty boxes or errors
- ✅ **Smart Validation** - Uses YouTube oEmbed + Data API for accurate status
- ✅ **Automatic Fallback** - Clean card UI when embedding fails
- ✅ **Deleted Video Detection** - Special handling for removed content
- ✅ **All URL Formats** - Supports watch, shorts, live, embed, youtu.be
- ✅ **Edge Case Handling** - Private, age-restricted, region-locked, etc.
- ✅ **Thumbnail Preservation** - Shows thumbnails even when video is unavailable
- ✅ **Metadata Display** - Title, author, and reason for failure
- ✅ **Direct YouTube Link** - Fallback button to open on YouTube
- ✅ **Batch Rendering** - Efficiently render multiple videos from PDF lists
- ✅ **Mobile Responsive** - Optimized for all screen sizes
- ✅ **Performance Optimized** - Lazy loading, thumbnail preload, on-click iframe
- ✅ **Modern UI** - Rounded corners, hover effects, smooth transitions

### Video States Handled

| State | Detection | UI Behavior |
|-------|-----------|-------------|
| **Working** | oEmbed + embeddable=true | Thumbnail → Click → Iframe player |
| **Deleted** | not_found reason | Red alert card with "Video Not Available" |
| **Private** | private status | Fallback card with "This video is private" |
| **Age Restricted** | age_restricted status | Fallback card with reason + YouTube link |
| **Embed Disabled** | embed_disabled status | Fallback card with "Embedding disabled" |
| **Region Locked** | region_blocked status | Fallback card with region message |
| **Shorts** | /shorts/ URL pattern | Fallback card with "Shorts cannot be embedded" |
| **Live** | /live/ URL or live status | Fallback card with "This is a live stream" |
| **Playlist** | list= parameter | Rejected early with error message |
| **Invalid URL** | Bad ID extraction | Clean error card |

## 📦 Components

### 1. `YouTubeEmbed` (Core Component)

Single video embed with comprehensive fallback handling.

```tsx
import { YouTubeEmbed } from "@/components/lesson/youtube-embed";

<YouTubeEmbed 
  url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
  title="Optional title for repair suggestions"
/>
```

**Props:**
- `url: string` - Any YouTube URL format
- `title?: string` - Optional title for AI-powered replacement suggestions

**States:**
1. **Loading** - Shows thumbnail with spinner overlay
2. **OK** - Shows clickable thumbnail, loads iframe on click
3. **Blocked** - Shows enhanced fallback card with thumbnail, title, reason, YouTube link
4. **Deleted** - Shows red alert card indicating video is unavailable
5. **Invalid** - Shows error message for malformed URLs

### 2. `YouTubeBatchRenderer` (Multi-Video)

Render multiple videos from a list with lazy loading.

```tsx
import { YouTubeBatchRenderer } from "@/components/lesson/youtube-batch-renderer";

const videos = [
  { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Video 1" },
  { url: "https://youtu.be/9bZkp7q19f0", title: "Video 2", context: "From PDF page 3" },
];

<YouTubeBatchRenderer 
  videos={videos}
  title="Course Videos"
  description="All videos from your PDF"
/>
```

**Props:**
- `videos: VideoItem[]` - Array of `{ url, title?, context? }`
- `title?: string` - Section heading
- `description?: string` - Section description

**Features:**
- Lazy rendering (5 videos at a time)
- "Load More" button for performance
- Context labels (e.g., "From PDF page 2")
- Total count display

### 3. `useExtractYouTubeUrls` Hook

Extract all YouTube URLs from text (e.g., parsed PDF content).

```tsx
import { useExtractYouTubeUrls } from "@/components/lesson/youtube-batch-renderer";

const pdfText = "... content with https://www.youtube.com/watch?v=... ...";
const extractedVideos = useExtractYouTubeUrls(pdfText);

<YouTubeBatchRenderer videos={extractedVideos} />
```

**Features:**
- Regex-based extraction
- Supports all URL formats
- Automatic deduplication

## 🔧 API Integration

### Validation Endpoint: `/api/youtube-validate`

```typescript
GET /api/youtube-validate?url=https://www.youtube.com/watch?v=VIDEO_ID

Response:
{
  "embeddable": boolean,
  "id": "VIDEO_ID",
  "embedUrl": "https://www.youtube-nocookie.com/embed/VIDEO_ID",
  "watchUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
  "reason": "ok" | "private" | "age_restricted" | "embed_disabled" | "region_blocked" | "not_found" | "shorts" | "live" | "playlist" | "invalid_url" | "unknown",
  "title": "Video Title",
  "author": "Channel Name",
  "thumbnail": "https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg",
  "debugReason": "detailed-reason-string"
}
```

**Features:**
- Uses YouTube oEmbed API (fast, no quota)
- Falls back to YouTube Data API v3 (detailed info, requires API key)
- 24-hour in-memory cache to reduce API calls
- Rejects playlists and invalid URLs early

### Repair Endpoint: `/api/youtube-repair` (Admin-Only)

```typescript
POST /api/youtube-repair
Headers: { "x-admin-token": "SECRET" }
Body: { "url": "...", "title": "..." }

Response (when repair disabled or pending):
{
  "embeddable": false,
  "id": null,
  "reason": "private",
  "pending": true,
  "note": "Alternative submitted for admin review"
}
```

**Security:**
- Requires `ENABLE_VIDEO_REPAIR=true` in environment
- Requires `x-admin-token` header matching `ADMIN_API_TOKEN`
- Rate limited to 10 requests/min per IP
- Logs replacements as "pending" for admin approval

## 🚀 Usage Examples

### Example 1: Render Videos from PDF

```tsx
"use client";

import { YouTubeBatchRenderer, useExtractYouTubeUrls } from "@/components/lesson/youtube-batch-renderer";

export function PDFVideosPage({ pdfContent }: { pdfContent: string }) {
  const videos = useExtractYouTubeUrls(pdfContent);
  
  return (
    <div className="container mx-auto p-8">
      <YouTubeBatchRenderer 
        videos={videos}
        title="Videos from Your PDF"
        description={`Found ${videos.length} YouTube links`}
      />
    </div>
  );
}
```

### Example 2: Manual Video List

```tsx
import { YouTubeBatchRenderer } from "@/components/lesson/youtube-batch-renderer";

const courseVideos = [
  {
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    title: "Introduction to React",
    context: "Lesson 1: Getting Started"
  },
  {
    url: "https://youtu.be/9bZkp7q19f0",
    title: "React Hooks Deep Dive",
    context: "Lesson 2: Advanced Concepts"
  }
];

<YouTubeBatchRenderer videos={courseVideos} />
```

### Example 3: Single Embed in Article

```tsx
import { YouTubeEmbed } from "@/components/lesson/youtube-embed";

export function ArticleWithVideo() {
  return (
    <article>
      <h1>How to Build a React App</h1>
      <p>Watch this tutorial:</p>
      <YouTubeEmbed url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />
      <p>More content...</p>
    </article>
  );
}
```

## 🎨 UI States

### 1. Loading State
```
┌─────────────────────────────┐
│                             │
│   [Thumbnail Preview]       │
│                             │
│     ⟳ Loading...            │
│                             │
└─────────────────────────────┘
```

### 2. Ready State (Clickable Thumbnail)
```
┌─────────────────────────────┐
│                             │
│   [Thumbnail]               │
│                             │
│     ▶ [Play Button]         │
│                             │
│   Video Title               │
│   by Channel Name           │
└─────────────────────────────┘
```

### 3. Blocked/Restricted State
```
┌─────────────────────────────┐
│   [Thumbnail with overlay]  │
│                             │
│   ⚠ Video unavailable       │
│   Reason: Age-restricted    │
└─────────────────────────────┘
│ Video Title                 │
│ by Channel Name             │
│                             │
│ [Open on YouTube] [Find Similar] │
└─────────────────────────────┘
```

### 4. Deleted State
```
┌─────────────────────────────┐
│   [Faded thumbnail]         │
│                             │
│   🚫 Video Not Available    │
│   This video has been       │
│   deleted or is unavailable │
└─────────────────────────────┘
│ Deleted Video               │
│ (No metadata available)     │
└─────────────────────────────┘
```

## ⚙️ Configuration

### Environment Variables

```bash
# Required for Data API validation (optional, fallback to oEmbed)
YOUTUBE_API_KEY=your_youtube_data_api_v3_key

# Required for repair endpoints (optional feature)
ENABLE_VIDEO_REPAIR=true
ADMIN_API_TOKEN=your_secret_admin_token

# Required for Supabase logging (optional)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### TypeScript Types

```typescript
interface VideoItem {
  url: string;           // YouTube URL (any format)
  title?: string;        // Optional title for context
  context?: string;      // Optional context (e.g., "From PDF page 2")
}

type EmbedStatus = "loading" | "ok" | "blocked" | "invalid" | "deleted";

type ValidateResponse = {
  embeddable: boolean;
  id: string | null;
  embedUrl: string | null;
  watchUrl: string | null;
  reason: "ok" | "invalid_url" | "playlist" | "shorts" | "live" | 
          "private" | "age_restricted" | "embed_disabled" | 
          "region_blocked" | "not_found" | "unknown";
  title?: string;
  author?: string;
  thumbnail?: string;
  pending?: boolean;
  debugReason?: string;
};
```

## 🔒 Security Features

1. **Rate Limiting** - 10 requests/min per IP for repair endpoints
2. **Admin-Only Repair** - Requires secret token header
3. **Feature Flags** - `ENABLE_VIDEO_REPAIR` to disable repair system
4. **Input Validation** - Rejects non-YouTube URLs and playlists
5. **Pending Approval** - Suggestions logged for admin review, not auto-applied
6. **CORS Safety** - Uses youtube-nocookie.com for embeds

## 📊 Performance Optimizations

1. **Thumbnail Preload** - Shows thumbnail during validation
2. **Lazy Iframe** - Only loads iframe after user click
3. **24h Cache** - In-memory cache for API responses
4. **Lazy Rendering** - Batch renderer loads 5 videos at a time
5. **oEmbed First** - Fast check before Data API
6. **Thumbnail Fallback** - Multiple resolution attempts

## 🧪 Testing Edge Cases

```tsx
// Test all edge cases
const testVideos = [
  { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Working video" },
  { url: "https://www.youtube.com/watch?v=INVALID", title: "Deleted video" },
  { url: "https://www.youtube.com/shorts/abc123", title: "Shorts" },
  { url: "https://www.youtube.com/watch?v=xyz&list=PLxxx", title: "Playlist (rejected)" },
  { url: "https://youtu.be/9bZkp7q19f0", title: "Short link format" },
  { url: "https://www.youtube.com/live/abc123", title: "Live stream" },
  { url: "not-a-youtube-url", title: "Invalid URL" },
];

<YouTubeBatchRenderer videos={testVideos} title="Edge Case Tests" />
```

## 📝 Files Overview

```
src/
├── components/
│   └── lesson/
│       ├── youtube-embed.tsx           # Core embed component
│       ├── youtube-batch-renderer.tsx  # Multi-video renderer
│       └── resources-panel.tsx         # Uses YouTubeEmbed
├── lib/
│   ├── youtube.ts                      # Validation utilities
│   └── video-log.ts                    # Supabase logging
└── pages/
    └── api/
        ├── youtube-validate.ts         # oEmbed + Data API validation
        ├── youtube-repair.ts           # Admin repair endpoint
        └── youtube-repair-batch.ts     # Batch repair
```

## 🚀 Quick Start

1. **Install dependencies** (already in your project):
   ```bash
   npm install lucide-react
   ```

2. **Set up environment** (optional):
   ```bash
   cp .env.example .env.local
   # Add YOUTUBE_API_KEY for better validation
   ```

3. **Use in your component**:
   ```tsx
   import { YouTubeEmbed } from "@/components/lesson/youtube-embed";
   
   <YouTubeEmbed url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />
   ```

4. **For batch rendering**:
   ```tsx
   import { YouTubeBatchRenderer } from "@/components/lesson/youtube-batch-renderer";
   
   const videos = [
     { url: "https://www.youtube.com/watch?v=..." },
     { url: "https://youtu.be/..." }
   ];
   
   <YouTubeBatchRenderer videos={videos} />
   ```

## 🎯 Best Practices

1. **Always provide a title prop** when available - enables AI-powered repair suggestions
2. **Use batch renderer** for lists of 3+ videos - better performance
3. **Set YOUTUBE_API_KEY** for production - better validation accuracy
4. **Monitor repair logs** in Supabase - track blocked videos
5. **Test with real-world URLs** - deleted, private, age-restricted videos
6. **Mobile-first design** - all cards are responsive by default

## 📄 License

Part of the AI Learn 2.0 project. MIT License.
