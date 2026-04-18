import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import InfoFormScreen from "../app/formscreens/info-form";


const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/backendServices/firebase", () => ({
  auth: {
    currentUser: { uid: "123" },
  },
}));

const mockSubmitInfoForm = jest.fn();
const mockEnqueue = jest.fn();

jest.mock("@/backendServices/ApiService", () => ({
  submitInfoForm: (...args: any[]) => mockSubmitInfoForm(...args),
  enqueueInfoForm: (...args: any[]) => mockEnqueue(...args),
}));

jest.mock("@react-native-community/netinfo", () => ({
  fetch: jest.fn(),
}));

jest.mock("../services/LocationService", () => ({
  initializeLocation: jest.fn((handlers: any) => {
    handlers.setMapRegion({
      latitude: 1,
      longitude: 1,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    });
  }),
  getCurrentLocationWithAddress: jest.fn(({ setValue, setLocationAddress }: any) => {
    setLocationAddress("Test Address");
    setValue("location", {
      latitude: 1,
      longitude: 1,
      address: "Test Address",
    });
  }),
  handleMapPress: jest.fn(),
  handleMarkerDragEnd: jest.fn(),
}));

jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 1, longitude: 1 },
  }),
  reverseGeocodeAsync: jest.fn().mockResolvedValue([
    { formattedAddress: "Test Address" },
  ]),
}));

jest.mock("expo-image-picker", () => ({}));
jest.mock("expo-document-picker", () => ({}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("@/components/PhotoUploadComponent", () => {
  const React = require("react");
  return React.forwardRef((_props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      getPhotos: () => [{ uri: "test.jpg" }],
      validate: () => true,
      reset: jest.fn(),
    }));
    return null;
  });
});

jest.mock("@/constants/theme", () => ({
  Colors: {
    light: {
      background: "#fff",
      text: "#000",
      icon: "#888",
    },
  },
}));

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "light",
}));

jest.mock("@/components/DisclaimerText", () => () => null);


describe("InfoFormScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("submits ONLINE flow correctly", async () => {
    const NetInfo = require("@react-native-community/netinfo");

    NetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    });

    mockSubmitInfoForm.mockResolvedValue({
      success: true,
      formId: "abc123",
    });

    const { getByText, getByPlaceholderText } = render(<InfoFormScreen />);

    fireEvent.changeText(getByPlaceholderText("Your name"), "John");
    fireEvent.changeText(getByPlaceholderText("Phone number"), "1234567890");
    fireEvent.changeText(getByPlaceholderText("Email address"), "test@test.com");

    fireEvent.press(getByText("YES"));

    fireEvent.press(getByText("Use My Location"));

    fireEvent.press(getByText("Submit Report"));

    await waitFor(() => {
      expect(mockSubmitInfoForm).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalled();
    });
  });

  it("submits OFFLINE flow correctly", async () => {
    const NetInfo = require("@react-native-community/netinfo");

    NetInfo.fetch.mockResolvedValue({
      isConnected: false,
      isInternetReachable: false,
    });

    const { getByText, getByPlaceholderText } = render(<InfoFormScreen />);

    fireEvent.changeText(getByPlaceholderText("Your name"), "John");
    fireEvent.changeText(getByPlaceholderText("Phone number"), "1234567890");
    fireEvent.changeText(getByPlaceholderText("Email address"), "test@test.com");

    fireEvent.press(getByText("YES"));

    fireEvent.press(getByText("Use My Location"));

    fireEvent.press(getByText("Submit Report"));

    await waitFor(() => {
      expect(mockEnqueue).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalled();
    });
  });
});