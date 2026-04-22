import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert, Platform } from "react-native";
import InfoFormScreen from "../app/formscreens/info-form";

const mockPush = jest.fn();
const mockPhotoValidate = jest.fn();
const mockGetPhotos = jest.fn();
const mockPhotoReset = jest.fn();
const mockHandleMapPress = jest.fn();
const mockHandleMarkerDragEnd = jest.fn();
let mockAuthUser: any = { uid: "123" };

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useLocalSearchParams: () => ({}),
}));

jest.mock("@/backendServices/firebase", () => ({
  auth: {
    get currentUser() {
      return mockAuthUser;
    },
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
  AccuracyLevel: {
    HIGH: "HIGH",
    MEDIUM: "MEDIUM",
    LOW: "LOW",
    VERY_LOW: "VERY_LOW",
  },
  initializeLocation: jest.fn((handlers: any) => {
    handlers.setMapRegion({
      latitude: 1,
      longitude: 1,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    });
  }),
  getCurrentLocationWithAddress: jest.fn(
    ({ setValue, setLocationAddress, setMarkerPosition, setLocationAccuracy }: any) => {
      setLocationAddress("Test Address");
      setMarkerPosition({ latitude: 1, longitude: 1 });
      setLocationAccuracy({
        level: "HIGH",
        description: "Precise GPS",
        meters: 4,
      });
      setValue("location", {
        latitude: 1,
        longitude: 1,
        address: "Test Address",
      });
    },
  ),
  handleMapPress: (...args: any[]) => mockHandleMapPress(...args),
  handleMarkerDragEnd: (...args: any[]) => mockHandleMarkerDragEnd(...args),
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

jest.mock("react-native-maps", () => {
  const React = require("react");
  const { View } = require("react-native");

  const MapView = React.forwardRef((props: any, ref: any) => (
    <View ref={ref} testID="native-map" {...props}>
      {props.children}
    </View>
  ));

  const Marker = (props: any) => (
    <View testID="native-marker" {...props}>
      {props.children}
    </View>
  );

  return { __esModule: true, default: MapView, Marker };
});

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
    jest.spyOn(Alert, "alert").mockImplementation(jest.fn());
    Platform.OS = "ios";
    mockAuthUser = { uid: "123" };
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
    expect(phoneInput.props.value).toBe("(123) 456-7890");
    expect(emailInput.props.value).toBe("test@test.com");
  });

  it("shows required-field validation and blocks submit", async () => {
    const { getByText, findByText } = render(<InfoFormScreen />);

    fireEvent.press(getByText("Submit Report"));

    expect(
      await findByText("Location: This field is required"),
    ).toBeTruthy();
    expect(await findByText("Your Name: This field is required")).toBeTruthy();
    expect(await findByText("Phone Number: This field is required")).toBeTruthy();
    expect(await findByText("Email Address: This field is required")).toBeTruthy();
    expect(mockSubmitInfoForm).not.toHaveBeenCalled();
    expect(mockEnqueue).not.toHaveBeenCalled();
  });

  it("Use My Location updates the displayed location", async () => {
    const { getByText, findByText } = render(<InfoFormScreen />);

    fireEvent.press(getByText("Use My Location"));

    expect(await findByText("Test Address")).toBeTruthy();
  });

  it("requires transportation selection before contact field focus can proceed cleanly", async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<InfoFormScreen />);

    fireEvent.changeText(getByPlaceholderText("Your name"), "John");
    fireEvent.changeText(getByPlaceholderText("Phone number"), "1234567890");
    fireEvent.changeText(getByPlaceholderText("Email address"), "test@test.com");
    fireEvent.press(getByText("Use My Location"));
    fireEvent.press(getByText("Submit Report"));

    expect(
      await findByText("Please select a transportation option"),
    ).toBeTruthy();
    expect(mockSubmitInfoForm).not.toHaveBeenCalled();
  });

  it("shows transportation validation when form fields are complete but no transport option is selected", async () => {
    const { getByText, getByPlaceholderText, findByText } = render(
      <InfoFormScreen />,
    );

    fireEvent.changeText(getByPlaceholderText("Your name"), "John");
    fireEvent.changeText(getByPlaceholderText("Phone number"), "1234567890");
    fireEvent.changeText(
      getByPlaceholderText("Email address"),
      "test@test.com",
    );
    fireEvent.press(getByText("Use My Location"));
    fireEvent.press(getByText("Submit Report"));

    expect(
      await findByText("Please select a transportation option"),
    ).toBeTruthy();
    expect(mockSubmitInfoForm).not.toHaveBeenCalled();
    expect(mockEnqueue).not.toHaveBeenCalled();
  });

  it("blocks submission when photo validation fails even if form fields are filled", async () => {
    const NetInfo = require("@react-native-community/netinfo");
    NetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    });
    mockPhotoValidate.mockReturnValue(false);

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

    await findByText("Test Address");
    expect(mockSubmitInfoForm).not.toHaveBeenCalled();
    expect(mockEnqueue).not.toHaveBeenCalled();
  });

  it("shows an auth error when no current user exists", async () => {
    const NetInfo = require("@react-native-community/netinfo");
    NetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    });
    mockAuthUser = null;

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
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "User not authenticated",
      );
      expect(mockSubmitInfoForm).not.toHaveBeenCalled();
      expect(mockEnqueue).not.toHaveBeenCalled();
    });
  });

  it("uses the web location input branch when running on web", async () => {
    Platform.OS = "web";
    const { getByPlaceholderText, queryByText } = render(
      <InfoFormScreen />,
    );

    const webLocationInput = getByPlaceholderText("Enter address or coordinates");
    fireEvent.changeText(webLocationInput, "123 Main St");

    await waitFor(() => {
      expect(webLocationInput.props.value).toBe("123 Main St");
      expect(queryByText(/Location detected:/)).toBeNull();
    });
  });

  it("clears the transportation error when selecting NO", async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <InfoFormScreen />,
    );

    fireEvent.changeText(getByPlaceholderText("Your name"), "John");
    fireEvent.changeText(getByPlaceholderText("Phone number"), "1234567890");
    fireEvent.changeText(getByPlaceholderText("Email address"), "test@test.com");
    fireEvent.press(getByText("Use My Location"));
    fireEvent.press(getByText("Submit Report"));
    await waitFor(() =>
      expect(
        getByText("Please select a transportation option"),
      ).toBeTruthy(),
    );

    fireEvent.press(getByText("NO"));

    await waitFor(() => {
      expect(queryByText("Please select a transportation option")).toBeNull();
    });
  });

  it("shows the transport error when the email field is focused before a selection is made", async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<InfoFormScreen />);

    fireEvent.changeText(getByPlaceholderText("Your name"), "John");
    fireEvent.changeText(getByPlaceholderText("Phone number"), "1234567890");
    fireEvent.changeText(getByPlaceholderText("Email address"), "test@test.com");
    fireEvent.press(getByText("Use My Location"));
    fireEvent.press(getByText("Submit Report"));

    expect(
      await findByText("Please select a transportation option"),
    ).toBeTruthy();
  });

  it("shows the transport error when additional details is focused before a selection is made", async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<InfoFormScreen />);

    fireEvent.changeText(getByPlaceholderText("Your name"), "John");
    fireEvent.changeText(getByPlaceholderText("Phone number"), "1234567890");
    fireEvent.changeText(getByPlaceholderText("Email address"), "test@test.com");
    fireEvent.press(getByText("Use My Location"));
    fireEvent.press(getByText("Submit Report"));

    expect(
      await findByText("Please select a transportation option"),
    ).toBeTruthy();
  });

  it("clears GPS accuracy after selecting a map point and after dragging the marker", async () => {
    mockHandleMapPress.mockImplementation((_event: any, handlers: any) => {
      handlers.setMarkerPosition({ latitude: 2, longitude: 2 });
      handlers.setLocationAddress("Manual Pin");
      handlers.setValue("location", {
        latitude: 2,
        longitude: 2,
        address: "Manual Pin",
      });
    });
    mockHandleMarkerDragEnd.mockImplementation((_event: any, handlers: any) => {
      handlers.setMarkerPosition({ latitude: 3, longitude: 3 });
      handlers.setLocationAddress("Dragged Pin");
      handlers.setValue("location", {
        latitude: 3,
        longitude: 3,
        address: "Dragged Pin",
      });
    });

    const { getByText, getByTestId, queryByText } = render(<InfoFormScreen />);

    fireEvent.press(getByText("Use My Location"));

    await waitFor(() => {
      expect(getByText(/Precise GPS/)).toBeTruthy();
      expect(getByTestId("native-marker")).toBeTruthy();
    });

    fireEvent.press(getByTestId("native-map"), {
      nativeEvent: { coordinate: { latitude: 2, longitude: 2 } },
    });

    await waitFor(() => {
      expect(mockHandleMapPress).toHaveBeenCalled();
      expect(queryByText(/Precise GPS/)).toBeNull();
      expect(getByText("Manual Pin")).toBeTruthy();
    });

    fireEvent(getByTestId("native-marker"), "dragEnd", {
      nativeEvent: { coordinate: { latitude: 3, longitude: 3 } },
    });

    await waitFor(() => {
      expect(mockHandleMarkerDragEnd).toHaveBeenCalled();
      expect(getByText("Dragged Pin")).toBeTruthy();
    });
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
          phoneNumber: "(123) 456-7890",
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

  it("falls back to offline queueing when online submit times out", async () => {
    jest.useFakeTimers();
    const NetInfo = require("@react-native-community/netinfo");

    NetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    });

    mockSubmitInfoForm.mockImplementation(
      () => new Promise(() => undefined),
    );

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

    await waitFor(() => expect(mockSubmitInfoForm).toHaveBeenCalled());

    await Promise.resolve();
    jest.advanceTimersByTime(8000);

    await waitFor(() => {
      expect(mockEnqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: "123",
          photoUris: ["test.jpg"],
        }),
      );
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/formscreens/ConfirmationPage",
        params: { formId: expect.stringMatching(/^queued_/) },
      });
    });

    jest.useRealTimers();
  });

  it("ignores a second submit press while a submission is already locked", async () => {
    const NetInfo = require("@react-native-community/netinfo");

    NetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    });

    let resolveSubmit: ((value: any) => void) | undefined;
    mockSubmitInfoForm.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSubmit = resolve;
        }),
    );

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
    fireEvent.press(getByText("Submit Report"));

    await waitFor(() => {
      expect(mockSubmitInfoForm).toHaveBeenCalledTimes(1);
    });

    resolveSubmit?.({ success: true, formId: "abc123" });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/formscreens/ConfirmationPage",
        params: { formId: "abc123" },
      });
    });
  });

  it("does not navigate when the online response is successful=false", async () => {
    const NetInfo = require("@react-native-community/netinfo");

    NetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    });
    mockSubmitInfoForm.mockResolvedValue({ success: false, formId: "ignored" });

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
      expect(mockSubmitInfoForm).toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
      expect(mockPhotoReset).not.toHaveBeenCalled();
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
