import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, asApiError } from "@/api/client";

export interface ApiResult<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  refetch: () => void;
}

interface Settled<T> {
  key: string;
  data: T | null;
  error: ApiError | null;
}

/**
 * Загрузка данных с отменой предыдущего запроса: без неё ответ по старым параметрам
 * может прийти позже нового и затереть актуальные данные.
 *
 * `deps` должны быть JSON-сериализуемыми — из них собирается ключ запроса.
 */
export function useApi<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: readonly unknown[],
): ApiResult<T> {
  const [reloadToken, setReloadToken] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  // Состояние загрузки выводится из ключа, а не выставляется setState внутри эффекта.
  const requestKey = `${reloadToken}:${JSON.stringify(deps)}`;

  useEffect(() => {
    const controller = new AbortController();

    fetcherRef.current(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted)
          setSettled({ key: requestKey, data, error: null });
      },
      (cause: unknown) => {
        if (!controller.signal.aborted) {
          setSettled({ key: requestKey, data: null, error: asApiError(cause) });
        }
      },
    );

    return () => controller.abort();
  }, [requestKey]);

  const refetch = useCallback(() => setReloadToken((token) => token + 1), []);

  const current = settled?.key === requestKey ? settled : null;

  return {
    data: current?.data ?? null,
    error: current?.error ?? null,
    loading: current === null,
    refetch,
  };
}
