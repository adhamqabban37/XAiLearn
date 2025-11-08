import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import multer from "multer";
import { parsePdfBuffer } from "@/lib/pdf";
import { validateYouTubeUrl } from "@/lib/youtube";

// Configure multer for in-memory storage
const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES },
});

// Create the handler using next-connect
const router = createRouter<
  NextApiRequest & { file: Express.Multer.File },
  NextApiResponse
>();

// Use the multer middleware to handle single file uploads on the 'file' field
router.use(upload.single("file") as any);

// Define the POST handler
router.post(
  async (
    req: NextApiRequest & { file: Express.Multer.File },
    res: NextApiResponse
  ) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({
          error: 'No file uploaded. Please include a file in the "file" field.',
        });
      }
      // Enforce server-side size validation as a safety net
      if (typeof file.size === "number" && file.size > MAX_FILE_BYTES) {
        return res.status(413).json({
          error: `PDF is too large. Max size is ${Math.floor(MAX_FILE_BYTES / (1024 * 1024))} MB.`,
        });
      }

      // Optional: You can check mime type from client, but buffer check is more reliable
      if (!file.mimetype?.includes("pdf")) {
        // For robustness, reject non-PDF uploads early
        return res.status(415).json({
          error: `Unsupported file type: ${file.mimetype || "unknown"}. Please upload a PDF.`,
        });
      }

      // The 'file.buffer' is a Node.js Buffer provided by multer.memoryStorage()
      // Bound PDF parsing to avoid long stalls on large/corrupted files
      const data = await withTimeout(parsePdfBuffer(file.buffer), 10_000);

      const text: string = data.text || "";

      // Extract YouTube URLs from the parsed text
      const urls = extractYouTubeUrls(text);
      console.log(`🔍 Extracted ${urls.length} potential YouTube URLs from PDF`);

      // Validate and normalize each YouTube URL
      const validations = await Promise.all(
        urls.map((u) => withTimeout(validateYouTubeUrl(u), 8000).catch(err => {
          console.warn(`⚠️ Video validation failed for ${u}:`, err.message);
          return null;
        }))
      );
      
      console.log(`✅ Validated ${validations.filter((v): v is NonNullable<typeof v> => v !== null && v.id !== null && v.watchUrl !== null).length} of ${urls.length} videos`);

      // Dedupe by video ID and filter out empties
      const seen = new Set<string>();
      const videos = validations
        .filter((v): v is NonNullable<typeof v> => v !== null && v.id !== null && v.watchUrl !== null)
        .filter((v) => {
          if (!v.id) return false;
          if (seen.has(v.id)) return false;
          seen.add(v.id);
          return true;
        });

      return res.status(200).json({
        text,
        numPages: data.numpages,
        info: data.info ?? {},
        videos,
      });
    } catch (err: any) {
      // Map timeouts to a 504-style message but keep 200-range to avoid hard platform 502s
      const msg = String(err?.message || "unknown error");
      if (/timeout/i.test(msg)) {
        return res.status(504).json({
          error:
            "PDF parsing timed out. Please try a smaller PDF or try again.",
        });
      }
      // Return a sanitized error message
      return res.status(500).json({ error: `Failed to parse PDF: ${msg}` });
    }
  }
);

// Required for multer to work with Next.js API routes
export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default router.handler({
  onError(
    err: any,
    req: NextApiRequest & { file: Express.Multer.File },
    res: NextApiResponse
  ) {
    // Handle common Multer errors explicitly
    if (
      err &&
      (err.code === "LIMIT_FILE_SIZE" || /File too large/i.test(err.message))
    ) {
      return res.status(413).json({
        error: `PDF is too large. Max size is ${Math.floor(MAX_FILE_BYTES / (1024 * 1024))} MB.`,
      });
    }
    res
      .status(500)
      .json({ error: `Upload error: ${err?.message || "unknown error"}` });
  },
  onNoMatch(
    req: NextApiRequest & { file: Express.Multer.File },
    res: NextApiResponse
  ) {
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  },
});

// --- helpers ---
function extractYouTubeUrls(text: string): string[] {
  if (!text) return [];
  const found = new Set<string>();
  
  // Improved URL patterns - more comprehensive YouTube URL detection
  const patterns = [
    // Standard YouTube URLs
    /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/gi,
    // YouTube URLs with extra parameters
    /https?:\/\/(?:www\.)?youtube\.com\/watch\?[^"\s\)\]\}>]*v=([a-zA-Z0-9_-]{11})/gi,
    // Mobile YouTube URLs
    /https?:\/\/m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/gi,
    // YouTube URLs in parentheses or brackets (common in PDFs)
    /\(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/gi,
    // Bare video IDs that might be mentioned (with context)
    /(?:watch|video|youtube)[\s:]*[=:]?[\s]*([a-zA-Z0-9_-]{11})/gi,
  ];

  // Extract URLs using patterns
  patterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const videoId = match[1];
      if (videoId && videoId.length === 11) {
        found.add(`https://www.youtube.com/watch?v=${videoId}`);
      }
    }
  });

  // Also catch full URLs with standard regex (fallback)
  const urlRegex = /(https?:\/\/[^\s\)\]\}>"']+)/gim;
  const candidates = text.match(urlRegex) || [];

  for (const raw of candidates) {
    const cleaned = raw
      .replace(/[\),.;\]\}>"']+$/g, "")
      .replace(/^\((.*)\)$/, "$1");
    try {
      const u = new URL(cleaned);
      const host = u.hostname.replace(/^www\./, "");
      if (
        host.includes("youtube.com") ||
        host === "youtu.be" ||
        host.includes("m.youtube.com")
      ) {
        found.add(cleaned);
      }
    } catch {
      // ignore invalid URLs
    }
  }

  // Also catch bare youtu.be or youtube.com without scheme (rare in PDFs)
  const bareRegex =
    /(?:^|\s)(?:youtu\.be\/[\w-]{11}|(?:m\.)?youtube\.com\/[\S]+)/gim;
  const bareMatches = text.match(bareRegex) || [];
  for (const m of bareMatches) {
    const cleaned = ("https://" + m.trim())
      .replace(/^[^h]*https:\/\//, "https://")
      .replace(/[\),.;\]\}>"']+$/g, "");
    found.add(cleaned);
  }

  return Array.from(found);
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    ),
  ]);
}
