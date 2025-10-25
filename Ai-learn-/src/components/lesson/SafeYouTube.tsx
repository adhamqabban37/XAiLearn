"use client";
import React from "react";
import { useEffect, useState } from "react";
import { validateYouTubeUrl, type YouTubeValidation } from "@/lib/youtube";

type Props = {
	url: string;
	title?: string;
};

export default function SafeYouTube({ url, title }: Props) {
	const [state, setState] = useState<YouTubeValidation | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let alive = true;
		(async () => {
			try {
				const res = await validateYouTubeUrl(url);
				if (!alive) return;
				setState(res);
			} catch (e: any) {
				if (!alive) return;
				setError(e?.message || "validation failed");
			}
		})();
		return () => {
			alive = false;
		};
	}, [url]);

	if (error) {
		return (
			<div className="p-4 rounded border border-border bg-muted/40 text-sm">
				<div className="mb-2">Could not validate video.</div>
				<a
					href={url}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center px-3 py-2 rounded bg-primary text-primary-foreground hover:opacity-90"
				>
					Watch Video
				</a>
			</div>
		);
	}

	if (!state) {
		return (
			<div className="aspect-video w-full bg-muted/30 rounded animate-pulse" />
		);
	}

	// If validation indicates no playable watch URL, hide this video entirely
	if (!state.watchUrl) {
		return null;
	}

	// Less strict: allow embed for ok, unknown, region_blocked, age_restricted
	// Always fallback (no iframe) for shorts, live, private, embed_disabled, not_found
	const allowEmbedReasons: ReadonlySet<YouTubeValidation["reason"]> = new Set([
		"ok",
		"unknown",
		"region_blocked",
		"age_restricted",
	]);
	const mustFallbackReasons: ReadonlySet<YouTubeValidation["reason"]> = new Set([
		"shorts",
		"live",
		"private",
		"embed_disabled",
		"not_found",
	]);
	const shouldFallback =
		!state.embeddable || !state.embedUrl || mustFallbackReasons.has(state.reason) || !allowEmbedReasons.has(state.reason);

	if (shouldFallback) {
		return (
			<div className="p-4 rounded border border-border bg-muted/40 text-sm">
				{title && <div className="font-medium mb-1">{title}</div>}
				<div className="mb-2">This video can’t be embedded ({state.reason}).</div>
				<a
					href={state.watchUrl || url}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center px-3 py-2 rounded bg-primary text-primary-foreground hover:opacity-90"
				>
					Watch Video
				</a>
			</div>
		);
	}

	return (
		<>
			<div className="aspect-video w-full">
				<iframe
					className="w-full h-full rounded-lg"
					src={state.embedUrl || undefined}
					title={title || state.title || "YouTube video"}
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
					loading="lazy"
					referrerPolicy="strict-origin-when-cross-origin"
					allowFullScreen
				/>
			</div>
			<div className="text-xs text-muted-foreground mt-1">
				If the video doesn’t play, {" "}
				<a
					href={state.watchUrl || url}
					target="_blank"
					rel="noopener noreferrer"
					className="hover:underline"
				>
					open it on YouTube
				</a>
				.
			</div>
		</>
	);
}
