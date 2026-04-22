import React from "react";
import { Alert } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import UserProfileScreen from "../app/screens/UserProfileScreen";
import {
  clearCachedUserProfile,
  deleteUserAccount,
  getUserProfileWithCache,
  getUserRequests,
  logoutUser,
  updateUserProfile,
} from "../src/backendServices/ApiService";

let mockAuthUser: any = { uid: "123", isAnonymous: false };
let mockParams: any = {};
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useLocalSearchParams: () => mockParams,
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
    mockParams = {};
    (getUserProfileWithCache as jest.Mock).mockResolvedValue({
      fullName: "Test User",
      email: "test@test.com",
      phoneNumber: "123",
    });
    (getUserRequests as jest.Mock).mockResolvedValue([]);
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

  test("history tab loads and renders request history when requested in route params", async () => {
    mockParams = { tab: "history" };
    (getUserRequests as jest.Mock).mockResolvedValueOnce([
      {
        id: "req-1",
        formId: "FORM-1",
        uid: "123",
        additionalDetails: "Saved request",
        location: null,
        status: "pending",
        createdAt: new Date("2026-04-20T10:00:00Z"),
      },
    ]);

    const { getByText } = render(<UserProfileScreen />);

    await waitFor(() => {
      expect(getUserRequests).toHaveBeenCalledWith("123");
      expect(getByText("Request History")).toBeTruthy();
      expect(getByText("Request #FORM-1")).toBeTruthy();
      expect(getByText("Saved request")).toBeTruthy();
    });
  });

  test("signed-in users can sign out from settings", async () => {
    const { getByText } = render(<UserProfileScreen />);

    fireEvent.press(getByText("Settings"));
    fireEvent.press(getByText("Sign Out"));

    await waitFor(() => {
      expect(logoutUser).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith("/auth/LoginScreen");
    });
  });

  test("guest sign out skips backend logout and returns to login", async () => {
    mockAuthUser = { uid: "guest-1", isAnonymous: true };

    const { getByText } = render(<UserProfileScreen />);

    fireEvent.press(getByText("Settings"));
    fireEvent.press(getByText("Sign Out"));

    await waitFor(() => {
      expect(logoutUser).not.toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith("/auth/LoginScreen");
    });
  });

  test("shows fallback placeholders when no authenticated user is available", async () => {
    mockAuthUser = null;

    const { getAllByText } = render(<UserProfileScreen />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/auth/LoginScreen");
      expect(getAllByText("—").length).toBeGreaterThan(0);
    });
  });

  test("shows an error alert when clearing the profile cache fails", async () => {
    (clearCachedUserProfile as jest.Mock).mockRejectedValueOnce(
      new Error("cache-failed"),
    );

    const { getByText } = render(<UserProfileScreen />);

    fireEvent.press(getByText("Settings"));
    fireEvent.press(getByText("Clear Profile Cache"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Failed to clear cached profile information.",
      );
    });
  });

  test("saving profile edits calls updateUserProfile with current values", async () => {
    const { getByText } = render(<UserProfileScreen />);

    await waitFor(() => {
      expect(getUserProfileWithCache).toHaveBeenCalledWith("123");
    });

    fireEvent.press(getByText("Edit"));
    fireEvent.press(getByText("Save"));

    await waitFor(() => {
      expect(updateUserProfile).toHaveBeenCalledWith("123", {
        fullName: "Test User",
        phoneNumber: "123",
      });
    });
  });

  test("guest users trying to edit are redirected without saving", async () => {
    mockAuthUser = { uid: "guest-1", isAnonymous: true };

    const { getByText } = render(<UserProfileScreen />);

    fireEvent.press(getByText("Edit"));

    await waitFor(() => {
      expect(updateUserProfile).not.toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith("/auth/LoginScreen");
    });
  });

  test("delete account success shows confirmation and redirects to login", async () => {
    const { getByText } = render(<UserProfileScreen />);

    fireEvent.press(getByText("Settings"));
    fireEvent.press(getByText("Delete Account"));
    fireEvent.press(getByText("Continue"));
    fireEvent.press(getByText("Delete Forever"));

    await waitFor(() => {
      expect(deleteUserAccount).toHaveBeenCalledTimes(1);
      expect(Alert.alert).toHaveBeenCalledWith(
        "Account Deleted",
        "Your account and all data have been permanently removed.",
      );
      expect(mockReplace).toHaveBeenCalledWith("/auth/LoginScreen");
    });
  });

  test("delete account failure shows an error alert", async () => {
    (deleteUserAccount as jest.Mock).mockRejectedValueOnce(new Error("boom"));

    const { getByText } = render(<UserProfileScreen />);

    fireEvent.press(getByText("Settings"));
    fireEvent.press(getByText("Delete Account"));
    fireEvent.press(getByText("Continue"));
    fireEvent.press(getByText("Delete Forever"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Failed to delete account.",
      );
    });
  });

  test("guest delete account redirects to login without deleting data", async () => {
    mockAuthUser = { uid: "guest-1", isAnonymous: true };

    const { getByText } = render(<UserProfileScreen />);

    fireEvent.press(getByText("Settings"));
    fireEvent.press(getByText("Delete Account"));
    fireEvent.press(getByText("Continue"));
    fireEvent.press(getByText("Delete Forever"));

    await waitFor(() => {
      expect(deleteUserAccount).not.toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith("/auth/LoginScreen");
    });
  });
});
