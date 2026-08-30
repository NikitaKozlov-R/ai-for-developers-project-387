import { existsSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";

import { PUBLIC_DIR } from "./config.ts";
import { applyCors, sendApiError, sendJson } from "./lib/http.ts";
import { ApiError, notFound } from "./lib/errors.ts";
import { serveStatic } from "./lib/static.ts";

// Собранного фронтенда нет локально (Dockerfile кладёт его в образ) — тогда единственный
// источник запросов к бэкенду это прокси Vite, который срезает /api перед проксированием,
// и прямые вызовы с префиксом (например e2e). Разбирать эти два пути одинаково безопасно,
// т.к. коллизия со SPA-роутами (см. ветку ниже) возможна только когда бэкенд сам раздаёт статику.
const SERVES_STATIC = existsSync(path.join(PUBLIC_DIR, "index.html"));

export interface RequestContext {
  req: IncomingMessage;
  res: ServerResponse;
  params: Record<string, string>;
  query: URLSearchParams;
}

export type Handler = (ctx: RequestContext) => Promise<void> | void;

export interface Route {
  method: string;
  segments: string[];
  handler: Handler;
}

/** Шаблон пути: сегмент вида `:name` становится параметром. */
export function route(method: string, path: string, handler: Handler): Route {
  return { method, segments: splitPath(path), handler };
}

export function createRequestListener(routes: readonly Route[]) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    applyCors(res);

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url ?? "/", "http://localhost");
    const segments = splitPath(url.pathname);
    const method = req.method ?? "GET";
    const ctx: RequestContext = {
      req,
      res,
      params: {},
      query: url.searchParams,
    };

    try {
      if (SERVES_STATIC) {
        // Все API-эндпоинты живут под /api — остальное отдаётся как статика фронтенда.
        if (segments[0] === "api") {
          const matched = match(routes, method, segments.slice(1));

          if (matched === null) {
            throw notFound("Такого эндпоинта нет.");
          }

          await matched.route.handler({ ...ctx, params: matched.params });
          return;
        }

        if (method === "GET") {
          await serveStatic(ctx, PUBLIC_DIR);
          return;
        }

        throw notFound("Такого эндпоинта нет.");
      }

      // Без статики отдавать нечего — сюда попадают только настоящие вызовы API,
      // с префиксом /api (прямые вызовы) или без него (прокси Vite уже его срезал).
      const apiSegments = segments[0] === "api" ? segments.slice(1) : segments;
      const matched = match(routes, method, apiSegments);

      if (matched === null) {
        throw notFound("Такого эндпоинта нет.");
      }

      await matched.route.handler({ ...ctx, params: matched.params });
    } catch (cause) {
      if (cause instanceof ApiError) {
        sendApiError(res, cause);
        return;
      }

      console.error("Необработанная ошибка запроса:", cause);
      sendJson(res, 500, { message: "Внутренняя ошибка сервера." });
    }
  };
}

function match(
  routes: readonly Route[],
  method: string,
  segments: string[],
): { route: Route; params: Record<string, string> } | null {
  for (const candidate of routes) {
    if (candidate.method !== method) continue;
    if (candidate.segments.length !== segments.length) continue;

    const params = matchSegments(candidate.segments, segments);
    if (params !== null) return { route: candidate, params };
  }

  return null;
}

function matchSegments(
  pattern: string[],
  segments: string[],
): Record<string, string> | null {
  const params: Record<string, string> = {};

  for (let index = 0; index < pattern.length; index += 1) {
    const expected = pattern[index] as string;
    const actual = segments[index] as string;

    if (expected.startsWith(":")) {
      params[expected.slice(1)] = actual;
      continue;
    }

    if (expected !== actual) return null;
  }

  return params;
}

function splitPath(path: string): string[] {
  return path
    .split("/")
    .filter((segment) => segment.length > 0)
    .map(decodeURIComponent);
}
