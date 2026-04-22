import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import RegisterScreen from "../app/auth/RegisterScreen";
import { register } from "../src/backendServices/AuthService";

const mockReplace = jest.fn();
const mockConsumeRateLimit = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
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

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock("../src/backendServices/AuthService", () => ({
  register: jest.fn(() => Promise.resolve()),
}));

jest.mock("../src/backendServices/RateLimiter", () => ({
  consumeRateLimit: (...args: any[]) => mockConsumeRateLimit(...args),
  RATE_LIMIT_BUCKETS: {
    login: "auth-login",
    register: "auth-register",
    infoFormSubmit: "info-form-submit",
  },
  RATE_LIMIT_WINDOW_MS: 60 * 1000,
}));

describe("RegisterScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(jest.fn());
    (register as jest.Mock).mockResolvedValue({ uid: "user-1" });
    mockConsumeRateLimit.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
  });

  test("valid input calls register and returns to login", async () => {
    const { getByPlaceholderText, getByText, getAllByText } = render(
      <RegisterScreen />,
    );

    fireEvent.changeText(getByPlaceholderText("Full Name"), "John Doe");
    fireEvent.changeText(getByPlaceholderText("Email"), "john@test.com");
    fireEvent.changeText(getByPlaceholderText("Phone Number"), "1234567890");
    fireEvent.changeText(getByPlaceholderText("Password"), "Password1!");
    fireEvent.changeText(
      getByPlaceholderText("Confirm Password"),
      "Password1!",
    );

    fireEvent.press(getByText("unchecked"));

    fireEvent.press(getAllByText("Create Account")[1]);

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith(
        "john@test.com",
        "Password1!",
        "John Doe",
        "1234567890",
      );
      expect(Alert.alert).toHaveBeenCalledWith(
        "Success",
        "Account created successfully.",
      );
      expect(mockReplace).toHaveBeenCalledWith("/auth/LoginScreen");
    });
  });

  test("password mismatch disables submit and blocks registration", () => {
    const { getByPlaceholderText, getByText, getAllByText } = render(
      <RegisterScreen />,
    );

    fireEvent.changeText(getByPlaceholderText("Full Name"), "John Doe");
    fireEvent.changeText(getByPlaceholderText("Email"), "john@test.com");
    fireEvent.changeText(getByPlaceholderText("Phone Number"), "1234567890");
    fireEvent.changeText(getByPlaceholderText("Password"), "Password1!");
    fireEvent.changeText(
      getByPlaceholderText("Confirm Password"),
      "Password2!",
    );
    fireEvent.press(getByText("unchecked"));
    fireEvent.press(getAllByText("Create Account")[1]);

    expect(register).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("rate limited registration shows inline error and blocks register", async () => {
    mockConsumeRateLimit.mockResolvedValueOnce({
      allowed: false,
      retryAfterSeconds: 60,
    });

    const { getByPlaceholderText, getByText, getAllByText, findByText } =
      render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText("Full Name"), "John Doe");
    fireEvent.changeText(getByPlaceholderText("Email"), "john@test.com");
    fireEvent.changeText(getByPlaceholderText("Phone Number"), "1234567890");
    fireEvent.changeText(getByPlaceholderText("Password"), "Password1!");
    fireEvent.changeText(
      getByPlaceholderText("Confirm Password"),
      "Password1!",
    );
    fireEvent.press(getByText("unchecked"));
    fireEvent.press(getAllByText("Create Account")[1]);

    expect(
      await findByText(
        "Too many registration attempts. Please try again in 60 seconds.",
      ),
    ).toBeTruthy();
    expect(register).not.toHaveBeenCalled();
  });

  test("shows the registration failure returned by the auth service", async () => {
    (register as jest.Mock).mockRejectedValueOnce(new Error("Email already in use"));

    const { getByPlaceholderText, getByText, getAllByText, findByText } = render(
      <RegisterScreen />,
    );

    fireEvent.changeText(getByPlaceholderText("Full Name"), "John Doe");
    fireEvent.changeText(getByPlaceholderText("Email"), "john@test.com");
    fireEvent.changeText(getByPlaceholderText("Phone Number"), "1234567890");
    fireEvent.changeText(getByPlaceholderText("Password"), "Password1!");
    fireEvent.changeText(
      getByPlaceholderText("Confirm Password"),
      "Password1!",
    );
    fireEvent.press(getByText("unchecked"));
    fireEvent.press(getAllByText("Create Account")[1]);

    expect(await findByText("Email already in use")).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
