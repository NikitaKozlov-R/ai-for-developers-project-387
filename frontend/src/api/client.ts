import type { ApiErrorBody, ErrorCode } from "./types";

/** Клиент всегда ходит в относительный /api — префикс разворачивает прокси Vite. */
const API_BASE = "/api";

const KNOWN_ERROR_CODES: ReadonlySet<string> = new Set<ErrorCode>([
  "NOT_FOUND",
  "VALIDATION_ERROR",
  "SLOT_UNAVAILABLE",
  "SLOT_OUT_OF_WINDOW",
  "EVENT_TYPE_IN_USE",
]);

export type FailureCode = ErrorCode | "NETWORK" | "UNKNOWN";

export class ApiError extends Error {
  status: number;
  code: FailureCode;
  details?: Record<string, string>;

  constructor(
    status: number,
    code: FailureCode,
    message: string,
    details?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | undefined>;
  signal?: AbortSignal;
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, query, signal } = options;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      signal,
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError")
      throw cause;
    throw new ApiError(
      0,
      "NETWORK",
      "Не удалось связаться с сервером. Проверьте, что API запущен.",
    );
  }

  if (!response.ok) throw await toFailure(response);
  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}

export function asApiError(cause: unknown): ApiError {
  if (cause instanceof ApiError) return cause;
  return new ApiError(0, "UNKNOWN", "Неожиданная ошибка. Попробуйте ещё раз.");
}

function buildUrl(
  path: string,
  query?: Record<string, string | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== "") search.set(key, value);
  }
  const queryString = search.toString();
  return `${API_BASE}${path}${queryString ? `?${queryString}` : ""}`;
}

async function toFailure(response: Response): Promise<ApiError> {
  const body = await readJson(response);

  if (isApiErrorBody(body)) {
    return new ApiError(response.status, body.code, body.message, body.details);
  }

  // Prism и прокси отдают ошибки в своём формате (RFC 7807), на контракт тут полагаться нельзя.
  return new ApiError(
    response.status,
    "UNKNOWN",
    fallbackMessage(response.status, body),
  );
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isApiErrorBody(body: unknown): body is ApiErrorBody {
  if (typeof body !== "object" || body === null) return false;
  const candidate = body as Record<string, unknown>;
  return (
    typeof candidate.code === "string" &&
    KNOWN_ERROR_CODES.has(candidate.code) &&
    typeof candidate.message === "string"
  );
}

function fallbackMessage(status: number, body: unknown): string {
  if (typeof body === "object" && body !== null) {
    const candidate = body as Record<string, unknown>;
    const detail = candidate.detail ?? candidate.title;
    if (typeof detail === "string" && detail.length > 0) return detail;
  }

  if (status >= 500) return "Сервер вернул ошибку. Попробуйте позже.";
  if (status === 404) return "Ресурс не найден.";
  return `Запрос не выполнен (HTTP ${status}).`;
}
