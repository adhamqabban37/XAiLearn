"use client";

import { useEffect, useState } from "react";

type LogItem = {
  id?: string;
  created_at?: string;
  originalurl?: string; // Supabase might lowercase column names depending on config
  originalUrl?: string;
  originalId?: string;
  reason?: string;
  replacementId?: string;
  replacementTitle?: string;
  replacementAuthor?: string;
  replacementWatchUrl?: string;
  contextTitle?: string;
};

export default function ReplacementsPage() {
  const [items, setItems] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch("/api/video-replacements?limit=100");
        const j = await r.json();
        if (!cancelled) setItems(j.items || []);
      } catch (e: any) {
        if (!cancelled)
          setError(e?.message || "Failed to load video replacement logs");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Video Replacements</h1>
      <p className="text-sm text-muted-foreground mb-4">
        When a YouTube video is unavailable, the system will attempt to suggest a
        similar video and replace it automatically. This table shows recent
        replacements for review.
      </p>
      {loading && <div>Loading…</div>}
      {error && (
        <div className="text-red-600 text-sm mb-3">Error: {error}</div>
      )}
      {!loading && items.length === 0 && (
        <div className="text-sm text-muted-foreground">No replacements yet.</div>
      )}
      {items.length > 0 && (
        <div className="overflow-x-auto border rounded-md">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-left">
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Context</th>
                <th className="px-3 py-2">Original</th>
                <th className="px-3 py-2">Reason</th>
                <th className="px-3 py-2">Replacement</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => {
                const when = it.created_at || "";
                const originalUrl = (it as any).originalUrl || (it as any).originalurl || "";
                const repTitle = it.replacementTitle || it.replacementId || "";
                const repUrl = it.replacementWatchUrl || (it.replacementId ? `https://www.youtube.com/watch?v=${it.replacementId}` : "");
                return (
                  <tr key={idx} className="border-t">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {when ? new Date(when).toLocaleString() : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium">
                        {it.contextTitle || "Untitled context"}
                      </div>
                    </td>
                    <td className="px-3 py-2 max-w-[320px] truncate">
                      {originalUrl ? (
                        <a
                          href={originalUrl}
                          className="text-primary hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {originalUrl}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2">{it.reason || "unknown"}</td>
                    <td className="px-3 py-2 max-w-[320px] truncate">
                      {repUrl ? (
                        <a
                          href={repUrl}
                          className="text-primary hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {repTitle}
                        </a>
                      ) : (
                        repTitle || "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
