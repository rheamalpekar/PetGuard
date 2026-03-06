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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return isValidEmail(email) && password.length >= 8 && !submitting;
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
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);

    try {
      // TODO: AuthService.login(...)
      await new Promise((r) => setTimeout(r, 600));
      Alert.alert("Login successful (stub)");
    } catch (err) {
      Alert.alert("Login failed");
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
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        {errors.email && <Text style={styles.error}>{errors.email}</Text>}

        <TextInput
          style={[styles.input, errors.password && styles.inputError]}
          placeholder="Password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {errors.password && <Text style={styles.error}>{errors.password}</Text>}

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

        <Pressable onPress={()=> router.push("/auth/register")}>
          <Text style={styles.link}>Create Account</Text>
        </Pressable>


        <Pressable onPress={()=> router.push("/(tabs)/info-form")}>
          <Text style={styles.link}>Go to Info Form</Text>
        </Pressable>

        <Pressable onPress={()=> router.push("/(tabs)/ConfirmationPage")}>
          <Text style={styles.link}>Go to Confirmation screen</Text>
        </Pressable>

        <Pressable onPress={()=> router.push("/emergency")}>
          <Text style={styles.link}>Go to Emergency screen</Text>
        </Pressable>

        <Pressable onPress={()=> router.push("/(tabs)/FirebaseTestScreen")}>
          <Text style={styles.link}>Go to Firebase test screen</Text>
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
});
