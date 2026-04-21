import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Checkbox from "expo-checkbox";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { register } from "../../src/backendServices/AuthService";
import {
  consumeRateLimit,
  RATE_LIMIT_BUCKETS,
  RATE_LIMIT_WINDOW_MS,
} from "../../src/backendServices/RateLimiter";


function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 || digits.length === 11;
}

function hasUppercase(password) {
  return /[A-Z]/.test(password);
}

function hasNumber(password) {
  return /[0-9]/.test(password);
}

function hasSpecialChar(password) {
  return /[^A-Za-z0-9]/.test(password);
}

function hasValidLength(password) {
  return password.length >= 8 && password.length <= 16;
}

function isStrongPassword(password) {
  return (
    hasUppercase(password) &&
    hasNumber(password) &&
    hasSpecialChar(password) &&
    hasValidLength(password)
  );
}


export default function RegisterScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    fullName.trim().length > 1 &&
    isValidEmail(email) &&
    isValidPhone(phone) &&
    isStrongPassword(password) &&
    password === confirmPassword &&
    acceptTerms &&
    !submitting;

  const passwordRules = {
    length: hasValidLength(password),
    uppercase: hasUppercase(password),
    number: hasNumber(password),
    special: hasSpecialChar(password),
  };

  function validate() {
    const next = {};

    if (!fullName.trim()) next.fullName = "Full name is required.";

    if (!email.trim()) next.email = "Email is required.";
    else if (!isValidEmail(email)) next.email = "Invalid email format.";

    if (!phone.trim()) next.phone = "Phone number is required.";
    else if (!isValidPhone(phone)) next.phone = "Invalid phone number.";

    if (!password) {
      next.password = "Password is required.";
    } else if (!isStrongPassword(password)) {
      next.password =
        "Password must be 8–16 characters and include a capital letter, number, and special character.";
    }

    if (!confirmPassword)
      next.confirmPassword = "Please confirm your password.";
    else if (confirmPassword !== password)
      next.confirmPassword = "Passwords do not match.";

    if (!acceptTerms)
      next.terms = "You must accept the Terms & Conditions.";

    return next;
  }

  async function handleRegister() {
    setFormError(null);
    setSuccessMessage(null);

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    const rateLimit = await consumeRateLimit({
      key: RATE_LIMIT_BUCKETS.register,
      maxAttempts: 3,
      windowMs: RATE_LIMIT_WINDOW_MS,
    });

    if (!rateLimit.allowed) {
      setFormError(
        `Too many registration attempts. Please try again in ${rateLimit.retryAfterSeconds} seconds.`,
      );
      return;
    }

    setSubmitting(true);

    try {
      // Call the register function from APIService
      await register(email, password, fullName, phone);

      setSuccessMessage("Account created successfully.");
      Alert.alert("Success", "Account created successfully.");
      router.replace("/auth/LoginScreen");
    } catch (err) {
      setFormError(err.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <LinearGradient colors={["#0B1220", "#111C33"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboard}
        >
          <ScrollView
            contentContainerStyle={styles.inner}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>Create Account</Text>

            {/* Full Name */}
            <TextInput
              style={[styles.input, errors.fullName && styles.inputError]}
              placeholder="Full Name"
              placeholderTextColor="#888"
              value={fullName}
              onChangeText={setFullName}
              accessibilityLabel="Full name input"
            />
            {errors.fullName && (
              <Text style={styles.errorText}>{errors.fullName}</Text>
            )}

            {/* Email */}
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="Email"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              accessibilityLabel="Email input"
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}

            {/* Phone */}
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              placeholder="Phone Number"
              placeholderTextColor="#888"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              accessibilityLabel="Phone number input"
            />
            {errors.phone && (
              <Text style={styles.errorText}>{errors.phone}</Text>
            )}

            {/* Password */}
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="Password"
                placeholderTextColor="#888"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                accessibilityLabel="Password input"
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}

            {/* Password Rules */}
            <View style={styles.passwordRules}>
              <Text
                style={[
                  styles.ruleText,
                  passwordRules.length ? styles.ruleMet : styles.ruleUnmet,
                ]}
              >
                {passwordRules.length ? "✓" : "○"} 8–16 characters
              </Text>
              <Text
                style={[
                  styles.ruleText,
                  passwordRules.uppercase ? styles.ruleMet : styles.ruleUnmet,
                ]}
              >
                {passwordRules.uppercase ? "✓" : "○"} At least 1 uppercase letter
              </Text>
              <Text
                style={[
                  styles.ruleText,
                  passwordRules.number ? styles.ruleMet : styles.ruleUnmet,
                ]}
              >
                {passwordRules.number ? "✓" : "○"} At least 1 number
              </Text>
              <Text
                style={[
                  styles.ruleText,
                  passwordRules.special ? styles.ruleMet : styles.ruleUnmet,
                ]}
              >
                {passwordRules.special ? "✓" : "○"} At least 1 special character
              </Text>
            </View>

            {/* Confirm Password */}
              <TextInput
                style={[
                  styles.input,
                  errors.confirmPassword && styles.inputError,
                ]}
                placeholder="Confirm Password"
                placeholderTextColor="#888"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                accessibilityLabel="Confirm password input"
              />
              {errors.confirmPassword && (
                <Text style={styles.errorText}>
                  {errors.confirmPassword}
                </Text>
              )}

            {/* Terms */}
            <View style={styles.checkboxRow}>
              <Checkbox
                value={acceptTerms}
                onValueChange={setAcceptTerms}
              />
              <Text style={styles.checkboxText}>
                I accept the Terms & Conditions
              </Text>
            </View>
            {errors.terms && (
              <Text style={styles.errorText}>{errors.terms}</Text>
            )}

            {formError && (
              <Text style={styles.errorText}>{formError}</Text>
            )}
            {successMessage && (
              <Text style={styles.successText}>{successMessage}</Text>
            )}

            <Pressable
              onPress={handleRegister}
              disabled={!canSubmit}
              style={[
                styles.button,
                !canSubmit && { opacity: 0.5 },
              ]}
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>
                {submitting ? "Creating..." : "Create Account"}
              </Text>
            </Pressable>

            <Pressable onPress={() => router.replace("/auth/LoginScreen")}>
              <Text style={styles.link}>
                Already have an account? Sign In
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  inner: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#222",
    color: "#FFF",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  inputError: {
    borderWidth: 1,
    borderColor: "red",
  },
  errorText: {
    color: "red",
    marginBottom: 8,
  },
  successText: {
    color: "lightgreen",
    marginBottom: 8,
  },
  passwordRules: {
    marginBottom: 12,
  },
  ruleText: {
    fontSize: 13,
    marginBottom: 4,
  },
  ruleMet: {
    color: "lightgreen",
  },
  ruleUnmet: {
    color: "#bbb",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  checkboxText: {
    color: "#FFF",
    marginLeft: 8,
    flex: 1,
  },
  button: {
    backgroundColor: "#4da6ff",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: {
    color: "#000",
    fontWeight: "bold",
  },
  link: {
    color: "#4da6ff",
    marginTop: 16,
    textAlign: "center",
  },
});
