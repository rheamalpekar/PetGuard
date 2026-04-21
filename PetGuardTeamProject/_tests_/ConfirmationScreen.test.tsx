import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import ConfirmationScreen from "../app/formscreens/ConfirmationPage";

const mockUseLocalSearchParams = jest.fn();
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
  MaterialCommunityIcons: "MaterialCommunityIcons",
  Feather: "Feather",
}));

jest.mock("@react-native-community/netinfo", () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() =>
    Promise.resolve({ isConnected: true, isInternetReachable: true }),
  ),
}));

jest.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({
    user: { uid: "123" },
    justSynced: false,
  }),
}));

jest.mock("../src/backendServices/ApiService", () => ({
  getInfoFormDataById: jest.fn(),
  loadQueuedInfoForms: jest.fn(() => Promise.resolve([])),
  subscribeToActiveReports: jest.fn(() => jest.fn()),
}));

describe("ConfirmationScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({});
  });

  test("loads queued request data by local id", async () => {
    const {
      loadQueuedInfoForms,
    } = require("../src/backendServices/ApiService");
    mockUseLocalSearchParams.mockReturnValue({ formId: "queued_123" });
    loadQueuedInfoForms.mockResolvedValueOnce([
      {
        localId: "queued_123",
        data: {
          yourName: "Offline User",
          emailAddress: "offline@test.com",
          phoneNumber: "5551234567",
          additionalDetails: "Needs help",
          location: { address: "Queued Address" },
        },
      },
    ]);

    const { getByText } = render(<ConfirmationScreen />);

    await waitFor(() => {
      expect(getByText("queued_123")).toBeTruthy();
      expect(getByText(/Offline User/)).toBeTruthy();
      expect(getByText(/Queued Address/)).toBeTruthy();
    });
  });

  test("loads online request data by form id", async () => {
    const {
      getInfoFormDataById,
    } = require("../src/backendServices/ApiService");
    mockUseLocalSearchParams.mockReturnValue({ formId: "server_123" });
    getInfoFormDataById.mockResolvedValueOnce({
      yourName: "Server User",
      emailAddress: "server@test.com",
      phoneNumber: "5550001111",
      additionalDetails: "Server request",
      location: "Server Address",
    });

    const { getByText } = render(<ConfirmationScreen />);

    await waitFor(() => {
      expect(getInfoFormDataById).toHaveBeenCalledWith("server_123");
      expect(getByText("server_123")).toBeTruthy();
      expect(getByText(/Server User/)).toBeTruthy();
      expect(getByText(/Server Address/)).toBeTruthy();
    });
  });

  test("view all requests button opens profile history tab", async () => {
    const { getByText } = render(<ConfirmationScreen />);

    await waitFor(() => {
      expect(getByText("View All Requests")).toBeTruthy();
    });

    fireEvent.press(getByText("View All Requests"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/screens/UserProfileScreen",
      params: { tab: "history" },
    });
  });
});
