import AsyncStorage from "@react-native-async-storage/async-storage";

const RATE_LIMIT_PREFIX = "petguard:rateLimit";
const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_WINDOW_MS = 60 * 1000;
const rateLimitQueues = new Map<string, Promise<void>>();

export const RATE_LIMIT_WINDOW_MS = 60 * 1000;

export const RATE_LIMIT_BUCKETS = {
  infoFormSubmit: "info-form-submit",
  login: "auth-login",
  register: "auth-register",
} as const;

export type RateLimitOptions = {
  key: string;
  maxAttempts?: number;
  windowMs?: number;
};

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export class RateLimitError extends Error {
  retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super(`Too many attempts. Please try again in ${retryAfterSeconds} seconds.`);
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

const storageKeyFor = (key: string) => `${RATE_LIMIT_PREFIX}:${key}`;

const runWithKeyLock = async <T>(
  key: string,
  operation: () => Promise<T>,
): Promise<T> => {
  const previous = rateLimitQueues.get(key) ?? Promise.resolve();
  let releaseCurrent: () => void = () => {};
  const current = new Promise<void>((resolve) => {
    releaseCurrent = resolve;
  });
  const next = previous.catch(() => undefined).then(() => current);

  rateLimitQueues.set(key, next);
  await previous.catch(() => undefined);

  try {
    return await operation();
  } finally {
    releaseCurrent();
    if (rateLimitQueues.get(key) === next) {
      rateLimitQueues.delete(key);
    }
  }
};

const loadTimestamps = async (key: string): Promise<number[]> => {
  const stored = await AsyncStorage.getItem(storageKeyFor(key));

  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter((timestamp) => typeof timestamp === "number")
      : [];
  } catch {
    return [];
  }
};

export async function consumeRateLimit({
  key,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  windowMs = DEFAULT_WINDOW_MS,
}: RateLimitOptions): Promise<RateLimitResult> {
  return runWithKeyLock(key, async () => {
    const now = Date.now();
    const timestamps = await loadTimestamps(key);
    const validTimestamps = timestamps.filter(
      (timestamp) => now - timestamp < windowMs,
    );

    if (validTimestamps.length >= maxAttempts) {
      const oldestTimestamp = Math.min(...validTimestamps);
      const retryAfterMs = Math.max(windowMs - (now - oldestTimestamp), 0);

      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
      };
    }

    validTimestamps.push(now);
    await AsyncStorage.setItem(storageKeyFor(key), JSON.stringify(validTimestamps));

    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  });
}

export async function throwIfRateLimited(options: RateLimitOptions): Promise<void> {
  const result = await consumeRateLimit(options);

  if (!result.allowed) {
    throw new RateLimitError(result.retryAfterSeconds);
  }
}
