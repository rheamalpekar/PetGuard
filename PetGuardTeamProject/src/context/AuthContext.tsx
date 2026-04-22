import React, { createContext, useContext, useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../backendServices/firebase";
import { signInAsGuest } from "../backendServices/AuthService";
import {
  loadQueuedInfoForms,
  syncQueuedInfoForms,
} from "../backendServices/ApiService";
import type { AuthContextValue } from "@/types/DataModels";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [justSynced, setJustSynced] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [hadPendingQueue, setHadPendingQueue] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth restore:", !!currentUser);

      if (!isMounted) return;

      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        await syncQueuedInfoForms();
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const netUnsub = NetInfo.addEventListener(async (state) => {
      const online = Boolean(
        state.isConnected && state.isInternetReachable !== false,
      );

      setIsOnline(online);

      if (online) {
        const queueBefore = await loadQueuedInfoForms();

        if (queueBefore.length > 0) {
          setJustSynced(false);
          setHadPendingQueue(true);

          await syncQueuedInfoForms();

          const queueAfter = await loadQueuedInfoForms();

          if (queueAfter.length === 0) {
            setJustSynced(true);
            setHadPendingQueue(false);
          }
        }
      }
    });

    return netUnsub;
  }, []);

  const continueAsGuest = async () => {
    setLoading(true);

    try {
      const guestUser = await signInAsGuest();
      setUser(guestUser);
      await syncQueuedInfoForms();
      return guestUser;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextValue = {
    user,
    loading,
    isLoggedIn: !!user,
    justSynced,
    isOnline,
    hadPendingQueue,
    isGuest: user?.isAnonymous ?? false,
    continueAsGuest,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
