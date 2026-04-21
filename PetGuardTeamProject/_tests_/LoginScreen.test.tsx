import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import LoginScreen from "../app/auth/login";
import { login } from "../src/backendServices/AuthService";

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockProtectedNavigate = jest.fn();
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

jest.mock("expo-checkbox", () => "Checkbox");

jest.mock("../src/hooks/useProtectedNavigation", () => ({
  useProtectedNavigation: () => ({
    protectedNavigate: mockProtectedNavigate,
  }),
}));

jest.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({
    user: { uid: "anon-1", isAnonymous: true },
    isGuest: true,
    continueAsGuest: mockContinueAsGuest,
  }),
}));

jest.mock("../src/backendServices/AuthService", () => ({
  login: jest.fn(() => Promise.resolve()),
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

describe("LoginScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(jest.fn());
    (login as jest.Mock).mockResolvedValue({ uid: "user-1" });
    mockContinueAsGuest.mockResolvedValue({
      uid: "guest-1",
      isAnonymous: true,
    });
    mockConsumeRateLimit.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
  });

  test("renders inputs", () => {
    const { getByPlaceholderText } = render(<LoginScreen />);
    expect(getByPlaceholderText("Email")).toBeTruthy();
    expect(getByPlaceholderText("Password")).toBeTruthy();
  });

  test("valid input calls Firebase login and navigates", async () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText("Email"), "test@gmail.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "Password1!");

    fireEvent.press(getByText("Sign In"));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith("test@gmail.com", "Password1!", false);
      expect(mockReplace).toHaveBeenCalledWith("/emergency");
    });
  });

  test("invalid email disables submit and blocks Firebase login", () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText("Email"), "not-an-email");
    fireEvent.changeText(getByPlaceholderText("Password"), "Password1!");
    fireEvent.press(getByText("Sign In"));

    expect(login).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("empty password disables submit and blocks Firebase login", () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText("Email"), "test@gmail.com");
    fireEvent.press(getByText("Sign In"));

    expect(login).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("failed login shows the expected error alert", async () => {
    (login as jest.Mock).mockRejectedValueOnce({
      code: "auth/invalid-credential",
    });

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText("Email"), "test@gmail.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "Password1!");

    fireEvent.press(getByText("Sign In"));

    await waitFor(() => {
      expect(login).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        "Sign In Failed",
        "Invalid email or password.",
      );
    });
  });

  test("rate limited login shows inline error and blocks Firebase login", async () => {
    mockConsumeRateLimit.mockResolvedValueOnce({
      allowed: false,
      retryAfterSeconds: 60,
    });

    const { getByPlaceholderText, getByText, findByText } = render(
      <LoginScreen />,
    );

    fireEvent.changeText(getByPlaceholderText("Email"), "test@gmail.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "Password1!");

    fireEvent.press(getByText("Sign In"));

    expect(
      await findByText("Too many login attempts. Please try again in 60 seconds."),
    ).toBeTruthy();
    expect(login).not.toHaveBeenCalled();
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  test("guest button navigates with anonymous Firebase session", async () => {
    const { getByText } = render(<LoginScreen />);

    fireEvent.press(getByText("Continue as Guest"));

    await waitFor(() => {
      expect(mockContinueAsGuest).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith("/emergency");
    });
  });

  test("guest button shows Firebase setup error when anonymous auth is disabled", async () => {
    mockContinueAsGuest.mockRejectedValueOnce({
      code: "auth/admin-restricted-operation",
    });

    const { getByText, findByText } = render(<LoginScreen />);

    fireEvent.press(getByText("Continue as Guest"));

    expect(
      await findByText(
        "Guest access is not enabled in Firebase. Enable Anonymous sign-in in Firebase Authentication, then try again.",
      ),
    ).toBeTruthy();
    expect(Alert.alert).toHaveBeenCalledWith(
      "Guest Sign In Failed",
      "Guest access is not enabled in Firebase. Enable Anonymous sign-in in Firebase Authentication, then try again.",
    );
    expect(mockReplace).not.toHaveBeenCalledWith("/emergency");
  });
});
