import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";

import { notFound } from "./errors.ts";
import type { RequestContext } from "../router.ts";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

/** Раздаёт собранный фронтенд из publicDir, с SPA-fallback на index.html. */
export async function serveStatic(
  { req, res }: RequestContext,
  publicDir: string,
): Promise<void> {
  const url = new URL(req.url ?? "/", "http://localhost");
  const filePath = await resolveFile(publicDir, url.pathname);

  if (filePath === null) {
    throw notFound("Такого эндпоинта нет.");
  }

  res.writeHead(200, { "Content-Type": mimeType(filePath) });
  createReadStream(filePath).pipe(res);
}

async function resolveFile(
  publicDir: string,
  pathname: string,
): Promise<string | null> {
  const requested = path.normalize(path.join(publicDir, pathname));

  // Защита от path traversal: результат обязан остаться внутри publicDir.
  if (requested !== publicDir && !requested.startsWith(publicDir + path.sep)) {
    return null;
  }

  if (await isFile(requested)) return requested;

  const indexPath = path.join(publicDir, "index.html");
  return (await isFile(indexPath)) ? indexPath : null;
}

async function isFile(candidate: string): Promise<boolean> {
  try {
    return (await stat(candidate)).isFile();
  } catch {
    return false;
  }
}

function mimeType(filePath: string): string {
  return MIME_TYPES[path.extname(filePath)] ?? "application/octet-stream";
}
