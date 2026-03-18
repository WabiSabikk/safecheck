import { createBrowserClient } from '@supabase/ssr';

/**
 * Custom lock function that wraps navigator.locks with an execution timeout.
 * Prevents the Supabase auth client from hanging indefinitely when token
 * refresh gets stuck (e.g., network issues or dead refresh token loop).
 *
 * On timeout, the lock is released and the promise rejects — callers
 * (Supabase internals) handle the error gracefully. No session destruction.
 */
async function lockWithTimeout<R>(
  name: string,
  acquireTimeout: number,
  fn: () => Promise<R>
): Promise<R> {
  const EXECUTION_TIMEOUT = 10000; // 10s safety net

  if (typeof navigator === 'undefined' || !navigator.locks) {
    return await fn();
  }

  const abortController = new AbortController();

  if (acquireTimeout > 0) {
    setTimeout(() => abortController.abort(), acquireTimeout);
  }

  return await navigator.locks.request(
    name,
    acquireTimeout === 0
      ? { mode: 'exclusive' as const, ifAvailable: true }
      : { mode: 'exclusive' as const, signal: abortController.signal },
    async (lock) => {
      if (!lock) {
        throw new Error(`Failed to acquire lock "${name}"`);
      }
      return await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Lock execution timeout')),
            EXECUTION_TIMEOUT
          )
        ),
      ]);
    }
  );
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        lock: lockWithTimeout,
      },
    }
  );
}
