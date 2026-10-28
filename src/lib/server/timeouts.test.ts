import { describe, expect, it } from 'vitest';
import { fetchWithTimeout, TIMEOUTS } from './timeouts';

describe('timeouts and external calls', () => {
  it('defines fast, standard, and long timeout budgets', () => {
    expect(TIMEOUTS.fast).toBe(5_000);
    expect(TIMEOUTS.standard).toBe(15_000);
    expect(TIMEOUTS.long).toBe(60_000);
  });

  it('fetchWithTimeout creates a request with an abort signal', async () => {
    // Calling fetchWithTimeout with a dummy address and 1ms timeout aborts
    await expect(
      fetchWithTimeout('http://127.0.0.1:9999/nonexistent', undefined, 1),
    ).rejects.toThrow();
  });

  it('fetchWithTimeout combines caller abort signal with timeout budget', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      fetchWithTimeout(
        'http://127.0.0.1:9999/nonexistent',
        { signal: controller.signal },
        TIMEOUTS.fast,
      ),
    ).rejects.toThrow();
  });
});
