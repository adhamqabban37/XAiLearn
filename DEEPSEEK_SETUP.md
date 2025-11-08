# DeepSeek API Setup Guide

## ✅ Configuration Complete

Your AI learning platform is now configured to use **DeepSeek API** for all AI operations.

### What's Configured:

**Environment Variables (`.env.local`):**

```bash
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat
```

### Files Updated:

1. **DeepSeek Client** (`src/lib/deepseek.ts`) - NEW

   - OpenAI-compatible API client
   - Streaming support
   - 5-minute timeout
   - Proper error handling

2. **AI Flow Files** - All updated to use DeepSeek:

   - `src/ai/flows/restructure-messy-pdf.ts` - Course generation
   - `src/ai/flows/generate-quiz-questions.ts` - Quiz creation
   - `src/ai/flows/audit-course.ts` - Course auditing
   - `src/ai/flows/suggest-missing-content.ts` - Content suggestions

3. **Environment Files**:
   - `.env.local` - Your local config with DeepSeek key
   - `.env.example` - Updated template for team

## 🚀 How to Use

### Start the App:

```bash
npm run dev
```

### Test Course Generation:

1. Visit http://localhost:9002
2. Upload a PDF or paste text
3. Click "Generate Course"
4. Watch console logs for progress (📚, 🤖, 📦, ✅)

## 🎯 DeepSeek Advantages

✅ **Fast Response** - Cloud-based, optimized infrastructure
✅ **No Local Setup** - No need to download models
✅ **High Quality** - Advanced reasoning capabilities
✅ **Cost Effective** - Competitive pricing
✅ **Scalable** - Handles concurrent requests

## 🔄 Fallback to Ollama (Optional)

If you want to use local Ollama as backup:

1. Keep Ollama installed and running
2. Temporarily disable DeepSeek by commenting out in `.env.local`:
   ```bash
   # DEEPSEEK_API_KEY=...
   ```
3. Switch imports back to `@/lib/ollama` in flow files

## 📊 API Limits & Pricing

**DeepSeek API:**

- Model: `deepseek-chat`
- Max tokens: 8192
- Temperature: 0.7
- Streaming: Enabled

Check https://api.deepseek.com for current pricing and limits.

## 🔍 Console Logs

You'll see progress indicators:

- 📚 Starting course generation with DeepSeek...
- 📝 Content length: X chars
- 🤖 Streaming response from DeepSeek...
- 📦 Received N chunks, X chars so far...
- ✅ DeepSeek completed. Total: X chars in N chunks

## ⚡ Performance

**Expected Generation Times:**

- Quiz questions (3-5): 10-30 seconds
- Course structure (2 modules): 30-90 seconds
- Course audit: 20-60 seconds
- Content suggestions: 15-45 seconds

Much faster than local Ollama! 🚀

## 🛠️ Troubleshooting

### API Key Error

```
DeepSeek API error 401: Unauthorized
```

**Solution:** Check your API key in `.env.local`

### Rate Limit

```
DeepSeek API error 429: Too Many Requests
```

**Solution:** Wait a moment and retry, or upgrade your plan

### Timeout

```
Course generation timed out after 5 minutes
```

**Solution:** Reduce input text length or increase timeout in `src/lib/deepseek.ts`

## 🎉 Next Steps

1. **Restart dev server** to load new changes
2. **Test course generation** with sample content
3. **Monitor console** for any errors
4. **Deploy to production** once verified

Your app is now powered by DeepSeek AI! 🚀
