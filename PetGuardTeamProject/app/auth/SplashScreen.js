import React, { useEffect, useRef } from "react";
import {
  Animated,
  ActivityIndicator,
  StyleSheet,
  View,
  Image,
  Text,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";

const REDIRECT_MS = 3000;

// Timing (tuned for "premium" feel)
const LOGO_IN_MS = 900;
const TEXT_IN_MS = 650;
const SPINNER_IN_MS = 550;
const FADE_OUT_MS = 320;
const EXIT_BUFFER_MS = 180;

export default function SplashScreen() {
  const router = useRouter();
  const { isLoggedIn, loading } = useAuth();

  // Logo entrance
  const logoScale = useRef(new Animated.Value(0.78)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(16)).current;

  // Title/subtitle entrance
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(10)).current;

  // Spinner entrance
  const spinnerOpacity = useRef(new Animated.Value(0)).current;

  // Whole-screen exit
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1) Logo fades in + rises + scales with a subtle spring
    const logoIn = Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: LOGO_IN_MS,
        useNativeDriver: true,
      }),
      Animated.timing(logoTranslateY, {
        toValue: 0,
        duration: LOGO_IN_MS,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 7,
        tension: 90,
        useNativeDriver: true,
      }),
    ]);

    // 2) Title/subtitle fade + rise (staggered)
    const titleIn = Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: TEXT_IN_MS,
        useNativeDriver: true,
      }),
      Animated.timing(titleTranslateY, {
        toValue: 0,
        duration: TEXT_IN_MS,
        useNativeDriver: true,
      }),
    ]);

    // 3) Spinner fades in last
    const spinnerIn = Animated.timing(spinnerOpacity, {
      toValue: 1,
      duration: SPINNER_IN_MS,
      useNativeDriver: true,
    });

    // Run entrance sequence
    Animated.sequence([
      logoIn,
      Animated.delay(120),
      titleIn,
      Animated.delay(180),
      spinnerIn,
    ]).start();

    // Exit animation slightly before redirect
    const exitAt = Math.max(0, REDIRECT_MS - (FADE_OUT_MS + EXIT_BUFFER_MS));
    const exitTimer = setTimeout(() => {
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: FADE_OUT_MS,
        useNativeDriver: true,
      }).start();
    }, exitAt);

    // Redirect right after fade out completes
    const navTimer = setTimeout(() => {
      if (loading) {
        return;
      }
      
      const destination = isLoggedIn ? "/emergency" : "/auth/LoginScreen";
      console.log(`Redirecting to ${destination}`);
      router.replace(destination);
    }, REDIRECT_MS);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(navTimer);
    };
  }, [
    logoOpacity,
    logoScale,
    logoTranslateY,
    titleOpacity,
    titleTranslateY,
    spinnerOpacity,
    screenOpacity,
    router,
    isLoggedIn,
    loading,
  ]);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <LinearGradient colors={["#0F172A", "#162642", "#0B1220"]} style={styles.gradient}>
        <View style={styles.inner}>
          {/* Subtle background glow behind logo */}
          <View style={styles.glow} />

          {/* Logo */}
          <Animated.View
            style={[
              styles.logoWrap,
              {
                opacity: logoOpacity,
                transform: [{ translateY: logoTranslateY }, { scale: logoScale }],
              },
            ]}
            accessibilityRole="image"
            accessibilityLabel="PetGuard logo"
          >
            <Image
              source={require("../../assets/images/petguard-logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Title + tagline */}
          <Animated.View
            style={{
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
              alignItems: "center",
            }}
          >
            <Text style={styles.title}>PetGuard</Text>
            <Text style={styles.tagline}>Protect. Report. Respond.</Text>
          </Animated.View>

          {/* Spinner */}
          <Animated.View style={[styles.spinnerRow, { opacity: spinnerOpacity }]}>
            <ActivityIndicator />
          </Animated.View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  inner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  // Soft radial glow effect (simple + cheap)
  glow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(140,200,255,0.10)",
    transform: [{ translateY: -30 }],
  },

  logoWrap: {
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  logoImage: {
    width: 160,
    height: 160,
  },

  title: {
    marginTop: 6,
    fontSize: 28,
    color: "#FFFFFF",
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  tagline: {
    marginTop: 6,
    fontSize: 13,
    color: "rgba(255,255,255,0.72)",
    letterSpacing: 0.4,
  },

  spinnerRow: { marginTop: 18 },
});
