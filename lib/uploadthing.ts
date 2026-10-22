"use client";

import { useCallback, useRef, useState } from "react";

export interface UploadedFile {
  url: string;
  name: string;
  size: number;
  key: string;
  type: string;
}

interface UploadOptions {
  onClientUploadComplete?: (files: UploadedFile[]) => void;
  onUploadError?: (error: Error) => void;
  onUploadProgress?: (progress: number) => void;
  onUploadBegin?: (fileName: string) => void;
}

async function uploadOne(file: File): Promise<UploadedFile> {
  const body = new FormData();
  body.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || "Upload failed");
  }

  return response.json();
}

export async function uploadFiles(files: File[]): Promise<UploadedFile[]> {
  return Promise.all(files.map(uploadOne));
}

/**
 * A local, token-free replacement for UploadThing's React hook.
 * Files are stored under /public/uploads by the upload API.
 */
export function useUploadThing(
  _endpoint: string,
  options: UploadOptions = {}
) {
  const [isUploading, setIsUploading] = useState(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const startUpload = useCallback(async (files: File[]) => {
    if (!files.length) return [];

    setIsUploading(true);

    try {
      optionsRef.current.onUploadBegin?.(files[0].name);

      const uploaded: UploadedFile[] = [];
      for (const file of files) {
        uploaded.push(await uploadOne(file));
      }

      optionsRef.current.onUploadProgress?.(100);
      optionsRef.current.onClientUploadComplete?.(uploaded);
      return uploaded;
    } catch (error) {
      const uploadError =
        error instanceof Error ? error : new Error("Upload failed");
      optionsRef.current.onUploadError?.(uploadError);
      return undefined;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return { startUpload, isUploading };
}
