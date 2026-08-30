import type { IncomingMessage, ServerResponse } from "node:http";

import { CORS_ORIGIN } from "../config.ts";
import { ApiError } from "./errors.ts";

const MAX_BODY_BYTES = 64 * 1024;

export function applyCors(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", CORS_ORIGIN);
  res.setHeader("Vary", "Origin");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
}

export function sendJson(
  res: ServerResponse,
  status: number,
  payload: unknown,
): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

export function sendNoContent(res: ServerResponse): void {
  res.writeHead(204);
  res.end();
}

export function sendApiError(res: ServerResponse, error: ApiError): void {
  sendJson(res, error.status, error.toBody());
}

export async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of req) {
    const buffer = chunk as Buffer;
    size += buffer.length;

    if (size > MAX_BODY_BYTES) {
      req.destroy();
      throw new ApiError("VALIDATION_ERROR", "Тело запроса слишком большое.");
    }

    chunks.push(buffer);
  }

  if (size === 0) return undefined;

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Тело запроса не является корректным JSON.",
    );
  }
}
