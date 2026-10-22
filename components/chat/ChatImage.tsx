"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  src: string;
  alt: string;
  className?: string;
}

export const ChatImage = ({ src, alt, className }: Props) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={cn(
          "flex max-w-sm items-center gap-2 rounded-md border border-current/20 px-3 py-2 text-xs opacity-80",
          className
        )}
      >
        <ImageOff className="h-4 w-4 shrink-0" />
        Preview unavailable — open {alt}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      onLoad={(event) => {
        const image = event.currentTarget;
        // Tiny placeholder images are effectively unreadable; show a file row.
        if (image.naturalWidth < 24 || image.naturalHeight < 24) {
          setFailed(true);
        }
      }}
      loading="lazy"
      className={cn(
        "h-auto max-h-60 w-auto max-w-full rounded-md object-contain",
        className
      )}
    />
  );
};
