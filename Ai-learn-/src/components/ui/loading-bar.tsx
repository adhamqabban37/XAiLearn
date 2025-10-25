"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingBarProps {
  /** Progress value from 0-100 */
  progress: number;
  /** Status message to display during loading */
  status?: string;
  /** Whether the loading bar is visible */
  visible?: boolean;
  /** Variant style: 'top-bar' (fixed at top) or 'inline' (embedded in component) */
  variant?: "top-bar" | "inline";
  /** Additional CSS classes */
  className?: string;
}

/**
 * LoadingBar component
 *
 * A smooth, animated progress bar with optional status messages.
 * Supports top-fixed bar for global loading states and inline mode for embedded use.
 *
 * @example
 * ```tsx
 * <LoadingBar
 *   progress={uploadProgress}
 *   status="Analyzing PDF..."
 *   visible={isUploading}
 *   variant="top-bar"
 * />
 * ```
 */
export function LoadingBar({
  progress,
  status,
  visible = true,
  variant = "inline",
  className,
}: LoadingBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    if (visible) {
      // Smoothly animate progress changes
      const timer = setTimeout(() => {
        setDisplayProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayProgress(0);
    }
  }, [progress, visible]);

  if (!visible) return null;

  if (variant === "top-bar") {
    return (
      <div className={cn("fixed top-0 left-0 w-full z-50", className)}>
        <div className="h-1 bg-muted/20 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary via-accent to-primary animate-shimmer transition-all duration-300 ease-out"
            style={{
              width: `${displayProgress}%`,
              backgroundSize: "200% 100%",
            }}
          />
        </div>
        {status && (
          <div className="bg-card/95 backdrop-blur-sm border-b border-border py-2 px-4 flex items-center gap-2 shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">{status}</span>
            <span className="ml-auto text-xs font-medium text-muted-foreground">
              {Math.round(displayProgress)}%
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        {status && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>{status}</span>
          </div>
        )}
        <span className="ml-auto text-xs font-medium text-muted-foreground">
          {Math.round(displayProgress)}%
        </span>
      </div>
      <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary via-accent to-primary animate-shimmer transition-all duration-300 ease-out rounded-full"
          style={{
            width: `${displayProgress}%`,
            backgroundSize: "200% 100%",
          }}
        />
      </div>
    </div>
  );
}
