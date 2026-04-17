import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Checkbox from "expo-checkbox";
import { useRouter } from "expo-router";
import { login } from "../../../backendServices/AuthService";
import { useProtectedNavigation } from "../../../hooks/useProtectedNavigation";
import { useAuth } from "../../../context/AuthContext";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function LoginScreen() {
  const router = useRouter();
  const { protectedNavigate } = useProtectedNavigation();
  const { setIsGuest } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState(null);

  const canSubmit = useMemo(() => {
    return isValidEmail(email) && password.length >= 0 && !submitting;
  }, [email, password, submitting]);

  function validate() {
    const next = {};
    if (!email.trim()) next.email = "Email is required.";
    else if (!isValidEmail(email)) next.email = "Invalid email format.";

    if (!password) next.password = "Password is required.";
    else if (password.length < 8)
      next.password = "Password must be at least 8 characters.";

    return next;
  }

  async function handleLogin() {
    setLoginError(null);

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);

    try {
      await login(email, password, rememberMe);
      router.replace("/emergency");
    } catch (err) {
      let message = "Login failed. Please try again.";

      if (err.code === "auth/invalid-credential") {
        message = "Invalid email or password.";
      } else if (err.code === "auth/user-not-found") {
        message = "Invalid email or password.";
      } else if (err.code === "auth/wrong-password") {
        message = "Invalid email or password.";
      } else if (err.code === "auth/too-many-requests") {
        message = "Too many failed attempts. Please try again later.";
      } else if (err.code === "auth/network-request-failed") {
        message = "Network error. Please check your connection.";
      }

      Alert.alert("Sign In Failed", message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <LinearGradient colors={["#0B1220", "#111C33"]} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Text style={styles.title}>Login</Text>

        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setLoginError(null);
          }}
          autoCapitalize="none"
        />
        {errors.email && <Text style={styles.error}>{errors.email}</Text>}

        <TextInput
          style={[styles.input, errors.password && styles.inputError]}
          placeholder="Password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setLoginError(null);
          }}
          secureTextEntry
        />
        {errors.password && <Text style={styles.error}>{errors.password}</Text>}

        {loginError && <Text style={styles.error}>{loginError}</Text>}

        <View style={styles.row}>
          <Checkbox value={rememberMe} onValueChange={setRememberMe} />
          <Text style={styles.checkboxText}>Remember Me</Text>
        </View>

        <Pressable
          onPress={handleLogin}
          disabled={!canSubmit}
          style={[styles.button, !canSubmit && { opacity: 0.5 }]}
        >
          <Text style={styles.buttonText}>
            {submitting ? "Signing in..." : "Sign In"}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.push("/auth/register")}>
          <Text style={styles.link}>Create Account</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setIsGuest(true);
            router.replace("/emergency");
          }}
          style={[styles.button, { backgroundColor: "#666" }]}
        >
          <Text style={styles.buttonText}>Continue as Guest</Text>
        </Pressable>

        <Pressable onPress={() => protectedNavigate("/formscreens/FirebaseTestScreen")} style={styles.navigation}>
          <Text style={styles.navigationText}>Go to Firebase test screen</Text>
        </Pressable>

        <Pressable onPress={() => protectedNavigate("/emergency")} style={styles.navigation}>
          <Text style={styles.navigationText}>Go to Emergency/Home screen</Text>
        </Pressable>

        <Pressable onPress={() => router.push("/screens/UserProfileScreen")} style={styles.navigation}>
          <Text style={styles.navigationText}>Go to Profile Screen</Text>
        </Pressable>

        <Pressable onPress={() => protectedNavigate("/formscreens/info-form")} style={styles.navigation}>
          <Text style={styles.navigationText}>Go to Info Form Screen</Text>
        </Pressable>

        <Pressable onPress={() => protectedNavigate("/formscreens/ConfirmationPage")} style={styles.navigation}>
          <Text style={styles.navigationText}>Go to Confirmation screen</Text>
        </Pressable>

      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 28, fontWeight: "bold", color: "#FFF", marginBottom: 20 },
  input: {
    backgroundColor: "#222",
    color: "#FFF",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  inputError: { borderColor: "red", borderWidth: 1 },
  error: { color: "red", marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  checkboxText: { color: "#FFF", marginLeft: 8 },
  button: {
    backgroundColor: "#4da6ff",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#000", fontWeight: "bold" },
  link: { color: "#4da6ff", marginTop: 16, textAlign: "center" },
  navigation: {
    backgroundColor: "#233244",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 12,
  },
  navigationText: {
    color: "#ffffff",
    fontSize: 14,
  },
});
