export const REQUEST_COMPLETION_MS = 60 * 60 * 1000;

export type ComputedRequestStatus = "pending" | "completed";

type FirestoreTimestampLike = {
  seconds?: number;
  nanoseconds?: number;
  toDate?: () => Date;
};

export const getCreatedAtDate = (createdAt: unknown): Date | null => {
  if (!createdAt) return null;
  if (createdAt instanceof Date) return createdAt;
  if (typeof createdAt === "number") return new Date(createdAt);
  if (typeof createdAt === "string") {
    const parsed = new Date(createdAt);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof createdAt === "object") {
    const timestamp = createdAt as FirestoreTimestampLike;
    if (typeof timestamp.toDate === "function") {
      return timestamp.toDate();
    }
    if (typeof timestamp.seconds === "number") {
      return new Date(
        timestamp.seconds * 1000 +
          Math.floor((timestamp.nanoseconds ?? 0) / 1000000),
      );
    }
  }

  return null;
};

export const getRequestTracking = (
  createdAt: unknown,
  nowMs: number = Date.now(),
) => {
  const createdAtDate = getCreatedAtDate(createdAt);
  const elapsedMs = createdAtDate
    ? Math.max(0, nowMs - createdAtDate.getTime())
    : 0;
  const remainingMs = createdAtDate
    ? Math.max(0, REQUEST_COMPLETION_MS - elapsedMs)
    : REQUEST_COMPLETION_MS;
  const status: ComputedRequestStatus =
    remainingMs === 0 ? "completed" : "pending";

  return {
    createdAtDate,
    elapsedMs,
    remainingMs,
    status,
  };
};

export const formatCountdown = (remainingMs: number): string => {
  if (remainingMs <= 0) return "Completed";

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
};

export const formatTrackingStatus = (
  status: ComputedRequestStatus,
): string => (status === "completed" ? "Completed" : "Pending");
