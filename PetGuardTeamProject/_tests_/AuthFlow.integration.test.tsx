import React from "react";
import { Alert } from "react-native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import LoginScreen from "../app/auth/LoginScreen";

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockProtectedNavigate = jest.fn();
const mockLogin = jest.fn();
const mockConsumeRateLimit = jest.fn();
const mockContinueAsGuest = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children }: any) => children,
}));

jest.mock("expo-checkbox", () => {
  const React = require("react");
  const { TouchableOpacity, Text } = require("react-native");
  return ({ value, onValueChange }: any) => (
    <TouchableOpacity onPress={() => onValueChange(!value)}>
      <Text>{value ? "checked" : "unchecked"}</Text>
    </TouchableOpacity>
  );
});

jest.mock("../src/hooks/useProtectedNavigation", () => ({
  useProtectedNavigation: () => ({ protectedNavigate: mockProtectedNavigate }),
}));

jest.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({
    continueAsGuest: mockContinueAsGuest,
  }),
}));

jest.mock("../src/backendServices/AuthService", () => ({
  login: (...args: any[]) => mockLogin(...args),
}));

jest.mock("../src/backendServices/RateLimiter", () => ({
  consumeRateLimit: (...args: any[]) => mockConsumeRateLimit(...args),
  RATE_LIMIT_BUCKETS: {
    login: "auth-login",
  },
  RATE_LIMIT_WINDOW_MS: 60000,
}));

describe("integration: authentication flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(jest.fn());
    mockLogin.mockResolvedValue({ uid: "user-1" });
    mockConsumeRateLimit.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
  });

  test("signs in with credentials and redirects to the emergency home route", async () => {
    const screen = render(<LoginScreen />);

    fireEvent.changeText(screen.getByPlaceholderText("Email"), "person@test.com");
    fireEvent.changeText(screen.getByPlaceholderText("Password"), "Password1!");
    fireEvent.press(screen.getByText("Sign In"));

    await waitFor(() => {
      expect(mockConsumeRateLimit).toHaveBeenCalled();
      expect(mockLogin).toHaveBeenCalledWith("person@test.com", "Password1!", false);
      expect(mockReplace).toHaveBeenCalledWith("/emergency");
    });
  });
});
