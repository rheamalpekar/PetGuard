import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import InfoFormScreen from "../app/formscreens/info-form";

const mockPush = jest.fn();
const mockPhotoValidate = jest.fn();
const mockGetPhotos = jest.fn();
const mockPhotoReset = jest.fn();

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

jest.mock("@/backendServices/RateLimiter", () => {
  class RateLimitError extends Error {
    retryAfterSeconds: number;

    constructor(retryAfterSeconds: number) {
      super(`Too many attempts. Please try again in ${retryAfterSeconds} seconds.`);
      this.name = "RateLimitError";
      this.retryAfterSeconds = retryAfterSeconds;
      Object.setPrototypeOf(this, RateLimitError.prototype);
    }
  }

  return { RateLimitError };
});

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
  getCurrentLocationWithAddress: jest.fn(
    ({ setValue, setLocationAddress }: any) => {
      setLocationAddress("Test Address");
      setValue("location", {
        latitude: 1,
        longitude: 1,
        address: "Test Address",
      });
    },
  ),
  handleMapPress: jest.fn(),
  handleMarkerDragEnd: jest.fn(),
}));

jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ status: "granted" }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 1, longitude: 1 },
  }),
  reverseGeocodeAsync: jest
    .fn()
    .mockResolvedValue([{ formattedAddress: "Test Address" }]),
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
      getPhotos: mockGetPhotos,
      validate: mockPhotoValidate,
      reset: mockPhotoReset,
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
    mockPhotoValidate.mockReturnValue(true);
    mockGetPhotos.mockReturnValue([{ uri: "test.jpg" }]);
  });

  it("updates form state from user input", () => {
    const { getByPlaceholderText } = render(<InfoFormScreen />);

    const nameInput = getByPlaceholderText("Your name");
    const phoneInput = getByPlaceholderText("Phone number");
    const emailInput = getByPlaceholderText("Email address");

    fireEvent.changeText(nameInput, "John");
    fireEvent.changeText(phoneInput, "1234567890");
    fireEvent.changeText(emailInput, "test@test.com");

    expect(nameInput.props.value).toBe("John");
    expect(phoneInput.props.value).toBe("1234567890");
    expect(emailInput.props.value).toBe("test@test.com");
  });

  it("shows required-field validation and blocks submit", async () => {
    const { getByText, findByText } = render(<InfoFormScreen />);

    fireEvent.press(getByText("Submit Report"));

    expect(
      await findByText("Please select a location on the map"),
    ).toBeTruthy();
    expect(await findByText("Name is required")).toBeTruthy();
    expect(await findByText("Phone number is required")).toBeTruthy();
    expect(await findByText("Email address is required")).toBeTruthy();
    expect(mockSubmitInfoForm).not.toHaveBeenCalled();
    expect(mockEnqueue).not.toHaveBeenCalled();
  });

  it("Use My Location updates the displayed location", async () => {
    const { getByText, findByText } = render(<InfoFormScreen />);

    fireEvent.press(getByText("Use My Location"));

    expect(await findByText("Test Address")).toBeTruthy();
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
    fireEvent.changeText(
      getByPlaceholderText("Email address"),
      "test@test.com",
    );

    fireEvent.press(getByText("YES"));

    fireEvent.press(getByText("Use My Location"));

    fireEvent.press(getByText("Submit Report"));

    await waitFor(() => {
      expect(mockSubmitInfoForm).toHaveBeenCalledWith(
        expect.objectContaining({
          yourName: "John",
          phoneNumber: "1234567890",
          emailAddress: "test@test.com",
          location: expect.objectContaining({ address: "Test Address" }),
        }),
        ["test.jpg"],
      );
      expect(mockEnqueue).not.toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/formscreens/ConfirmationPage",
        params: { formId: "abc123" },
      });
    });
  });

  it("shows rate limit message and does not queue when online submit is blocked", async () => {
    const NetInfo = require("@react-native-community/netinfo");
    const { RateLimitError } = require("@/backendServices/RateLimiter");

    NetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    });

    mockSubmitInfoForm.mockRejectedValue(new RateLimitError(60));

    const { getByText, getByPlaceholderText, findByText } = render(
      <InfoFormScreen />,
    );

    fireEvent.changeText(getByPlaceholderText("Your name"), "John");
    fireEvent.changeText(getByPlaceholderText("Phone number"), "1234567890");
    fireEvent.changeText(
      getByPlaceholderText("Email address"),
      "test@test.com",
    );
    fireEvent.press(getByText("YES"));
    fireEvent.press(getByText("Use My Location"));
    fireEvent.press(getByText("Submit Report"));

    expect(
      await findByText("Too many submissions. Please try again in 60 seconds."),
    ).toBeTruthy();
    expect(mockEnqueue).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
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
    fireEvent.changeText(
      getByPlaceholderText("Email address"),
      "test@test.com",
    );

    fireEvent.press(getByText("YES"));

    fireEvent.press(getByText("Use My Location"));

    fireEvent.press(getByText("Submit Report"));

    await waitFor(() => {
      expect(mockSubmitInfoForm).not.toHaveBeenCalled();
      expect(mockEnqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: "123",
          data: expect.objectContaining({
            yourName: "John",
            formId: expect.stringMatching(/^queued_/),
          }),
          photoUris: ["test.jpg"],
          retryCount: 0,
        }),
      );
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/formscreens/ConfirmationPage",
        params: { formId: expect.stringMatching(/^queued_/) },
      });
    });
  });
});
