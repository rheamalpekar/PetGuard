import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import UserProfileScreen from "../app/screens/UserProfileScreen";
import { getUserProfile } from "../src/backendServices/ApiService";

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
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
    currentUser: { uid: "123" },
  },
}));

jest.mock("../src/backendServices/ApiService", () => ({
  getUserProfile: jest.fn(() =>
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
    isGuest: false,
  }),
}));

describe("UserProfileScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getUserProfile as jest.Mock).mockResolvedValue({
      fullName: "Test User",
      email: "test@test.com",
      phoneNumber: "123",
    });
  });

  test("fetches profile on mount and renders user info", async () => {
    const { getByText, getAllByText } = render(<UserProfileScreen />);

    expect(getByText("PetGuard")).toBeTruthy();

    await waitFor(() => {
      expect(getUserProfile).toHaveBeenCalledWith("123");
      expect(getAllByText("Test User").length).toBeGreaterThan(0);
      expect(getAllByText("test@test.com").length).toBeGreaterThan(0);
      expect(getByText("123")).toBeTruthy();
    });
  });
});
