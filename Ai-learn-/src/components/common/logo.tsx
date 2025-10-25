"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState, useCallback } from "react";

type LogoProps = {
  className?: string;
  alt?: string;
  src?: string; // optional override
};

export function Logo({ className, alt, src }: LogoProps) {
  // Prefer the user's Imgur-provided logo; fall back across extensions then local svg
  const defaultBase =
    (src && src.replace(/\.(png|jpg|jpeg|webp)$/i, "")) ||
    "https://i.imgur.com/WAaRwAO"; // from user: https://imgur.com/WAaRwAO
  const [imgSrc, setImgSrc] = useState<string>(`${defaultBase}.png`);

  const handleError = useCallback(() => {
    // If currently trying .png, try .jpg next; else fall back to local asset
    if (imgSrc.endsWith(".png")) {
      setImgSrc(`${defaultBase}.jpg`);
    } else if (imgSrc.endsWith(".jpg")) {
      setImgSrc("/logo.svg");
    }
  }, [imgSrc, defaultBase]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <Image
          src={imgSrc}
          alt={alt ?? "AI Course Crafter Logo"}
          width={40}
          height={40}
          className="w-10 h-10 rounded-md object-cover"
          priority
          onError={handleError}
        />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-lg font-bold text-foreground">AI Learn</span>
        <span className="text-xs text-muted-foreground font-medium">
          AI Course Crafter
        </span>
      </div>
    </div>
  );
}
