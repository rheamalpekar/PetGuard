import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useCallback } from "react";

const PROTECTED_ROUTES = ["/emergency", "/formscreens", "/index"];

export function useProtectedNavigation() {
  const router = useRouter();
  const { isLoggedIn, isGuest } = useAuth();

  const protectedNavigate = useCallback(
    (href: string | any) => {
      const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
        (typeof href === "string" ? href : href.pathname || "").includes(route),
      );

      if (isProtectedRoute && !isLoggedIn && !isGuest) {
        console.warn("Access denied - not logged in");
        router.replace("/auth/login" as never);
        return;
      }
      router.push(href);
    },
    [isLoggedIn, isGuest, router],
  );

  return { protectedNavigate };
}
