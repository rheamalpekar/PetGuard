const mockStorage = new Map<string, string>();

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockStorage.get(key) ?? null)),
  setItem: jest.fn((key: string, value: string) => {
    mockStorage.set(key, value);
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    mockStorage.clear();
    return Promise.resolve();
  }),
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  consumeRateLimit,
  RateLimitError,
  throwIfRateLimited,
} from "../src/backendServices/RateLimiter";

describe("RateLimiter", () => {
  beforeEach(async () => {
    jest.spyOn(Date, "now").mockReturnValue(1000);
    await AsyncStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("allows attempts until the configured max is reached", async () => {
    await expect(
      consumeRateLimit({ key: "test", maxAttempts: 2, windowMs: 60000 }),
    ).resolves.toEqual({ allowed: true, retryAfterSeconds: 0 });
    await expect(
      consumeRateLimit({ key: "test", maxAttempts: 2, windowMs: 60000 }),
    ).resolves.toEqual({ allowed: true, retryAfterSeconds: 0 });
    await expect(
      consumeRateLimit({ key: "test", maxAttempts: 2, windowMs: 60000 }),
    ).resolves.toEqual({ allowed: false, retryAfterSeconds: 60 });
  });

  test("serializes concurrent attempts for the same key", async () => {
    const results = await Promise.all([
      consumeRateLimit({ key: "same-key", maxAttempts: 1, windowMs: 60000 }),
      consumeRateLimit({ key: "same-key", maxAttempts: 1, windowMs: 60000 }),
    ]);

    expect(results).toEqual([
      { allowed: true, retryAfterSeconds: 0 },
      { allowed: false, retryAfterSeconds: 60 },
    ]);
  });

  test("throws a RateLimitError with retry seconds", async () => {
    await throwIfRateLimited({
      key: "throw-test",
      maxAttempts: 1,
      windowMs: 60000,
    });

    await expect(
      throwIfRateLimited({
        key: "throw-test",
        maxAttempts: 1,
        windowMs: 60000,
      }),
    ).rejects.toMatchObject({
      name: "RateLimitError",
      retryAfterSeconds: 60,
    } satisfies Partial<RateLimitError>);
  });
});
