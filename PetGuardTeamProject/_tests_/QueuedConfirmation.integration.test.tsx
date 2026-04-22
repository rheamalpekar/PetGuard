import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import ConfirmationScreen from "../app/formscreens/ConfirmationPage";

const mockUseLocalSearchParams = jest.fn();
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

jest.mock("@react-native-community/netinfo", () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() =>
    Promise.resolve({ isConnected: false, isInternetReachable: false }),
  ),
}));

jest.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({
    user: { uid: "user-1" },
    justSynced: false,
  }),
}));

jest.mock("../src/backendServices/ApiService", () => ({
  getInfoFormDataById: jest.fn(),
  loadQueuedInfoForms: jest.fn(async () => [
    {
      localId: "queued_555",
      data: {
        yourName: "Queued User",
        emailAddress: "queued@test.com",
        phoneNumber: "5557779999",
        additionalDetails: "Queued while offline",
        location: { address: "Offline Address" },
      },
    },
  ]),
  subscribeToActiveReports: jest.fn(() => jest.fn()),
}));

jest.mock("expo-clipboard", () => ({ setStringAsync: jest.fn() }));
jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
  MaterialCommunityIcons: "MaterialCommunityIcons",
  Feather: "Feather",
}));
jest.mock("@/components/DisclaimerText", () => () => null);

describe("integration: offline queued confirmation flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({ formId: "queued_555" });
  });

  test("loads queued request details and renders the offline request id and contact data", async () => {
    const screen = render(<ConfirmationScreen />);

    await waitFor(() => {
      expect(screen.getByText("queued_555")).toBeTruthy();
      expect(screen.getByText(/Queued User/)).toBeTruthy();
      expect(screen.getByText(/queued@test.com/)).toBeTruthy();
      expect(screen.getByText(/Offline Address/)).toBeTruthy();
    });
  });
});
