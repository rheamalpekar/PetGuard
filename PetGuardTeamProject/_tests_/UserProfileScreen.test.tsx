import React from "react";
import { render } from "@testing-library/react-native";
import UserProfileScreen from "../app/screens/UserProfileScreen";

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
    })
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
  test("renders basic profile screen", async () => {
    const { getByText } = render(<UserProfileScreen />);

    expect(getByText("PetGuard")).toBeTruthy();
  });
});