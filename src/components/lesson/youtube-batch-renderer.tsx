"use client";
import React from "react";
import type { YouTubeValidation } from "@/lib/youtube";

type Props = {
	videos: YouTubeValidation[];
	title?: string;
};

export default function YouTubeBatchRenderer({ videos, title }: Props) {
	if (!Array.isArray(videos) || videos.length === 0) return null;
	const safe = videos.filter((v) => v && v.id && v.watchUrl);
	if (safe.length === 0) return null;

	return (
		<div className="mt-6 space-y-4">
			{title && <h3 className="text-lg font-semibold">{title}</h3>}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{safe.map((v) => {
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
										!v.embeddable || !v.embedUrl || mustFallbackReasons.has(v.reason) || !allowEmbedReasons.has(v.reason);
							return (
								<div key={v.id} className="space-y-2">
									{v.title && <div className="text-sm font-medium">{v.title}</div>}
									{shouldFallback ? (
										<div className="p-4 rounded border border-border bg-muted/40 text-sm">
											<div className="mb-2">This video can’t be embedded ({v.reason}).</div>
											<a
												href={v.watchUrl!}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center px-3 py-2 rounded bg-primary text-primary-foreground hover:opacity-90"
											>
												Watch Video
											</a>
										</div>
									) : (
										<>
											<div className="aspect-video w-full">
												<iframe
													className="w-full h-full rounded-lg"
													  src={v.embedUrl || undefined}
													title={v.title || `YouTube ${v.id}`}
													allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
													loading="lazy"
													referrerPolicy="strict-origin-when-cross-origin"
													allowFullScreen
												/>
											</div>
											<div className="text-xs text-muted-foreground">
												If the video doesn’t play, 
												{" "}
												<a
													href={v.watchUrl!}
													target="_blank"
													rel="noopener noreferrer"
													className="hover:underline"
												>
													open it on YouTube
												</a>
												.
											</div>
										</>
									)}
								</div>
							);
						})}
			</div>
		</div>
	);
}
