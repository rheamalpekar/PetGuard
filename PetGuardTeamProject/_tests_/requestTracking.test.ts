import {
  getCreatedAtDate,
  formatCountdown,
  formatTrackingStatus,
  getRequestTracking,
} from "../src/utils/requestTracking";

describe("request tracking", () => {
  test("getCreatedAtDate returns null for missing and invalid values", () => {
    expect(getCreatedAtDate(null)).toBeNull();
    expect(getCreatedAtDate(undefined)).toBeNull();
    expect(getCreatedAtDate("not-a-date")).toBeNull();
    expect(getCreatedAtDate({ nope: true })).toBeNull();
  });

  test("getCreatedAtDate supports numbers, strings, Date, and toDate timestamp objects", () => {
    const date = new Date("2026-04-19T12:00:00.000Z");
    const toDate = jest.fn(() => date);

    expect(getCreatedAtDate(date)).toBe(date);
    expect(getCreatedAtDate(date.toISOString())?.toISOString()).toBe(
      date.toISOString(),
    );
    expect(getCreatedAtDate(date.getTime())?.toISOString()).toBe(
      date.toISOString(),
    );
    expect(getCreatedAtDate({ toDate })).toBe(date);
    expect(toDate).toHaveBeenCalledTimes(1);
  });

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

  test("uses the full default countdown when createdAt cannot be parsed", () => {
    const tracking = getRequestTracking("not-a-date", 1234);

    expect(tracking.createdAtDate).toBeNull();
    expect(tracking.elapsedMs).toBe(0);
    expect(tracking.remainingMs).toBe(60 * 60 * 1000);
    expect(tracking.status).toBe("pending");
  });

  test("clamps negative elapsed time to zero for future timestamps", () => {
    const future = new Date("2026-04-20T13:00:00.000Z");
    const now = new Date("2026-04-20T12:00:00.000Z").getTime();

    const tracking = getRequestTracking(future, now);

    expect(tracking.elapsedMs).toBe(0);
    expect(tracking.remainingMs).toBe(60 * 60 * 1000);
    expect(formatCountdown(tracking.remainingMs)).toBe("1h 0m 0s");
  });

  test("formats short countdowns and non-completed statuses correctly", () => {
    expect(formatCountdown(1500)).toBe("0m 2s");
    expect(formatCountdown(-1)).toBe("Completed");
    expect(formatTrackingStatus("pending")).toBe("Pending");
    expect(formatTrackingStatus("completed")).toBe("Completed");
  });
});
