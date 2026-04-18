import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import LoginScreen from "../app/auth/login";
import { login } from "../src/backendServices/AuthService";

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
  }),
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children }: any) => children,
}));

jest.mock("expo-checkbox", () => "Checkbox");

jest.mock("../src/hooks/useProtectedNavigation", () => ({
  useProtectedNavigation: () => ({
    protectedNavigate: jest.fn(),
  }),
}));

jest.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({
    setIsGuest: jest.fn(),
  }),
}));

jest.mock("../src/backendServices/AuthService", () => ({
  login: jest.fn(() => Promise.resolve()),
}));

describe("LoginScreen", () => {
  test("renders inputs", () => {
    const { getByPlaceholderText } = render(<LoginScreen />);

    expect(getByPlaceholderText("Email")).toBeTruthy();
    expect(getByPlaceholderText("Password")).toBeTruthy();
  });

  test("successful login flow", async () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText("Email"), "test@gmail.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "Password1!");

    fireEvent.press(getByText("Sign In"));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith(
        "test@gmail.com",
        "Password1!",
        false
      );
    });
  });

  test("login failure shows alert", async () => {
    (login as jest.Mock).mockRejectedValueOnce({
      code: "auth/invalid-credential",
    });

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText("Email"), "test@gmail.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "Password1!");

    fireEvent.press(getByText("Sign In"));

    await waitFor(() => {
      expect(login).toHaveBeenCalled();
    });
  });

  test("guest button works", async () => {
    const { getByText } = render(<LoginScreen />);

    fireEvent.press(getByText("Continue as Guest"));

    await waitFor(() => {
      expect(getByText("Continue as Guest")).toBeTruthy();
    });
  });
});