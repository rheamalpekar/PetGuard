import {
  formatCountdown,
  formatTrackingStatus,
  getRequestTracking,
} from "../src/utils/requestTracking";

describe("request tracking", () => {
  test("marks requests pending before one hour", () => {
    const createdAt = new Date("2026-04-19T12:00:00.000Z");
    const now = new Date("2026-04-19T12:30:00.000Z").getTime();

    const tracking = getRequestTracking(createdAt, now);

    expect(tracking.status).toBe("pending");
    expect(formatTrackingStatus(tracking.status)).toBe("Pending");
    expect(formatCountdown(tracking.remainingMs)).toBe("30m 0s");
  });

  test("marks requests completed after one hour", () => {
    const createdAt = new Date("2026-04-19T12:00:00.000Z");
    const now = new Date("2026-04-19T13:00:00.000Z").getTime();

    const tracking = getRequestTracking(createdAt, now);

    expect(tracking.status).toBe("completed");
    expect(formatTrackingStatus(tracking.status)).toBe("Completed");
    expect(formatCountdown(tracking.remainingMs)).toBe("Completed");
  });

  test("supports Firestore timestamp-like values", () => {
    const createdAt = { seconds: 1000, nanoseconds: 0 };
    const tracking = getRequestTracking(createdAt, 1000 * 1000 + 1000);

    expect(tracking.status).toBe("pending");
    expect(formatCountdown(tracking.remainingMs)).toBe("59m 59s");
  });
});
