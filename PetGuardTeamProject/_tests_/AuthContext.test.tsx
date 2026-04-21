import React from "react";
import { Pressable, Text } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { signInAsGuest } from "../src/backendServices/AuthService";

let mockRestoredUser: any = null;

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
  addEventListener: jest.fn(() => jest.fn()),
}));

function AuthProbe() {
  const { user, loading, isGuest, continueAsGuest } = useAuth();

  return (
    <>
      <Text>{loading ? "loading" : user?.uid ?? "no-user"}</Text>
      <Text>{isGuest ? "guest" : "not-guest"}</Text>
      <Pressable onPress={() => continueAsGuest()}>
        <Text>Continue as Guest</Text>
      </Pressable>
    </>
  );
}

describe("AuthContext guest auth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRestoredUser = null;
    (signInAsGuest as jest.Mock).mockResolvedValue({
      uid: "guest-1",
      isAnonymous: true,
    });
  });

  test("does not fake guest state when Firebase restores no user", async () => {
    const { findByText } = render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(await findByText("no-user")).toBeTruthy();
    expect(await findByText("not-guest")).toBeTruthy();
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
    expect(signInAsGuest).not.toHaveBeenCalled();
  });
});
