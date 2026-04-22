const mockAsyncStore: Record<string, string> = {};

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn((key: string) =>
    Promise.resolve(mockAsyncStore[key] ?? null),
  ),
  setItem: jest.fn((key: string, value: string) => {
    mockAsyncStore[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    delete mockAsyncStore[key];
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    Object.keys(mockAsyncStore).forEach((key) => delete mockAsyncStore[key]);
    return Promise.resolve();
  }),
}));

const mockAddDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockGetDownloadURL = jest.fn();

jest.mock("firebase/firestore", () => ({
  addDoc: (...args: any[]) => mockAddDoc(...args),
  collection: jest.fn((db, name) => ({ db, name })),
  Timestamp: { now: jest.fn(() => ({ seconds: 1 })) },
  getDoc: jest.fn(),
  doc: jest.fn((db, collectionName, id) => ({ db, collectionName, id })),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn(),
  deleteDoc: jest.fn(),
}));

jest.mock("firebase/storage", () => ({
  ref: jest.fn((storage, path) => ({ storage, path })),
  uploadBytes: jest.fn(() => Promise.resolve()),
  getDownloadURL: (...args: any[]) => mockGetDownloadURL(...args),
}));

jest.mock("../src/backendServices/firebase", () => ({
  auth: { currentUser: { uid: "user-1" } },
  db: {},
  storage: {},
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  cacheUserProfile,
  clearCachedUserProfile,
  enqueueInfoForm,
  getUserProfileWithCache,
  loadCachedUserProfile,
  loadQueuedInfoForms,
  saveQueuedInfoForms,
  syncQueuedInfoForms,
} from "../src/backendServices/ApiService";
import { getDoc } from "firebase/firestore";

const makeItem = (localId: string) => ({
  localId,
  uid: "user-1",
  data: {
    formId: localId,
    location: { latitude: 1, longitude: 2, address: "Test Address" },
    yourName: "Test User",
    phoneNumber: "1234567890",
    emailAddress: "test@test.com",
    additionalDetails: "Queue test",
    serviceType: "",
    severity: "",
  },
  photoUris: ["https://example.com/photo.jpg"],
  createdAt: 1000,
  retryCount: 0,
});

describe("offline info form queue", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    mockAddDoc.mockResolvedValue({ id: "server-form-1" });
    mockUpdateDoc.mockResolvedValue(undefined);
    mockGetDownloadURL.mockResolvedValue("https://example.com/uploaded.jpg");
  });

  it("returns an empty queue when storage is empty", async () => {
    await expect(loadQueuedInfoForms()).resolves.toEqual([]);
  });

  it("stores and retrieves a queued item", async () => {
    const item = makeItem("queued_1");

    await enqueueInfoForm(item);

    await expect(loadQueuedInfoForms()).resolves.toEqual([item]);
  });

  it("stores multiple entries in insertion order", async () => {
    const first = makeItem("queued_1");
    const second = makeItem("queued_2");

    await enqueueInfoForm(first);
    await enqueueInfoForm(second);

    await expect(loadQueuedInfoForms()).resolves.toEqual([first, second]);
  });

  it("clears the queue by saving an empty queue", async () => {
    await enqueueInfoForm(makeItem("queued_1"));

    await saveQueuedInfoForms([]);

    await expect(loadQueuedInfoForms()).resolves.toEqual([]);
  });

  it("treats corrupted stored data as an empty queue", async () => {
    await AsyncStorage.setItem("petguard:infoFormQueue:v1", "not-json");

    await expect(loadQueuedInfoForms()).resolves.toEqual([]);
  });

  it("removes queued items after successful sync", async () => {
    await enqueueInfoForm(makeItem("queued_1"));

    await syncQueuedInfoForms();

    expect(mockAddDoc).toHaveBeenCalled();
    expect(mockUpdateDoc).toHaveBeenCalled();
    await expect(loadQueuedInfoForms()).resolves.toEqual([]);
  });

  it("requeues an item when sync fails", async () => {
    const item = makeItem("queued_1");
    mockAddDoc.mockRejectedValueOnce(new Error("offline"));
    await enqueueInfoForm(item);

    await syncQueuedInfoForms();

    await expect(loadQueuedInfoForms()).resolves.toEqual([item]);
  });
});

describe("user profile cache", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it("caches a profile after loading it from Firestore", async () => {
    const profile = {
      uid: "user-1",
      fullName: "Cached User",
      email: "cached@test.com",
      phoneNumber: "123",
    };

    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => profile,
    });

    await expect(getUserProfileWithCache("user-1")).resolves.toEqual(profile);
    await expect(loadCachedUserProfile("user-1")).resolves.toEqual(profile);
  });

  it("falls back to cached profile when Firestore load fails", async () => {
    const profile = {
      uid: "user-1",
      fullName: "Offline User",
      email: "offline@test.com",
      phoneNumber: "456",
    };

    await cacheUserProfile("user-1", profile);
    (getDoc as jest.Mock).mockRejectedValueOnce(new Error("offline"));

    await expect(getUserProfileWithCache("user-1")).resolves.toEqual(profile);
  });

  it("clears only the current user's cached profile", async () => {
    const profile = {
      uid: "user-1",
      fullName: "Cached User",
      email: "cached@test.com",
      phoneNumber: "123",
    };
    const otherProfile = {
      uid: "user-2",
      fullName: "Other User",
      email: "other@test.com",
      phoneNumber: "789",
    };

    await cacheUserProfile("user-1", profile);
    await cacheUserProfile("user-2", otherProfile);
    await clearCachedUserProfile("user-1");

    await expect(loadCachedUserProfile("user-1")).resolves.toBeNull();
    await expect(loadCachedUserProfile("user-2")).resolves.toEqual(
      otherProfile,
    );
  });
});
