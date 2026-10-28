/**
 * Standard timeout budgets for server operations and outside calls.
 * Every external fetch or database call must use an AbortSignal from here.
 */
export const TIMEOUTS = {
  /** Fast read calls (health check, ping, quick API query): 5 seconds. */
  fast: 5_000,
  /** Standard HTTP / API request: 15 seconds. */
  standard: 15_000,
  /** Long-running tasks, file uploads or large downloads: 60 seconds. */
  long: 60_000,
} as const;

export function fetchWithTimeout(
  input: string | URL | Request,
  init?: RequestInit,
  ms: number = TIMEOUTS.standard,
): Promise<Response> {
  const signal = init?.signal
    ? AbortSignal.any([init.signal, AbortSignal.timeout(ms)])
    : AbortSignal.timeout(ms);
  return fetch(input, { ...init, signal });
}
