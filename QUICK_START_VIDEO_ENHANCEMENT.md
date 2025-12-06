# Quick Start: Enhanced Video Integration

## 🚀 5-Minute Setup

### Step 1: Pull Latest Changes

```powershell
# Ensure you're on main branch
git status

# Pull the new code (already done if you're reading this)
git pull origin main
```

### Step 2: Install Dependencies (Optional)

No new dependencies needed! The enhancement uses existing packages.

```powershell
# Just to be safe, reinstall if needed
npm install
```

### Step 3: Configure YouTube API (Optional)

**Option A: No API Key (Basic Mode)**

- PDF videos will still be matched to lessons
- No automatic video search
- Lessons work perfectly without videos
- **Good for**: Testing, low-volume usage

**Option B: With API Key (Enhanced Mode)**

- Automatic YouTube search for educational content
- Semantic video matching
- High-quality video discovery
- **Good for**: Production, high-quality courses

**To get API key:**

```
1. Go to https://console.cloud.google.com/
2. Create/select project
3. Enable "YouTube Data API v3"
4. Create API key
5. Add to .env.local:
```

```bash
# .env.local
YOUTUBE_API_KEY=your_api_key_here
```

### Step 4: Test Locally

```powershell
npm run dev
```

**Test Case 1: With PDF Videos**

1. Upload a PDF containing YouTube links
2. Watch console for:
   ```
   🎥 Starting video enrichment pipeline...
   🔍 Matching X PDF videos to lessons...
   ✅ Matched "Video Title" to lesson "Lesson Title" (score: 0.67)
   ```

**Test Case 2: Without PDF Videos**

1. Upload plain text PDF
2. If API key configured, watch for:
   ```
   🔍 Searching YouTube for: "topic tutorial"
   ✅ Found video for "Lesson Title": Video Title
   ```
3. If no API key:
   ```
   ℹ️ No video search query for lesson - skipping video
   ```

### Step 5: Deploy to Production

**Render.com:**

```
1. Dashboard → Your Service → Environment
2. Add: YOUTUBE_API_KEY = your_key
3. Save Changes (auto-redeploys)
```

**Vercel:**

```
1. Project Settings → Environment Variables
2. Add: YOUTUBE_API_KEY = your_key
3. Redeploy
```

**Other Platforms:**

- Add `YOUTUBE_API_KEY` to environment variables
- Redeploy service

---

## ✅ What Changed (Summary)

### Files Modified

1. **`src/ai/flows/restructure-messy-pdf.ts`**

   - AI now outputs search queries instead of fake URLs
   - Better JSON structure instructions

2. **`src/app/actions.ts`**
   - New `enrichCourseWithVideos()` function
   - Semantic matching for PDF videos
   - YouTube search integration

### Files Added

1. **`src/lib/youtube-search.ts`** - YouTube search & matching
2. **`VIDEO_ENHANCEMENT_GUIDE.md`** - Detailed config guide
3. **`VIDEO_ENHANCEMENT_README.md`** - Complete documentation
4. **`IMPLEMENTATION_SUMMARY.md`** - Technical details

---

## 🎯 Key Improvements

| Before                 | After                        |
| ---------------------- | ---------------------------- |
| AI generates fake URLs | AI suggests search queries   |
| Videos added randomly  | Semantic matching by content |
| Many broken links      | All videos validated         |
| Inconsistent results   | Reliable & graceful          |

---

## 🐛 Troubleshooting

**Issue**: No videos appearing in courses

**Check**:

1. Is `YOUTUBE_API_KEY` set? (optional)
2. Check server logs for error messages
3. Verify PDF had videos embedded (if applicable)

**Issue**: Videos not relevant to lessons

**Solution**:

- The system uses keyword matching (30% overlap threshold)
- Can adjust in `src/lib/youtube-search.ts` line ~225
- Better results with more descriptive lesson titles

**Issue**: YouTube API quota exceeded

**Symptoms**:

```
❌ YouTube search failed: quotaExceeded
```

**Solution**:

- Free tier: 10,000 units/day = ~28 courses
- Request quota increase from Google
- Implement caching (future enhancement)

---

## 📊 Monitoring

Watch server logs for:

```
✅ Good signs:
🎥 Video enrichment complete: 5 lessons have videos
✅ Matched "Video" to lesson "Lesson" (score: 0.72)

⚠️ Warnings (safe to ignore):
ℹ️ No video search query for lesson - skipping video
⚠️ YouTube API key not configured. Video search disabled.

❌ Errors (needs attention):
❌ YouTube search failed: invalid API key
❌ No valid JSON found in AI response
```

---

## 🎓 Usage Examples

### Example 1: Computer Science PDF

**Input**: Algorithms textbook chapter with 2 embedded videos

**Output**:

```
Course: "Introduction to Algorithms"
  Module 1: "Sorting Algorithms"
    Lesson 1: "Bubble Sort"
      ✅ Video: "Bubble Sort Visualization" (from PDF, matched)
      ✅ Quiz: 3 questions
      ✅ Articles: Wikipedia link
    Lesson 2: "Quick Sort"
      ✅ Video: "Quick Sort Tutorial" (YouTube search)
      ✅ Quiz: 3 questions
```

### Example 2: Business Article (No Videos)

**Input**: 3-page business strategy article

**Output**:

```
Course: "Business Strategy Fundamentals"
  Module 1: "Strategy Basics"
    Lesson 1: "Market Analysis"
      ℹ️ No video (none in PDF, no good YouTube match)
      ✅ Quiz: 2 questions
      ✅ Key Points: 5 concepts
```

**Result**: Course still works perfectly!

---

## 🤝 Need Help?

1. **Configuration**: Read `VIDEO_ENHANCEMENT_GUIDE.md`
2. **Architecture**: Read `VIDEO_ENHANCEMENT_README.md`
3. **Technical Details**: Read `IMPLEMENTATION_SUMMARY.md`
4. **Bug Reports**: Include server logs + PDF sample

---

## 📝 Next Steps

1. **Test locally** with sample PDFs
2. **Deploy to production** with optional API key
3. **Monitor logs** for video enrichment activity
4. **Collect user feedback** on video relevance

---

**Ready?** Start with: `npm run dev` 🚀

**Questions?** Check the detailed guides in `VIDEO_ENHANCEMENT_*.md` files.

**Status**: ✅ Production Ready | Version 2.0.0 | December 2025
