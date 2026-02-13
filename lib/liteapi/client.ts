import { z } from "zod";

const API_BASE = "https://api.liteapi.travel/v3.0";
const BOOK_BASE = "https://book.liteapi.travel/v3.0";

const liteApiErrorSchema = z.object({
  error: z
    .object({
      code: z.number().optional(),
      description: z.string().optional(),
      message: z.string().optional(),
    })
    .optional(),
});

export class LiteApiError extends Error {
  status: number;
  code?: number;
  description?: string;

  constructor(message: string, status: number, code?: number, description?: string) {
    super(message);
    this.name = "LiteApiError";
    this.status = status;
    this.code = code;
    this.description = description;
  }
}

function getApiKey() {
  const key = process.env.LITEAPI_KEY;
  if (!key) {
    throw new LiteApiError(
      "Missing LITEAPI_KEY. Set it in your environment.",
      500,
      0,
      "Missing API key"
    );
  }
  return key;
}

type RequestOptions = RequestInit & { retries?: number };

function shouldRetryStatus(status: number) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function request<T>(baseUrl: string, path: string, options?: RequestOptions): Promise<T> {
  const key = getApiKey();
  const url = `${baseUrl}${path}`;
  const retries = options?.retries ?? 0;

  const init: RequestInit = { ...(options ?? {}) };
  if ("retries" in init) {
    delete (init as RequestOptions).retries;
  }

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          "X-API-Key": key,
          accept: "application/json",
          ...(init?.body ? { "content-type": "application/json" } : {}),
          ...(init?.headers ?? {}),
        },
        cache: "no-store",
      });

      const text = await response.text();
      let parsedJson: unknown = {};
      try {
        parsedJson = text ? JSON.parse(text) : {};
      } catch {
        parsedJson = { raw: text };
      }

      if (!response.ok) {
        if (attempt < retries && shouldRetryStatus(response.status)) {
          const backoffMs = 250 * 2 ** attempt + Math.round(Math.random() * 100);
          await delay(backoffMs);
          continue;
        }

        const parsed = liteApiErrorSchema.safeParse(parsedJson);
        const message =
          parsed.success && parsed.data.error?.message
            ? parsed.data.error.message
            : `LiteAPI request failed (${response.status})`;

        throw new LiteApiError(
          message,
          response.status,
          parsed.success ? parsed.data.error?.code : undefined,
          parsed.success ? parsed.data.error?.description : undefined
        );
      }

      return parsedJson as T;
    } catch (error) {
      const isLastAttempt = attempt >= retries;
      if (isLastAttempt) throw error;
      const backoffMs = 250 * 2 ** attempt + Math.round(Math.random() * 100);
      await delay(backoffMs);
    }
  }

  throw new LiteApiError("LiteAPI request failed after retries", 500);
}

export function liteDataGet<T>(path: string) {
  return request<T>(API_BASE, path, { method: "GET", retries: 2 });
}

export function liteDataPost<T>(path: string, body: unknown) {
  // Search/lookup endpoints can tolerate retries.
  return request<T>(API_BASE, path, {
    method: "POST",
    body: JSON.stringify(body),
    retries: 1,
  });
}

export function liteBookPost<T>(path: string, body: unknown) {
  // Booking writes should avoid automatic retries to prevent duplicate side-effects.
  return request<T>(BOOK_BASE, path, {
    method: "POST",
    body: JSON.stringify(body),
    retries: 0,
  });
}
