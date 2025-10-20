import { WATCHER_CONFIG } from "../config/constants.js";

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {},
): Promise<T> {
  const {
    maxRetries = WATCHER_CONFIG.MAX_RETRIES,
    retryDelay = WATCHER_CONFIG.RETRY_DELAY,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        onRetry?.(attempt, error);
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * attempt),
        );
      }
    }
  }

  throw lastError;
}
