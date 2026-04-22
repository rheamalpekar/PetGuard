import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Alert, Platform } from "react-native";
import InfoFormScreen from "../app/formscreens/info-form";
import ConfirmationScreen from "../app/formscreens/ConfirmationPage";

const mockPush = jest.fn();
let mockCurrentParams: Record<string, any> = {};
let mockSubmittedFormSnapshot: any = null;

const mockSubmitInfoForm = jest.fn(async (data: any, _files?: any) => {
  mockSubmittedFormSnapshot = data;
  return { success: true, formId: "server-flow-123" };
});

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: (input: any) => {
      mockPush(input);
      if (typeof input === "object" && input?.params) {
        mockCurrentParams = input.params;
      }
    },
  }),
  useLocalSearchParams: () => mockCurrentParams,
}));

jest.mock("@/backendServices/firebase", () => ({
  auth: {
    currentUser: { uid: "user-1" },
  },
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: { uid: "user-1" },
    justSynced: false,
  }),
}));

jest.mock("@react-native-community/netinfo", () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() =>
    Promise.resolve({ isConnected: true, isInternetReachable: true }),
  ),
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
    ({ setValue, setLocationAddress, setMarkerPosition }: any) => {
      setLocationAddress("123 Pet Lane");
      setMarkerPosition({ latitude: 1, longitude: 1 });
      setValue("location", {
        latitude: 1,
        longitude: 1,
        address: "123 Pet Lane",
      });
    },
  ),
  handleMapPress: jest.fn(),
  handleMarkerDragEnd: jest.fn(),
}));

jest.mock("@/backendServices/ApiService", () => ({
  submitInfoForm: (a: any, b?: any) => mockSubmitInfoForm(a, b),
  enqueueInfoForm: jest.fn(),
  getInfoFormDataById: jest.fn(async (formId: string) => ({
    ...mockSubmittedFormSnapshot,
    formId,
  })),
  loadQueuedInfoForms: jest.fn(async () => []),
  subscribeToActiveReports: jest.fn(() => jest.fn()),
}));

jest.mock("@/backendServices/RateLimiter", () => {
  class RateLimitError extends Error {
    retryAfterSeconds: number;
    constructor(retryAfterSeconds: number) {
      super("rate limited");
      this.retryAfterSeconds = retryAfterSeconds;
    }
  }
  return { RateLimitError };
});

jest.mock("@/components/DisclaimerText", () => () => null);
jest.mock("expo-clipboard", () => ({ setStringAsync: jest.fn() }));
jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
  MaterialCommunityIcons: "MaterialCommunityIcons",
  Feather: "Feather",
}));
jest.mock("expo-image-picker", () => ({}));
jest.mock("expo-document-picker", () => ({}));
jest.mock("expo-location", () => ({}));
jest.mock("react-native-maps", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: React.forwardRef((props: any, ref: any) => (
      <View ref={ref} {...props}>
        {props.children}
      </View>
    )),
    Marker: ({ children }: any) => <>{children}</>,
  };
});
jest.mock("@/constants/theme", () => ({
  Colors: { light: { background: "#fff", text: "#000", icon: "#666" } },
}));
jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "light",
}));
jest.mock("@/components/PhotoUploadComponent", () => {
  const React = require("react");
  return React.forwardRef((_props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      getPhotos: () => [{ uri: "pet.jpg" }],
      validate: () => true,
      reset: jest.fn(),
    }));
    return null;
  });
});

describe("integration: form submission flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentParams = {};
    mockSubmittedFormSnapshot = null;
    Platform.OS = "ios";
    jest.spyOn(Alert, "alert").mockImplementation(jest.fn());
  });

  test("submits the info form and shows the submitted request on the confirmation screen", async () => {
    const form = render(<InfoFormScreen />);

    fireEvent.changeText(form.getByPlaceholderText("Your name"), "Taylor");
    fireEvent.changeText(form.getByPlaceholderText("Phone number"), "8175551212");
    fireEvent.changeText(form.getByPlaceholderText("Email address"), "taylor@test.com");
    fireEvent.changeText(form.getAllByDisplayValue("").at(-1)!, "Please help this pet.");
    fireEvent.press(form.getByText("YES"));
    fireEvent.press(form.getByText("Use My Location"));
    fireEvent.press(form.getByText("Submit Report"));

    await waitFor(() => {
      expect(mockSubmitInfoForm).toHaveBeenCalledWith(
        expect.objectContaining({
          yourName: "Taylor",
          phoneNumber: "(817) 555-1212",
          emailAddress: "taylor@test.com",
          additionalDetails: "Please help this pet.",
          location: expect.objectContaining({ address: "123 Pet Lane" }),
        }),
        ["pet.jpg"],
      );
      expect(mockCurrentParams).toEqual({ formId: "server-flow-123" });
    });

    form.unmount();

    const confirmation = render(<ConfirmationScreen />);

    await waitFor(() => {
      expect(confirmation.getByText("server-flow-123")).toBeTruthy();
      expect(confirmation.getByText(/Taylor/)).toBeTruthy();
      expect(confirmation.getByText(/taylor@test.com/)).toBeTruthy();
      expect(confirmation.getByText(/123 Pet Lane/)).toBeTruthy();
    });
  });
});
