"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, ExternalLink, AlertCircle } from "lucide-react";

type EmbedStatus = "loading" | "ok" | "blocked" | "invalid" | "deleted";
type ValidateResponse = {
  embeddable: boolean;
  id: string | null;
  embedUrl: string | null;
  watchUrl: string | null;
  reason:
    | "ok"
    | "invalid_url"
    | "playlist"
    | "shorts"
    | "live"
    | "private"
    | "age_restricted"
    | "embed_disabled"
    | "region_blocked"
    | "not_found"
    | "unknown";
  title?: string;
  author?: string;
  thumbnail?: string;
  pending?: boolean;
  debugReason?: string;
};
type VideoMetadata = {
  title?: string;
  author?: string;
  thumbnail?: string;
  reason?: string;
};

function extractYouTubeId(rawUrl: string): string | null {
  // Early validation - check if URL is valid and not empty
  if (!rawUrl || typeof rawUrl !== "string" || rawUrl.trim() === "") {
    console.warn("❌ Empty or invalid URL provided to YouTubeEmbed");
    return null;
  }

  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace(/^www\./, "");

    // Handle youtu.be short links
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && id.length === 11 ? id : null;
    }

    if (host.endsWith("youtube.com")) {
      const path = url.pathname;
      // Standard watch URL
      if (path === "/watch") {
        const v = url.searchParams.get("v");
        return v && v.length === 11 ? v : null;
      }
      // Embedded styles
      const parts = path.split("/").filter(Boolean);
      // /embed/{id} or /v/{id}
      if ((parts[0] === "embed" || parts[0] === "v") && parts[1]) {
        return parts[1].length === 11 ? parts[1] : null;
      }
      // /shorts/{id}
      if (parts[0] === "shorts" && parts[1]) {
        return parts[1].length === 11 ? parts[1] : null;
      }
      // /live/{id}
      if (parts[0] === "live" && parts[1]) {
        return parts[1].length === 11 ? parts[1] : null;
      }
    }
  } catch {
    // fallthrough
  }
  // Final regex fallback for odd cases
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = rawUrl.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export function YouTubeEmbed({ url, title }: { url: string; title?: string }) {
  // Allow overriding the video id when we suggest a replacement
  const [overrideId, setOverrideId] = useState<string | null>(null);
  const videoId = useMemo(() => overrideId || extractYouTubeId(url), [url, overrideId]);
  const [status, setStatus] = useState<EmbedStatus>("loading");
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [showEmbed, setShowEmbed] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestionNote, setSuggestionNote] = useState<string | null>(null);

  // Generate thumbnail URLs (YouTube provides multiple resolutions)
  const thumbnailUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    : null;
  const fallbackThumbnail = videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : null;

  useEffect(() => {
    let cancelled = false;

    async function validateVideo() {
      if (!videoId) {
        console.warn("❌ Invalid YouTube URL:", url);
        setStatus("invalid");
        return;
      }

      console.log("✅ Extracted YouTube video ID:", videoId, "from:", url);

      try {
        // Server validation and normalization (oEmbed + Data API)
        const res = await fetch(
          `/api/youtube-validate?url=${encodeURIComponent(url)}`
        );

        if (cancelled) return;

        if (res.ok) {
          const data: ValidateResponse = await res.json();
          if (data.embeddable) {
            console.log(`📹 Video ${videoId} is valid and embeddable`);
            setMetadata({
              title: data.title,
              author: data.author,
              thumbnail: data.thumbnail,
            });
            setStatus("ok");
          } else {
            console.warn(`⚠️ Video ${videoId} blocked: ${data.reason}`);
            
            // Detect deleted/not found videos
            const isDeleted = data.reason === "not_found" || 
                            data.debugReason?.includes("not_found") ||
                            (!data.title && !data.author);
            
            setMetadata({
              title: data.title || (isDeleted ? "Video Not Available" : "Restricted Video"),
              author: data.author,
              thumbnail: data.thumbnail,
              reason: data.reason,
            });
            setStatus(isDeleted ? "deleted" : "blocked");

            // Quick troubleshooting: try to suggest a similar video using the title
            if (!cancelled && title) {
              try {
                setSuggesting(true);
                const r = await fetch("/api/youtube-repair", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ url, title }),
                });
                if (!cancelled && r.ok) {
                  const rep: any = await r.json();
                  if (rep?.pending) {
                    setSuggestionNote("Alternative submitted for admin review");
                  } else if (rep?.replaced && rep?.embeddable && rep?.id) {
                    // Use replacement id for thumbnails/iframe and clear the old title per request
                    setOverrideId(rep.id);
                    setMetadata({
                      title: undefined, // erase original title display
                      author: rep.author,
                      thumbnail: rep.thumbnail,
                    });
                    setSuggestionNote(
                      rep.title ? `Suggested: ${rep.title}` : "Suggested an alternative video"
                    );
                    setStatus("ok");
                    setShowEmbed(false); // show poster again; user can click to play
                  }
                }
              } catch (e) {
                // ignore suggestion failure; user can still open on YouTube
              } finally {
                if (!cancelled) setSuggesting(false);
              }
            }
          }
        } else {
          console.warn(`⚠️ Video ${videoId} not embeddable or not found`);
          setStatus("blocked");
        }
      } catch (err) {
        console.warn("⚠️ validation failed for:", videoId, err);
        if (!cancelled) {
          // On network error, prefer safe fallback to avoid broken iframes
          setStatus("blocked");
        }
      }
    }

    validateVideo();
    return () => {
      cancelled = true;
    };
  }, [url, videoId]);

  // If truly invalid (bad ID), render a friendly fallback
  if (!videoId || status === "invalid") {
    return (
      <div className="w-full rounded-md border bg-secondary/30 p-3 text-sm text-muted-foreground flex items-center gap-2 leading-relaxed">
        <AlertCircle className="h-4 w-4 shrink-0" /> Invalid or unsupported YouTube URL
      </div>
    );
  }

  // Loading state with thumbnail
  if (status === "loading") {
    return (
      <div className="aspect-video w-full rounded-lg overflow-hidden bg-secondary/30 relative touch-target">
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt="Loading video..."
            className="w-full h-full object-cover"
            onError={(e) => {
              if (fallbackThumbnail) {
                (e.target as HTMLImageElement).src = fallbackThumbnail;
              }
            }}
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-spin" />
        </div>
      </div>
    );
  }

  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  if (origin) params.set("origin", origin);

  // Helper function to get user-friendly reason message
  const getReasonMessage = (reason?: string) => {
    switch (reason) {
      case "private": return "This video is private";
      case "age_restricted": return "This video is age-restricted";
      case "embed_disabled": return "Embedding disabled by owner";
      case "region_blocked": return "This video is not available in your region";
      case "not_found": return "This video has been deleted or is unavailable";
      case "shorts": return "YouTube Shorts cannot be embedded";
      case "live": return "This is a live stream";
      case "playlist": return "Playlists are not supported";
      default: return "Video unavailable to embed";
    }
  };

  // Enhanced fallback card for deleted videos
  if (status === "deleted") {
    return (
      <div className="w-full rounded-lg border border-destructive/50 bg-destructive/5 overflow-hidden">
        <div className="aspect-video w-full bg-muted/50 flex items-center justify-center relative">
          {thumbnailUrl && (
            <img
              src={thumbnailUrl}
              alt="Deleted video"
              className="w-full h-full object-cover opacity-30"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <p className="text-sm font-medium text-center">Video Not Available</p>
            <p className="text-xs text-muted-foreground text-center">
              This video has been deleted or is no longer accessible
            </p>
          </div>
        </div>
        <div className="p-3 space-y-2">
          <p className="text-sm font-medium text-destructive">
            {metadata?.title || "Deleted Video"}
          </p>
          {metadata?.author && (
            <p className="text-xs text-muted-foreground">by {metadata.author}</p>
          )}
        </div>
      </div>
    );
  }

  // If blocked, show a resilient card with a link to watch on YouTube and allow manual suggestion
  if (status === "blocked") {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const reasonMessage = getReasonMessage(metadata?.reason);
    
    return (
      <div className="w-full rounded-lg border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {/* Thumbnail section */}
        <div 
          className="aspect-video w-full bg-muted relative group cursor-pointer"
          onClick={() => window.open(watchUrl, "_blank")}
        >
          {thumbnailUrl && (
            <img
              src={thumbnailUrl}
              alt={metadata?.title || "YouTube video"}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              onError={(e) => {
                if (fallbackThumbnail && (e.target as HTMLImageElement).src !== fallbackThumbnail) {
                  (e.target as HTMLImageElement).src = fallbackThumbnail;
                } else {
                  (e.target as HTMLImageElement).style.display = "none";
                }
              }}
            />
          )}
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
            <div className="text-center space-y-2">
              <AlertCircle className="w-12 h-12 text-white mx-auto" />
              <p className="text-white text-sm font-medium px-4">{reasonMessage}</p>
            </div>
          </div>
        </div>
        
        {/* Info section */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="text-sm font-semibold line-clamp-2">
              {metadata?.title || "Restricted Video"}
            </h3>
            {metadata?.author && (
              <p className="text-xs text-muted-foreground mt-1">by {metadata.author}</p>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <a
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open on YouTube <ExternalLink className="h-3 w-3" />
            </a>
            
            {title && !suggesting && !suggestionNote && (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium hover:bg-secondary rounded-md transition-colors border"
                onClick={async () => {
                  try {
                    setSuggesting(true);
                    const r = await fetch("/api/youtube-repair", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ url, title }),
                    });
                    if (r.ok) {
                      const rep: any = await r.json();
                      if (rep?.pending) {
                        setSuggestionNote("Alternative submitted for admin review");
                      } else if (rep?.replaced && rep?.embeddable && rep?.id) {
                        setOverrideId(rep.id);
                        setMetadata({ title: undefined, author: rep.author, thumbnail: rep.thumbnail });
                        setSuggestionNote(rep.title ? `Suggested: ${rep.title}` : "Suggested an alternative");
                        setStatus("ok");
                        setShowEmbed(false);
                      }
                    }
                  } finally {
                    setSuggesting(false);
                  }
                }}
                disabled={suggesting}
              >
                {suggesting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" /> Finding alternative...
                  </>
                ) : (
                  "Find similar video"
                )}
              </button>
            )}
          </div>
          
          {suggestionNote && (
            <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
              {suggestionNote}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show thumbnail initially, load iframe on click for better performance
  if (!showEmbed) {
    return (
      <div
        className="aspect-video w-full rounded-lg overflow-hidden cursor-pointer group relative touch-target"
        onClick={() => setShowEmbed(true)}
      >
        <img
          src={thumbnailUrl || fallbackThumbnail || ""}
          alt={metadata?.title || "YouTube video"}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          onError={(e) => {
            if (
              fallbackThumbnail &&
              (e.target as HTMLImageElement).src !== fallbackThumbnail
            ) {
              (e.target as HTMLImageElement).src = fallbackThumbnail;
            }
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
          {/* YouTube play button */}
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-600 rounded-full flex items-center justify-center group-hover:bg-red-700 transition-colors">
            <svg
              className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-1"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        {/* If we suggested a replacement, hide original title; optionally show a small note */}
        {(metadata?.title || suggestionNote) && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 sm:p-3">
            {metadata?.title && (
              <p className="text-white text-xs sm:text-sm font-medium line-clamp-2 leading-snug">
                {metadata.title}
              </p>
            )}
            {suggestionNote && (
              <p className="text-white/90 text-xs leading-snug">{suggestionNote}</p>
            )}
            {metadata?.author && (
              <p className="text-white/70 text-xs mt-1">{metadata.author}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="aspect-video w-full rounded-lg overflow-hidden">
      <iframe
        className="w-full h-full"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}&autoplay=1`}
        title={metadata?.title || "YouTube video player"}
        referrerPolicy="origin-when-cross-origin"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}
