"use client";
import { useRef, useState } from "react";
import type { Course } from "@/lib/types";
import { generateCourseFromText } from "@/app/actions";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Loader2, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { YouTubeValidation } from "@/lib/youtube";
import YouTubeBatchRenderer from "@/components/lesson/youtube-batch-renderer";

type Props = {
  onCourseGenerated?: (course: Course) => void;
};

export default function PdfUploadClient({ onCourseGenerated }: Props) {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<string | null>(null);
  const [videos, setVideos] = useState<YouTubeValidation[]>([]);
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);

    try {
      setPhase("Uploading and extracting PDF text...");
      // 1) Parse via /api/upload quickly with a timeout
      const controller = new AbortController();
      const to = setTimeout(() => controller.abort(), 25_000);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
        signal: controller.signal,
      }).finally(() => clearTimeout(to));

      if (!res.ok) {
        let msg = `Failed to upload/parse PDF (status ${res.status}).`;
        try {
          const err = await res.json();
          if (err?.error) msg = err.error;
        } catch {}
        throw new Error(msg);
      }

      const parsed = await res.json();
      let text: string = parsed?.text || "";
      const vids: YouTubeValidation[] = Array.isArray(parsed?.videos)
        ? parsed.videos
        : [];
      setVideos(vids);
      if (!text || text.trim().length < 50) {
        throw new Error(
          "The PDF content is too short or could not be extracted. Please try uploading a longer PDF with more text content."
        );
      }
      // 2) Cap long text to speed up AI
      const MAX_CHARS = 16000; // ~16k chars cap
      if (text.length > MAX_CHARS) {
        text = text.slice(0, MAX_CHARS);
      }

      setPhase("Analyzing with AI...");
      slowTimer.current = setTimeout(() => {
        setPhase("Still analyzing... larger PDFs can take up to a minute.");
      }, 20_000);

      // Extract videos from PDF if available
      const pdfVideos = parsed?.videos || [];
      console.log(
        `🎥 Passing ${pdfVideos.length} videos from PDF to course generation`
      );
      const courseResult = await generateCourseFromText(
        text,
        undefined,
        pdfVideos
      );
      if (slowTimer.current) {
        clearTimeout(slowTimer.current);
        slowTimer.current = null;
      }
      if (courseResult && "error" in courseResult) {
        throw new Error(courseResult.error);
      }
      if (courseResult && onCourseGenerated) {
        onCourseGenerated(courseResult as Course);
      }
      setResult("PDF processed and course generated successfully.");
      setPhase(null);
    } catch (err: any) {
      setError(err.message || "Unknown error during upload.");
      setPhase(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Study Material</CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload PDF, JSON, or TXT files to generate quizzes
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            type="file"
            name="file"
            accept="application/pdf,.json,.txt,text/plain,application/json"
            required
            disabled={loading}
          />
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload and Parse
          </Button>
        </form>
        {phase && (
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{phase}</span>
          </div>
        )}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {result && (
          <Alert className="mt-4">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>{result}</AlertDescription>
          </Alert>
        )}

        {videos?.length > 0 && (
          <div className="mt-6">
            <YouTubeBatchRenderer
              videos={videos}
              title="Videos detected in your PDF"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
