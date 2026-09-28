import type { ApiFailure, ApiSuccess } from "@/types/api";

export class ApiError extends Error {
  status: number;
  errors: string[];

  constructor(status: number, message: string, errors: string[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

/** Unwraps the backend's `{ success, message, data }` envelope or throws ApiError. */
export async function parseEnvelope<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => null)) as ApiSuccess<T> | ApiFailure | null;
  if (!res.ok || !body || body.success === false) {
    const message = body?.message ?? `Request failed with status ${res.status}`;
    const errors = body && "errors" in body && body.errors ? body.errors : [];
    throw new ApiError(res.status, message, errors);
  }
  return body.data;
}

/** Human-readable message for toasts. */
export function errorMessage(error: unknown, fallback = "Something went wrong") {
  if (error instanceof ApiError) {
    return error.errors.length ? `${error.message}: ${error.errors.join(", ")}` : error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
