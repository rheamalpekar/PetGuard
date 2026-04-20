import React from "react";
import { Alert } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import UserProfileScreen from "../app/screens/UserProfileScreen";
import {
  clearCachedUserProfile,
  getUserProfileWithCache,
} from "../src/backendServices/ApiService";

let mockAuthUser: any = { uid: "123", isAnonymous: false };

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn((auth, cb) => {
    cb({ uid: "123" });
    return jest.fn();
  }),
}));

jest.mock("../src/backendServices/firebase", () => ({
  auth: {
    get currentUser() {
      return mockAuthUser;
    },
  },
}));

jest.mock("../src/backendServices/ApiService", () => ({
  clearCachedUserProfile: jest.fn(() => Promise.resolve()),
  getUserProfileWithCache: jest.fn(() =>
    Promise.resolve({
      fullName: "Test User",
      email: "test@test.com",
      phoneNumber: "123",
    }),
  ),
  updateUserProfile: jest.fn(),
  getUserRequests: jest.fn(() => Promise.resolve([])),
  deleteUserAccount: jest.fn(),
  logoutUser: jest.fn(),
}));

jest.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({
    user: mockAuthUser,
    isGuest: mockAuthUser?.isAnonymous ?? false,
  }),
}));

describe("UserProfileScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(jest.fn());
    mockAuthUser = { uid: "123", isAnonymous: false };
    (getUserProfileWithCache as jest.Mock).mockResolvedValue({
      fullName: "Test User",
      email: "test@test.com",
      phoneNumber: "123",
    });
  });

  test("fetches profile on mount and renders user info", async () => {
    const { getByText, getAllByText } = render(<UserProfileScreen />);

    expect(getByText("PetGuard")).toBeTruthy();

    await waitFor(() => {
      expect(getUserProfileWithCache).toHaveBeenCalledWith("123");
      expect(getAllByText("Test User").length).toBeGreaterThan(0);
      expect(getAllByText("test@test.com").length).toBeGreaterThan(0);
      expect(getByText("123")).toBeTruthy();
    });
  });

  test("guest profile uses fallback data without loading a Firestore user document", async () => {
    mockAuthUser = { uid: "guest-1", isAnonymous: true };

    const { getByText, getAllByText } = render(<UserProfileScreen />);

    await waitFor(() => {
      expect(getUserProfileWithCache).not.toHaveBeenCalled();
      expect(getAllByText("Guest User").length).toBeGreaterThan(0);
      expect(getByText("guest@preview.app")).toBeTruthy();
    });
  });

  test("clear profile cache removes current account cache", async () => {
    const { getByText, queryAllByText } = render(<UserProfileScreen />);

    await waitFor(() => {
      expect(getUserProfileWithCache).toHaveBeenCalledWith("123");
      expect(queryAllByText("Test User").length).toBeGreaterThan(0);
    });

    fireEvent.press(getByText("Settings"));
    fireEvent.press(getByText("Clear Profile Cache"));

    await waitFor(() => {
      expect(clearCachedUserProfile).toHaveBeenCalledWith("123");
      expect(Alert.alert).toHaveBeenCalledWith(
        "Cache Cleared",
        "Stored profile information was cleared.",
      );
      expect(queryAllByText("Test User")).toHaveLength(0);
    });
  });

  test("guest users see profile cache action but get an unavailable message", async () => {
    mockAuthUser = { uid: "guest-1", isAnonymous: true };

    const { getByText } = render(<UserProfileScreen />);

    fireEvent.press(getByText("Settings"));
    fireEvent.press(getByText("Clear Profile Cache"));

    await waitFor(() => {
      expect(clearCachedUserProfile).not.toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        "Not Available",
        "Profile cache clearing is only available for signed-in accounts.",
      );
    });
  });
});
