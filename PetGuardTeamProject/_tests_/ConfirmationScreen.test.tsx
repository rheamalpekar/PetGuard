import React from "react";
import { render } from "@testing-library/react-native";
import ConfirmationScreen from "../app/formscreens/ConfirmationPage";

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useLocalSearchParams: () => ({}),
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
    Promise.resolve({ isConnected: true, isInternetReachable: true })
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

// TEST
describe("ConfirmationScreen", () => {
  test("renders without crashing", () => {
    const { getByText } = render(<ConfirmationScreen />);
    expect(getByText("Request Confirmed")).toBeTruthy();
  });
});