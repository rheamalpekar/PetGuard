import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import EmergencyHome from "../app/emergency/index";
import { Platform } from "react-native";

let mockAuthUser: any = { uid: "123", isAnonymous: false };

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

const mockProtectedNavigate = jest.fn();

jest.mock("@/hooks/useProtectedNavigation", () => ({
  useProtectedNavigation: () => ({
    protectedNavigate: mockProtectedNavigate,
  }),
}));

jest.mock("@/backendServices/ApiService", () => ({
  logoutUser: jest.fn(),
  getUserProfileWithCache: jest.fn(() =>
    Promise.resolve({ fullName: "Test User" }),
  ),
}));

jest.mock("@/backendServices/firebase", () => ({
  auth: {
    get currentUser() {
      return mockAuthUser;
    },
  },
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: mockAuthUser,
    isGuest: mockAuthUser?.isAnonymous ?? false,
  }),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
  MaterialCommunityIcons: "MaterialCommunityIcons",
  FontAwesome5: "FontAwesome5",
}));

Platform.OS = "web";
global.confirm = jest.fn(() => true);
jest.spyOn(console, "log").mockImplementation(() => {});

describe("EmergencyHome", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthUser = { uid: "123", isAnonymous: false };
  });

  it("renders welcome text", async () => {
    const { getByText } = render(<EmergencyHome />);
    await waitFor(() => {
      expect(getByText("Welcome, Test User!")).toBeTruthy();
    });
  });

  it("Does not load a Firestore profile for guest users", async () => {
    mockAuthUser = { uid: "guest-1", isAnonymous: true };
    const { getByText } = render(<EmergencyHome />);
    const { getUserProfileWithCache } = require("@/backendServices/ApiService");

    await waitFor(() => {
      expect(getByText("Welcome, Guest User!")).toBeTruthy();
      expect(getUserProfileWithCache).not.toHaveBeenCalled();
    });
  });

  it("Renders all service tiles", () => {
    const { getByText } = render(<EmergencyHome />);

    expect(getByText("Sick Animal")).toBeTruthy();
    expect(getByText("Car Accident")).toBeTruthy();
    expect(getByText("Animal Cruelty")).toBeTruthy();
    expect(getByText("Vaccination")).toBeTruthy();
    expect(getByText("Adopt / Surrender")).toBeTruthy();
    expect(getByText("Spay / Neuter")).toBeTruthy();
  });

  it("navigates with selected emergency service when tile pressed", () => {
    const { getByText } = render(<EmergencyHome />);

    fireEvent.press(getByText("Sick Animal"));

    expect(mockProtectedNavigate).toHaveBeenCalledWith({
      pathname: "/emergency/report",
      params: { prefillType: "Sick Animal" },
    });
  });

  it("navigates with selected non-emergency service when tile pressed", () => {
    const { getByText } = render(<EmergencyHome />);

    fireEvent.press(getByText("Vaccination"));

    expect(mockProtectedNavigate).toHaveBeenCalledWith({
      pathname: "/emergency/report",
      params: { prefillType: "Vaccination" },
    });
  });

  it("navigates to profile screen", () => {
    const { getByText } = render(<EmergencyHome />);
    const { router } = require("expo-router");

    fireEvent.press(getByText("Profile"));

    expect(router.push).toHaveBeenCalledWith("/screens/UserProfileScreen");
  });

  it("calls logout flow", async () => {
    const { getByText } = render(<EmergencyHome />);
    const { logoutUser } = require("@/backendServices/ApiService");
    const { router } = require("expo-router");

    global.confirm = jest.fn(() => true);

    fireEvent.press(getByText("Logout"));

    await waitFor(() => {
      expect(logoutUser).toHaveBeenCalled();
      expect(router.replace).toHaveBeenCalledWith("/auth/login");
    });
  });

  it("handles logout cancel", async () => {
    const { getByText } = render(<EmergencyHome />);
    const { logoutUser } = require("@/backendServices/ApiService");

    global.confirm = jest.fn(() => false);

    fireEvent.press(getByText("Logout"));

    await waitFor(() => {
      expect(logoutUser).not.toHaveBeenCalled();
    });
  });

  it("renders dev navigation buttons", () => {
    const { getByText } = render(<EmergencyHome />);

    expect(getByText("Go to Firebase test screen")).toBeTruthy();
    expect(getByText("Go to Login Screen")).toBeTruthy();
    expect(getByText("Go to Profile Screen")).toBeTruthy();
    expect(getByText("Go to Info Form Screen")).toBeTruthy();
    expect(getByText("Go to Confirmation screen")).toBeTruthy();
  });

  it("pressing dev navigation triggers navigation", () => {
    const { getByText } = render(<EmergencyHome />);
    const { router } = require("expo-router");

    fireEvent.press(getByText("Go to Login Screen"));

    expect(router.push).toHaveBeenCalled();
  });
});
