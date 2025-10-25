/**
 * Optimized Image Upload Component
 *
 * Handles image uploads with automatic WebP conversion,
 * compression, and validation.
 */

"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { convertToWebP } from "@/lib/image-optimization";

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  maxSizeMB?: number;
  acceptedFormats?: string[];
  convertToWebP?: boolean;
}

export function ImageUpload({
  onUploadComplete,
  maxSizeMB = 5,
  acceptedFormats = ["image/jpeg", "image/png", "image/gif", "image/webp"],
  convertToWebP: shouldConvertToWebP = true,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset state
    setError(null);
    setProgress(0);

    // Validate file type
    if (!acceptedFormats.includes(file.type)) {
      setError(`Invalid file type. Accepted: ${acceptedFormats.join(", ")}`);
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setError(`File too large. Maximum size: ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);

    try {
      let fileToUpload = file;

      // Convert to WebP if enabled and not already WebP
      if (shouldConvertToWebP && file.type !== "image/webp") {
        setProgress(20);
        const webpBlob = await convertToWebP(file);

        if (webpBlob) {
          fileToUpload = new File(
            [webpBlob],
            file.name.replace(/\.[^/.]+$/, ".webp"),
            {
              type: "image/webp",
            }
          );

          const savedSize = ((file.size - webpBlob.size) / file.size) * 100;
          console.log(
            `WebP conversion saved ${savedSize.toFixed(1)}% file size`
          );
        }
      }

      setProgress(40);

      // Generate preview
      const previewUrl = URL.createObjectURL(fileToUpload);
      setPreview(previewUrl);
      setProgress(60);

      // Upload to server
      const formData = new FormData();
      formData.append("file", fileToUpload);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setProgress(100);

      // Call success callback
      onUploadComplete(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const triggerUpload = () => {
    inputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept={acceptedFormats.join(",")}
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {preview && (
        <div className="relative w-full max-w-md mx-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview"
            className="w-full h-auto rounded-lg border"
          />
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-muted-foreground text-center">
            {progress < 40
              ? "Optimizing..."
              : progress < 60
              ? "Processing..."
              : "Uploading..."}
          </p>
        </div>
      )}

      <Button onClick={triggerUpload} disabled={uploading} className="w-full">
        {uploading ? "Uploading..." : "Upload Image"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Max size: {maxSizeMB}MB •{" "}
        {shouldConvertToWebP && "Auto-converts to WebP • "}
        Formats: JPG, PNG, GIF, WebP
      </p>
    </div>
  );
}
