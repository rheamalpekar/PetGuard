import React from "react";
import { Pressable, Text } from "react-native";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { signInAsGuest } from "../src/backendServices/AuthService";
import NetInfo from "@react-native-community/netinfo";
import {
  loadQueuedInfoForms,
  syncQueuedInfoForms,
} from "../src/backendServices/ApiService";

let mockRestoredUser: any = null;
let netInfoListener: any = null;

jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn((_auth, callback) => {
    callback(mockRestoredUser);
    return jest.fn();
  }),
}));

jest.mock("../src/backendServices/firebase", () => ({
  auth: {
    currentUser: null,
  },
}));

jest.mock("../src/backendServices/AuthService", () => ({
  signInAsGuest: jest.fn(),
}));

jest.mock("../src/backendServices/ApiService", () => ({
  loadQueuedInfoForms: jest.fn(() => Promise.resolve([])),
  syncQueuedInfoForms: jest.fn(() => Promise.resolve()),
}));

jest.mock("@react-native-community/netinfo", () => ({
  addEventListener: jest.fn((listener) => {
    netInfoListener = listener;
    return jest.fn();
  }),
}));

function AuthProbe() {
  const {
    user,
    loading,
    isGuest,
    continueAsGuest,
    justSynced,
    isOnline,
    hadPendingQueue,
  } = useAuth();
  const [error, setError] = React.useState("");

  return (
    <>
      <Text>{loading ? "loading" : user?.uid ?? "no-user"}</Text>
      <Text>{isGuest ? "guest" : "not-guest"}</Text>
      <Text>{justSynced ? "just-synced" : "not-synced"}</Text>
      <Text>{isOnline ? "online" : "offline"}</Text>
      <Text>{hadPendingQueue ? "pending-queue" : "no-pending-queue"}</Text>
      <Text>{error || "no-error"}</Text>
      <Pressable
        onPress={() =>
          continueAsGuest().catch((err) => setError(err.message || "failed"))
        }
      >
        <Text>Continue as Guest</Text>
      </Pressable>
    </>
  );
}

describe("AuthContext guest auth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRestoredUser = null;
    netInfoListener = null;
    (signInAsGuest as jest.Mock).mockResolvedValue({
      uid: "guest-1",
      isAnonymous: true,
    });
    (loadQueuedInfoForms as jest.Mock).mockResolvedValue([]);
    (syncQueuedInfoForms as jest.Mock).mockResolvedValue(undefined);
  });

  test("does not fake guest state when Firebase restores no user", async () => {
    const { findByText } = render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(await findByText("no-user")).toBeTruthy();
    expect(await findByText("not-guest")).toBeTruthy();
    expect(await findByText("offline")).toBeTruthy();
    expect(await findByText("no-pending-queue")).toBeTruthy();
    expect(signInAsGuest).not.toHaveBeenCalled();
  });

  test("continueAsGuest stores the anonymous Firebase user", async () => {
    const { getByText, findByText } = render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await findByText("no-user");
    fireEvent.press(getByText("Continue as Guest"));

    await waitFor(() => {
      expect(signInAsGuest).toHaveBeenCalledTimes(1);
      expect(getByText("guest-1")).toBeTruthy();
      expect(getByText("guest")).toBeTruthy();
    });
  });

  test("restores an existing anonymous Firebase session", async () => {
    mockRestoredUser = {
      uid: "restored-guest",
      isAnonymous: true,
    };

    const { findByText } = render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(await findByText("restored-guest")).toBeTruthy();
    expect(await findByText("guest")).toBeTruthy();
    expect(syncQueuedInfoForms).toHaveBeenCalledTimes(1);
    expect(signInAsGuest).not.toHaveBeenCalled();
  });

  test("marks the queue as just synced when connectivity returns and queued work clears", async () => {
    (loadQueuedInfoForms as jest.Mock)
      .mockResolvedValueOnce([{ localId: "queued-1" }])
      .mockResolvedValueOnce([]);

    const { findByText } = render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await findByText("no-user");

    await act(async () => {
      await netInfoListener({
        isConnected: true,
        isInternetReachable: true,
      });
    });

    expect(await findByText("online")).toBeTruthy();
    expect(await findByText("just-synced")).toBeTruthy();
    expect(await findByText("no-pending-queue")).toBeTruthy();
    expect(syncQueuedInfoForms).toHaveBeenCalledTimes(1);
  });

  test("keeps pending queue state when connectivity returns but items remain queued", async () => {
    (loadQueuedInfoForms as jest.Mock)
      .mockResolvedValueOnce([{ localId: "queued-1" }])
      .mockResolvedValueOnce([{ localId: "queued-1" }]);

    const { findByText } = render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await findByText("no-user");

    await act(async () => {
      await netInfoListener({
        isConnected: true,
        isInternetReachable: true,
      });
    });

    expect(await findByText("online")).toBeTruthy();
    expect(await findByText("not-synced")).toBeTruthy();
    expect(await findByText("pending-queue")).toBeTruthy();
  });

  test("continueAsGuest clears loading state again when guest sign-in fails", async () => {
    (signInAsGuest as jest.Mock).mockRejectedValueOnce(new Error("guest failed"));

    const { getByText, findByText } = render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await findByText("no-user");

    await act(async () => {
      fireEvent.press(getByText("Continue as Guest"));
    });

    await waitFor(() => {
      expect(syncQueuedInfoForms).not.toHaveBeenCalled();
      expect(getByText("no-user")).toBeTruthy();
      expect(getByText("not-guest")).toBeTruthy();
      expect(getByText("guest failed")).toBeTruthy();
    });
  });
});
