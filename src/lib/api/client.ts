"use client";

import { BFF_PREFIX } from "@/lib/config";
import { createEndpoints, type Fetcher } from "./endpoints";
import { ApiError, parseEnvelope } from "./errors";

/** Fired when the BFF returns 401 after its refresh attempt; the session provider redirects to /login. */
export const SESSION_EXPIRED_EVENT = "surplusbid:session-expired";

const clientFetch: Fetcher = async <T>(path: string, init: Parameters<Fetcher>[1] = {}) => {
  const { next: _next, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(`${BFF_PREFIX}${path}`, { ...rest, credentials: "same-origin" });
  } catch {
    throw new ApiError(0, "Network error. Check your connection and try again.");
  }
  if (res.status === 401) window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  return parseEnvelope<T>(res);
};

export const api = createEndpoints(clientFetch);

/**
 * Multipart upload with progress reporting (fetch has no upload progress).
 * Goes through the same BFF route so the bearer token stays server-side.
 */
export function uploadWithProgress<T>(
  path: string,
  form: FormData,
  onProgress: (percent: number) => void,
  method: "POST" | "PATCH" = "POST",
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, `${BFF_PREFIX}${path}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () => reject(new ApiError(0, "Upload failed. Check your connection and try again."));
    xhr.onload = () => {
      if (xhr.status === 401) window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      const res = new Response(xhr.responseText, { status: xhr.status });
      parseEnvelope<T>(res).then(resolve, reject);
    };
    xhr.send(form);
  });
}
