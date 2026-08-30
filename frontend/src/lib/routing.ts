import { createContext, useContext, useMemo } from "react";

export interface RouterValue {
  path: string;
  search: string;
  navigate: (to: string, options?: { replace?: boolean }) => void;
}

export const RouterContext = createContext<RouterValue | null>(null);

export function useRouter(): RouterValue {
  const value = useContext(RouterContext);
  if (!value)
    throw new Error("useRouter доступен только внутри RouterProvider");
  return value;
}

export function useQueryParam(name: string): string | null {
  const { search } = useRouter();
  return useMemo(() => new URLSearchParams(search).get(name), [search, name]);
}

/** Сопоставляет шаблон вида `/event-types/:eventTypeId` с текущим путём. */
export function matchPath(
  pattern: string,
  path: string,
): Record<string, string> | null {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};

  for (let index = 0; index < patternParts.length; index += 1) {
    const expected = patternParts[index];
    const actual = pathParts[index];

    if (expected.startsWith(":")) {
      params[expected.slice(1)] = safeDecode(actual);
      continue;
    }

    if (expected !== actual) return null;
  }

  return params;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
