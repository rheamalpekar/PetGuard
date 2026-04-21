const mockCurrentUser: any = { uid: "perf-user" };
const mockAddDoc = jest.fn(async () => ({ id: "perf-form" }));
const mockUpdateDoc = jest.fn(async () => undefined);
const mockUploadBytes = jest.fn(async () => undefined);
const mockGetDownloadURL = jest.fn(async () => "https://cdn.test/perf.jpg");
const mockThrowIfRateLimited = jest.fn(async () => undefined);

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
  removeItem: jest.fn(async () => undefined),
}));

jest.mock("firebase/firestore", () => ({
  addDoc: (...args: any[]) => mockAddDoc(...args as any),
  collection: (db: any, name: string) => ({ db, name }),
  Timestamp: { now: jest.fn(() => ({ seconds: 1 })) },
  getDoc: jest.fn(),
  doc: (db: any, collectionName: string, id: string) => ({ db, collectionName, id }),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args as any),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn(),
  deleteDoc: jest.fn(),
}));

jest.mock("firebase/storage", () => ({
  ref: (_storage: any, path: string) => ({ path }),
  uploadBytes: (...args: any[]) => mockUploadBytes(...args as any),
  getDownloadURL: (...args: any[]) => mockGetDownloadURL(...args as any),
}));

jest.mock("../src/backendServices/firebase", () => ({
  auth: {
    get currentUser() {
      return mockCurrentUser;
    },
  },
  db: { name: "mock-db" },
  storage: { name: "mock-storage" },
}));

jest.mock("../src/backendServices/RateLimiter", () => ({
  RATE_LIMIT_BUCKETS: { infoFormSubmit: "info" },
  RATE_LIMIT_WINDOW_MS: 60000,
  throwIfRateLimited: (...args: any[]) => mockThrowIfRateLimited(...args as any),
}));

import { detectEmergency } from "../src/emergency/core/EmergencyAlertSystem";
import { submitInfoForm } from "../src/backendServices/ApiService";

describe("basic performance checks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(jest.fn());
  });

  test("detectEmergency completes under 100ms for a typical report", () => {
    const start = Date.now();
    const result = detectEmergency({
      emergencyType: "Accident",
      description: "Dog hit by a car and bleeding near the road",
    });
    const end = Date.now();

    expect(result.isEmergency).toBe(true);
    expect(result.severity).toBe("critical");
    expect(end - start).toBeLessThan(100);
  });

  test("detectEmergency prefers the highest severity match under 100ms", () => {
    const start = Date.now();
    const result = detectEmergency({
      emergencyType: "Accident",
      description: "Pet was hit by a car and is having a seizure",
    });
    const end = Date.now();

    expect(result.severity).toBe("critical");
    expect(result.scenarioId).toBe("road_accident");
    expect(end - start).toBeLessThan(100);
  });

  test("detectEmergency uses the heuristic high-risk fallback and the safe default quickly", () => {
    const heuristicStart = Date.now();
    const heuristic = detectEmergency({
      emergencyType: "Unknown",
      description: "Animal is unconscious after an attack",
    });
    const heuristicEnd = Date.now();

    const defaultStart = Date.now();
    const nonEmergency = detectEmergency({
      emergencyType: "Question",
      description: "Need help with grooming advice",
    });
    const defaultEnd = Date.now();

    expect(heuristic.scenarioId).toBe("heuristic_high_risk");
    expect(heuristic.isEmergency).toBe(true);
    expect(nonEmergency.isEmergency).toBe(false);
    expect(nonEmergency.dispatchProtocol).toBe("NONE");
    expect(heuristicEnd - heuristicStart).toBeLessThan(100);
    expect(defaultEnd - defaultStart).toBeLessThan(100);
  });

  test("submitInfoForm completes under 100ms with mocked backend services", async () => {
    const start = Date.now();

    await submitInfoForm(
      {
        location: { latitude: 1, longitude: 2, address: "Fast Lane" },
        yourName: "Perf User",
        phoneNumber: "1234567890",
        emailAddress: "perf@test.com",
        additionalDetails: "Quick benchmark",
      },
      [new Blob(["image"])],
      { skipRateLimit: true },
    );

    const end = Date.now();

    expect(mockAddDoc).toHaveBeenCalled();
    expect(end - start).toBeLessThan(100);
  });
});
