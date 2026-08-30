import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, asApiError } from "@/api/client";

export type MutationOutcome<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

export interface MutationResult<TInput, TResult> {
  /** Возвращает null, если запрос проигнорирован: предыдущий ещё не завершился. */
  mutate: (input: TInput) => Promise<MutationOutcome<TResult> | null>;
  pending: boolean;
  error: ApiError | null;
  reset: () => void;
}

export function useMutation<TInput, TResult>(
  mutator: (input: TInput) => Promise<TResult>,
): MutationResult<TInput, TResult> {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const mutatorRef = useRef(mutator);
  useEffect(() => {
    mutatorRef.current = mutator;
  });

  const inFlight = useRef(false);

  const mutate = useCallback(async (input: TInput) => {
    if (inFlight.current) return null;

    inFlight.current = true;
    setPending(true);
    setError(null);

    try {
      const data = await mutatorRef.current(input);
      return { ok: true as const, data };
    } catch (cause) {
      const failure = asApiError(cause);
      setError(failure);
      return { ok: false as const, error: failure };
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }, []);

  const reset = useCallback(() => setError(null), []);

  return { mutate, pending, error, reset };
}

/**
 * Достаёт сообщение для поля из `details`. Контракт не фиксирует имена ключей,
 * поэтому совпадение ищется и по полному пути (`guest.name`), и по хвосту (`name`).
 */
export function fieldError(
  details: Record<string, string> | undefined,
  ...names: string[]
): string | undefined {
  if (!details) return undefined;

  for (const name of names) {
    if (details[name]) return details[name];
  }

  for (const [key, message] of Object.entries(details)) {
    const tail = key.split(".").pop();
    if (tail && names.includes(tail)) return message;
  }

  return undefined;
}

/** Сообщения из `details`, которые не удалось разложить по полям формы. */
export function unmappedDetails(
  details: Record<string, string> | undefined,
  mapped: string[],
): string[] {
  if (!details) return [];

  return Object.entries(details)
    .filter(([key]) => {
      const tail = key.split(".").pop() ?? key;
      return !mapped.includes(key) && !mapped.includes(tail);
    })
    .map(([, message]) => message);
}
