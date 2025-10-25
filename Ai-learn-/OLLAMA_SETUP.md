# Ollama Setup Guide

## ✅ What Was Changed

Your AI learning platform has been migrated from Google Gemini to **local Ollama LLM**.

### Configuration Updates

**Environment Variables (`.env.local`):**

```bash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral:latest
```

### Timeout Improvements

1. **Ollama Client** (`src/lib/ollama.ts`):

   - Default timeout: **5 minutes** (was 60 seconds)
   - Configurable per request with `timeout` option

2. **Course Generation Action** (`src/app/actions.ts`):

   - Timeout increased from 60 seconds to **5 minutes**
   - Better error messages

3. **Document Analysis** (`src/ai/flows/restructure-messy-pdf.ts`):
   - Content truncated to 8000 chars for faster processing
   - Progress logging for debugging
   - Optimized JSON extraction
   - Handles markdown code blocks from LLM responses

## 🚀 Current Setup

**Your Installed Models:**

- ✅ `mistral:latest` (currently configured)
- `codellama:latest`
- `deepseek-r1:latest`
- `llama2:7b`
- `llama2:latest`

## 📝 How to Use

### Switch Models

Edit `.env.local` and change:

```bash
OLLAMA_MODEL=codellama:latest  # or any other installed model
```

### Install New Models

```bash
# Install llama3.1:8b
ollama pull llama3.1:8b

# List all available models
ollama list

# Test a model
ollama run mistral "Hello, how are you?"
```

### Verify Ollama is Running

```bash
# Check if Ollama API is accessible
curl http://localhost:11434/api/version

# Or in PowerShell
Invoke-WebRequest -Uri "http://localhost:11434/api/version"
```

## 🔧 Troubleshooting

### Timeout Errors

If still getting timeouts:

1. Use a smaller/faster model (e.g., `llama2:7b`)
2. Reduce input text length
3. Check Ollama performance: `ollama ps`

### Model Not Found

```bash
# Pull the missing model
ollama pull <model-name>

# Example
ollama pull mistral:latest
```

### Ollama Not Running

```bash
# Start Ollama service
ollama serve
```

## 📊 Performance Tips

**Faster Models:**

- `llama2:7b` - Smallest, fastest
- `mistral:latest` - Good balance (current)

**Better Quality:**

- `deepseek-r1:latest` - Advanced reasoning
- `llama3.1:8b` - Latest Llama

**For Code:**

- `codellama:latest` - Optimized for programming

## 🔍 Progress Monitoring

Console logs now show:

- 📚 Starting course generation
- 📝 Content length
- 🤖 Streaming from Ollama
- 📦 Chunk progress (every 50 chunks)
- ✅ Completion status

## 🎯 Next Steps

1. **Test the app** - Upload a document and generate a course
2. **Monitor performance** - Check console logs for timing
3. **Optimize if needed** - Switch models or adjust content length
4. **Deploy** - Once working locally, update deployment config

## 💡 Benefits

- ✅ **Free** - No API costs
- ✅ **Private** - Data stays local
- ✅ **Fast** - No network latency
- ✅ **Flexible** - Switch models anytime
- ✅ **Offline** - Works without internet
