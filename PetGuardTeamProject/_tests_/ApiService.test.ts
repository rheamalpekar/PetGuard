const mockAsyncStore: Record<string, string> = {};

let mockCurrentUser: any = { uid: "user-1", delete: jest.fn() };

const mockAddDoc = jest.fn();
const mockCollection = jest.fn((db, name) => ({ db, name }));
const mockGetDoc = jest.fn();
const mockDoc = jest.fn((db, collectionName, id) => ({ db, collectionName, id }));
const mockUpdateDoc = jest.fn();
const mockQuery = jest.fn((...args: any[]) => ({ kind: "query", args }));
const mockWhere = jest.fn((...args: any[]) => ({ kind: "where", args }));
const mockOnSnapshot = jest.fn();
const mockDeleteDoc = jest.fn();
const mockRef = jest.fn((storage, path) => ({ storage, path }));
const mockUploadBytes = jest.fn();
const mockGetDownloadURL = jest.fn();
const mockThrowIfRateLimited = jest.fn();
const mockSignOut = jest.fn();

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockAsyncStore[key] ?? null)),
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

jest.mock("firebase/firestore", () => ({
  addDoc: (first: any, second: any) => mockAddDoc(first, second),
  collection: (first: any, second: any) => mockCollection(first, second),
  Timestamp: { now: jest.fn(() => ({ seconds: 123 })) },
  getDoc: (first: any) => mockGetDoc(first),
  doc: (first: any, second: any, third: any) => mockDoc(first, second, third),
  updateDoc: (first: any, second: any) => mockUpdateDoc(first, second),
  query: (...args: any[]) => mockQuery(...args),
  where: (...args: any[]) => mockWhere(...args),
  onSnapshot: (...args: any[]) => mockOnSnapshot(...args),
  deleteDoc: (first: any) => mockDeleteDoc(first),
}));

jest.mock("firebase/storage", () => ({
  ref: (first: any, second: any) => mockRef(first, second),
  uploadBytes: (first: any, second: any) => mockUploadBytes(first, second),
  getDownloadURL: (first: any) => mockGetDownloadURL(first),
}));

jest.mock("firebase/auth", () => ({
  signOut: (first: any) => mockSignOut(first),
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
  RATE_LIMIT_BUCKETS: {
    login: "auth-login",
    register: "auth-register",
    infoFormSubmit: "info-form-submit",
  },
  RATE_LIMIT_WINDOW_MS: 60_000,
  throwIfRateLimited: (...args: any[]) => mockThrowIfRateLimited(...args),
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addEmergencyReport,
  cacheUserProfile,
  clearCachedUserProfile,
  deleteUserAccount,
  enqueueInfoForm,
  getInfoFormDataById,
  getUserProfile,
  getUserProfileWithCache,
  getUserRequests,
  loadCachedUserProfile,
  loadQueuedInfoForms,
  saveQueuedInfoForms,
  subscribeToActiveReports,
  submitInfoForm,
  syncQueuedInfoForms,
  updateUserProfile,
  uploadImage,
} from "../src/backendServices/ApiService";

const formData = {
  location: { latitude: 1, longitude: 2, address: "Arlington" },
  yourName: "Taylor",
  phoneNumber: "1234567890",
  emailAddress: "taylor@test.com",
  additionalDetails: "Needs help",
  serviceType: "",
  severity: "",
};

describe("ApiService", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(jest.fn());
    await AsyncStorage.clear();
    mockCurrentUser = { uid: "user-1", delete: jest.fn().mockResolvedValue(undefined) };
    mockAddDoc.mockResolvedValue({ id: "form-1" });
    mockUpdateDoc.mockResolvedValue(undefined);
    mockUploadBytes.mockResolvedValue(undefined);
    mockGetDownloadURL.mockResolvedValue("https://cdn.test/upload.jpg");
    mockThrowIfRateLimited.mockResolvedValue(undefined);
    mockSignOut.mockResolvedValue(undefined);
    mockDeleteDoc.mockResolvedValue(undefined);
  });

  it("submitInfoForm blocks unauthenticated submissions after rate-limit check", async () => {
    mockCurrentUser = null;

    await expect(submitInfoForm(formData, [])).rejects.toThrow("Not authenticated");
    expect(mockThrowIfRateLimited).toHaveBeenCalledTimes(1);
    expect(mockAddDoc).not.toHaveBeenCalled();
  });

  it("submitInfoForm skips rate limiting when requested and updates uploaded photo URLs", async () => {
    const result = await submitInfoForm(formData, ["https://already-uploaded.test/image.jpg"], {
      skipRateLimit: true,
    });

    expect(result).toEqual({ success: true, formId: "form-1" });
    expect(mockThrowIfRateLimited).not.toHaveBeenCalled();
    expect(mockAddDoc).toHaveBeenCalledWith(
      { db: { name: "mock-db" }, name: "infoForms" },
      expect.objectContaining({
        uid: "user-1",
        status: "pending",
        photos: [],
      }),
    );
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { db: { name: "mock-db" }, collectionName: "infoForms", id: "form-1" },
      {
        formId: "form-1",
        photos: ["https://already-uploaded.test/image.jpg"],
      },
    );
  });

  it("submitInfoForm rethrows upload failures from the catch path", async () => {
    mockGetDownloadURL.mockRejectedValueOnce(new Error("storage-failed"));

    await expect(submitInfoForm(formData, [new Blob(["file"])])).rejects.toThrow(
      "storage-failed",
    );
  });

  it("addEmergencyReport throws when no authenticated user exists", async () => {
    mockCurrentUser = null;

    await expect(
      addEmergencyReport({
        type: "Injury",
        severity: "High",
        description: "Dog hit by car",
      }),
    ).rejects.toThrow("User not authenticated");
  });

  it("addEmergencyReport stores a signed-in report and returns the new id", async () => {
    mockAddDoc.mockResolvedValueOnce({ id: "report-7" });

    await expect(
      addEmergencyReport({
        type: "Injury",
        severity: "High",
        description: "Dog hit by car",
      }),
    ).resolves.toEqual({ success: true, id: "report-7" });

    expect(mockAddDoc).toHaveBeenCalledWith(
      { db: { name: "mock-db" }, name: "emergencyReports" },
      expect.objectContaining({
        userId: "user-1",
        createdAt: { seconds: 123 },
      }),
    );
  });

  it("getInfoFormDataById rejects missing ids and missing documents", async () => {
    await expect(getInfoFormDataById("")).rejects.toThrow("No form id provided");

    mockGetDoc.mockResolvedValueOnce({
      exists: () => false,
    });

    await expect(getInfoFormDataById("missing-form")).rejects.toThrow(
      "Info form not found",
    );
  });

  it("getInfoFormDataById returns existing form data", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => formData,
    });

    await expect(getInfoFormDataById("form-9")).resolves.toEqual(formData);
  });

  it("uploadImage returns existing https URLs without uploading", async () => {
    await expect(
      uploadImage("https://cdn.test/already-there.jpg", "form-1"),
    ).resolves.toBe("https://cdn.test/already-there.jpg");
    expect(mockUploadBytes).not.toHaveBeenCalled();
  });

  it("uploadImage rejects when formId is missing", async () => {
    await expect(uploadImage(new Blob(["file"]), "")).rejects.toThrow(
      "Missing formId for upload",
    );
  });

  it("uploadImage rejects when no authenticated user exists", async () => {
    mockCurrentUser = null;

    await expect(uploadImage(new Blob(["file"]), "form-1")).rejects.toThrow(
      "Not authenticated",
    );
  });

  it("uploadImage uploads File instances directly without XMLHttpRequest", async () => {
    const OriginalFile = global.File;

    class TestFile extends Blob {}

    // @ts-expect-error test override
    global.File = TestFile;

    const file = new TestFile(["hello"]);

    await expect(uploadImage(file as any, "form-file")).resolves.toBe(
      "https://cdn.test/upload.jpg",
    );
    expect(mockUploadBytes).toHaveBeenCalledWith(
      expect.objectContaining({
        path: expect.stringContaining("infoForms/user-1/form-file/"),
      }),
      file,
    );

    global.File = OriginalFile;
  });

  it("uploadImage fetches local URIs with XMLHttpRequest before upload", async () => {
    const OriginalXHR = global.XMLHttpRequest;
    const blob = new Blob(["local-image"]);

    class WorkingXHR {
      responseType = "";
      response = blob;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      open = jest.fn();
      send = jest.fn(() => {
        this.onload?.();
      });
    }

    // @ts-expect-error test override
    global.XMLHttpRequest = WorkingXHR;

    await expect(uploadImage("file:///ok.jpg", "form-local")).resolves.toBe(
      "https://cdn.test/upload.jpg",
    );
    expect(mockUploadBytes).toHaveBeenCalledWith(
      expect.objectContaining({
        path: expect.stringContaining("infoForms/user-1/form-local/"),
      }),
      blob,
    );

    global.XMLHttpRequest = OriginalXHR;
  });

  it("uploadImage rejects when XMLHttpRequest cannot fetch a local URI", async () => {
    const OriginalXHR = global.XMLHttpRequest;
    class BrokenXHR {
      responseType = "";
      response = null;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      open() {}
      send() {
        this.onerror?.();
      }
    }
    // @ts-expect-error test override
    global.XMLHttpRequest = BrokenXHR;

    await expect(uploadImage("file:///broken.jpg", "form-1")).rejects.toThrow(
      "Image fetch failed",
    );

    global.XMLHttpRequest = OriginalXHR;
  });

  it("syncQueuedInfoForms exits early when no user is signed in", async () => {
    mockCurrentUser = null;
    await saveQueuedInfoForms([
      {
        localId: "queued-1",
        uid: "user-1",
        data: formData,
        photoUris: [],
        createdAt: 1,
        retryCount: 0,
      },
    ]);

    await syncQueuedInfoForms();

    expect(mockAddDoc).not.toHaveBeenCalled();
  });

  it("syncQueuedInfoForms skips a second concurrent sync and requeues failed items", async () => {
    await saveQueuedInfoForms([
      {
        localId: "queued-1",
        uid: "user-1",
        data: formData,
        photoUris: [],
        createdAt: 1,
        retryCount: 0,
      },
    ]);

    let releaseFirstAddDoc: (() => void) | undefined;
    const firstAddDocCall = new Promise((resolve) => {
      releaseFirstAddDoc = () => resolve({ id: "form-1" });
    });
    mockAddDoc.mockImplementationOnce(() => firstAddDocCall as any);

    const firstSync = syncQueuedInfoForms();
    await Promise.resolve();
    await syncQueuedInfoForms();

    expect(console.log).toHaveBeenCalledWith("Sync already running so skipping");

    releaseFirstAddDoc?.();
    await firstSync;

    mockAddDoc.mockRejectedValueOnce(new Error("still-offline"));
    await saveQueuedInfoForms([
      {
        localId: "queued-2",
        uid: "user-1",
        data: formData,
        photoUris: [],
        createdAt: 2,
        retryCount: 0,
      },
    ]);

    await syncQueuedInfoForms();

    await expect(loadQueuedInfoForms()).resolves.toEqual([
      expect.objectContaining({ localId: "queued-2" }),
    ]);
  });

  it("subscribeToActiveReports forwards snapshot sizes to the callback", () => {
    const callback = jest.fn();
    const unsubscribe = jest.fn();
    mockOnSnapshot.mockImplementationOnce((_query, onNext) => {
      onNext({ size: 3 });
      return unsubscribe;
    });

    const returned = subscribeToActiveReports("user-1", callback);

    expect(callback).toHaveBeenCalledWith(3);
    expect(returned).toBe(unsubscribe);
  });

  it("getUserProfile validates uid and handles missing users", async () => {
    await expect(getUserProfile("")).rejects.toThrow("Missing uid");

    mockGetDoc.mockResolvedValueOnce({
      exists: () => false,
    });

    await expect(getUserProfile("user-1")).rejects.toThrow("User not found");
  });

  it("loadQueuedInfoForms returns empty arrays for missing or invalid cache payloads", async () => {
    await expect(loadQueuedInfoForms()).resolves.toEqual([]);

    await AsyncStorage.setItem("petguard:infoFormQueue:v1", "{bad-json");
    await expect(loadQueuedInfoForms()).resolves.toEqual([]);
  });

  it("enqueueInfoForm appends new items to the persisted queue", async () => {
    await saveQueuedInfoForms([
      {
        localId: "queued-1",
        uid: "user-1",
        data: formData,
        photoUris: [],
        createdAt: 1,
        retryCount: 0,
      },
    ]);

    await expect(
      enqueueInfoForm({
        localId: "queued-2",
        uid: "user-1",
        data: formData,
        photoUris: ["photo.jpg"],
        createdAt: 2,
        retryCount: 0,
      }),
    ).resolves.toHaveLength(2);
  });

  it("getUserProfileWithCache rethrows the original error when both remote and cache fail", async () => {
    const offlineError = new Error("offline");
    mockGetDoc.mockRejectedValueOnce(offlineError);

    await expect(getUserProfileWithCache("user-1")).rejects.toBe(offlineError);
  });

  it("loadCachedUserProfile returns null for invalid cache JSON and validates missing uid", async () => {
    await expect(loadCachedUserProfile("")).rejects.toThrow("Missing uid");

    await AsyncStorage.setItem("petguard:userProfile:v1:user-1", "{bad-json");
    await expect(loadCachedUserProfile("user-1")).resolves.toBeNull();
  });

  it("cacheUserProfile and clearCachedUserProfile validate uid arguments", async () => {
    await expect(cacheUserProfile("", {} as any)).rejects.toThrow("Missing uid");
    await expect(clearCachedUserProfile("")).rejects.toThrow("Missing uid");
  });

  it("updateUserProfile updates firestore and refreshes the cached profile when present", async () => {
    await AsyncStorage.setItem(
      "petguard:userProfile:v1:user-1",
      JSON.stringify({
        uid: "user-1",
        fullName: "Before",
        email: "before@test.com",
        phoneNumber: "111",
      }),
    );

    await expect(
      updateUserProfile("user-1", {
        fullName: "After",
        phoneNumber: "222",
      }),
    ).resolves.toEqual({ success: true });

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { db: { name: "mock-db" }, collectionName: "users", id: "user-1" },
      expect.objectContaining({
        fullName: "After",
        phoneNumber: "222",
        updatedAt: { seconds: 123 },
      }),
    );
    await expect(
      AsyncStorage.getItem("petguard:userProfile:v1:user-1"),
    ).resolves.toBe(
      JSON.stringify({
        uid: "user-1",
        fullName: "After",
        email: "before@test.com",
        phoneNumber: "222",
      }),
    );
  });

  it("updateUserProfile leaves cache untouched when no cached profile exists", async () => {
    await expect(
      updateUserProfile("user-1", {
        fullName: "No Cache User",
      }),
    ).resolves.toEqual({ success: true });

    await expect(
      AsyncStorage.getItem("petguard:userProfile:v1:user-1"),
    ).resolves.toBeNull();
  });

  it("getUserRequests resolves snapshot results and rejects snapshot errors", async () => {
    const unsubscribe = jest.fn();
    mockOnSnapshot.mockImplementationOnce((_query, onNext) => {
      Promise.resolve().then(() =>
        onNext({
          docs: [
            {
              id: "req-1",
              data: () => ({ uid: "user-1", location: null, status: "pending", createdAt: new Date() }),
            },
          ],
        }),
      );
      return unsubscribe;
    });

    await expect(getUserRequests("user-1")).resolves.toEqual([
      expect.objectContaining({
        id: "req-1",
        uid: "user-1",
      }),
    ]);
    expect(unsubscribe).toHaveBeenCalled();

    mockOnSnapshot.mockImplementationOnce((_query, _onNext, onError) => {
      onError(new Error("snapshot-failed"));
      return jest.fn();
    });

    await expect(getUserRequests("user-1")).rejects.toThrow("snapshot-failed");
  });

  it("getUserRequests validates uid before subscribing", async () => {
    await expect(getUserRequests("")).rejects.toThrow("Missing uid");
    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });

  it("deleteUserAccount deletes the auth user, profile document, and request documents", async () => {
    const unsubscribe = jest.fn();
    mockOnSnapshot.mockImplementationOnce((_query, onNext) => {
      Promise.resolve().then(() =>
        onNext({
          docs: [{ id: "req-1" }, { id: "req-2" }],
        }),
      );
      return unsubscribe;
    });

    await expect(deleteUserAccount()).resolves.toEqual({ success: true });

    expect(mockCurrentUser.delete).toHaveBeenCalled();
    expect(mockDeleteDoc).toHaveBeenCalledWith({
      db: { name: "mock-db" },
      collectionName: "users",
      id: "user-1",
    });
    expect(mockDeleteDoc).toHaveBeenCalledWith({
      db: { name: "mock-db" },
      collectionName: "infoForms",
      id: "req-1",
    });
    expect(mockDeleteDoc).toHaveBeenCalledWith({
      db: { name: "mock-db" },
      collectionName: "infoForms",
      id: "req-2",
    });
  });

  it("deleteUserAccount maps requires-recent-login to the user-facing error", async () => {
    mockCurrentUser = {
      uid: "user-1",
      delete: jest.fn().mockRejectedValue({ code: "auth/requires-recent-login" }),
    };

    await expect(deleteUserAccount()).rejects.toThrow(
      "Please log out and log back in before deleting account.",
    );
  });

  it("deleteUserAccount rethrows unexpected delete errors", async () => {
    mockCurrentUser = {
      uid: "user-1",
      delete: jest.fn().mockRejectedValue(new Error("delete-failed")),
    };

    await expect(deleteUserAccount()).rejects.toThrow("delete-failed");
  });
});
