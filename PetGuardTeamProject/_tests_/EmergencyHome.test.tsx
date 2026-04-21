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

  it("Does not load a Firestore profile for guest users", async () => {
    mockAuthUser = { uid: "guest-1", isAnonymous: true };
    const { getByText } = render(<EmergencyHome />);
    const { getUserProfileWithCache } = require("@/backendServices/ApiService");

    await waitFor(() => {
      expect(getByText("Welcome, Guest User!")).toBeTruthy();
      expect(getUserProfileWithCache).not.toHaveBeenCalled();
    });
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

  it("routes the remaining service buttons through protected navigation", () => {
    const { getByText } = render(<EmergencyHome />);

    fireEvent.press(getByText("EMERGENCY SERVICES"));
    fireEvent.press(getByText("Car Accident"));
    fireEvent.press(getByText("Animal Cruelty"));
    fireEvent.press(getByText("Adopt / Surrender"));
    fireEvent.press(getByText("Spay / Neuter"));

    expect(mockProtectedNavigate).toHaveBeenCalledWith({
      pathname: "/emergency/report",
      params: { prefillType: "Emergency Services" },
    });
    expect(mockProtectedNavigate).toHaveBeenCalledWith({
      pathname: "/emergency/report",
      params: { prefillType: "Car Accident" },
    });
    expect(mockProtectedNavigate).toHaveBeenCalledWith({
      pathname: "/emergency/report",
      params: { prefillType: "Animal Cruelty" },
    });
    expect(mockProtectedNavigate).toHaveBeenCalledWith({
      pathname: "/emergency/report",
      params: { prefillType: "Adopt / Surrender" },
    });
    expect(mockProtectedNavigate).toHaveBeenCalledWith({
      pathname: "/emergency/report",
      params: { prefillType: "Spay / Neuter" },
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
      expect(router.replace).toHaveBeenCalledWith("/auth/LoginScreen");
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

  it("pressing dev navigation triggers navigation", () => {
    const { getByText } = render(<EmergencyHome />);
    const { router } = require("expo-router");

    fireEvent.press(getByText("Go to Login Screen"));
    fireEvent.press(getByText("Go to Profile Screen"));
    fireEvent.press(getByText("Go to Firebase test screen"));
    fireEvent.press(getByText("Go to Info Form Screen"));
    fireEvent.press(getByText("Go to Confirmation screen"));

    expect(router.push).toHaveBeenCalledWith("/auth/LoginScreen");
    expect(router.push).toHaveBeenCalledWith("/screens/UserProfileScreen");
    expect(mockProtectedNavigate).toHaveBeenCalledWith("/formscreens/FirebaseTestScreen");
    expect(mockProtectedNavigate).toHaveBeenCalledWith("/formscreens/info-form");
    expect(mockProtectedNavigate).toHaveBeenCalledWith("/formscreens/ConfirmationPage");
  });

  it("shows a web alert when logout fails on web", async () => {
    const { logoutUser } = require("@/backendServices/ApiService");
    const originalAlert = global.alert;
    global.alert = jest.fn();

    logoutUser.mockRejectedValueOnce(new Error("network down"));
    global.confirm = jest.fn(() => true);

    const { getByText } = render(<EmergencyHome />);
    fireEvent.press(getByText("Logout"));

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(
        "Error: Failed to logout. Please try again.",
      );
    });

    global.alert = originalAlert;
  });
});
