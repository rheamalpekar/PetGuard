import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

type SeverityUI = "Low" | "Medium" | "High";

export default function NonEmergencyReport() {
  const params = useLocalSearchParams();
  const prefillType = String(params.prefillType ?? "");

  const [type, setType] = useState<string>(prefillType);
  const [severity, setSeverity] = useState<SeverityUI>("Medium");

  useEffect(() => {
    if (prefillType) setType(prefillType);
  }, [prefillType]);

  const handleContinue = () => {
    const trimmedType = type.trim();

    if (!trimmedType) {
      Alert.alert("Missing info", "Please fill in the Service Type.");
      return;
    }

    router.push({
      pathname: "/formscreens/info-form",
      params: {
        serviceType: trimmedType,
        severity,
      },
    } as never);
  };

  const confirmCancel = () => {
    Alert.alert("Cancel request?", "Your entered details will be lost.", [
      { text: "Keep editing", style: "cancel" },
      { text: "Cancel", style: "destructive", onPress: () => router.back() },
    ]);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🐾</Text>
        <Text style={styles.headerTitle}>Request Non-Emergency Service</Text>
      </View>

      <Text style={styles.helper}>
        Tell us what service you need. You&apos;ll provide location, contact,
        and additional details on the next screen.
      </Text>

      <Text style={styles.label}>
        Service Type <Text style={styles.required}>*</Text>
      </Text>
      <TextInput
        value={type}
        onChangeText={setType}
        placeholder="Vaccination / Adopt / Spay / Neuter..."
        placeholderTextColor="#999"
        style={styles.input}
      />

      <Text style={[styles.label, { marginTop: 16 }]}>Priority</Text>
      <View style={styles.severityRow}>
        <SeverityPill
          label="Low"
          selected={severity === "Low"}
          onPress={() => setSeverity("Low")}
        />
        <SeverityPill
          label="Medium"
          selected={severity === "Medium"}
          onPress={() => setSeverity("Medium")}
        />
        <SeverityPill
          label="High"
          selected={severity === "High"}
          onPress={() => setSeverity("High")}
        />
      </View>

      <Pressable style={styles.submitBtn} onPress={handleContinue}>
        <Text style={styles.submitText}>Continue</Text>
      </Pressable>

      <Pressable onPress={confirmCancel} style={styles.cancelBtn}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </ScrollView>
  );
}

function SeverityPill({
  label,
  selected,
  onPress,
}: {
  label: SeverityUI;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, selected ? styles.pillSelected : styles.pillUnselected]}
    >
      <Text
        style={[
          styles.pillText,
          selected ? styles.pillTextSelected : styles.pillTextUnselected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 16, paddingBottom: 28 },

  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  headerIcon: { fontSize: 22 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#111" },

  helper: { fontSize: 14, color: "#555", marginBottom: 18, lineHeight: 20 },

  label: { fontSize: 14, fontWeight: "700", color: "#222", marginBottom: 8 },
  required: { color: "#c00" },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111",
    backgroundColor: "#fff",
  },

  severityRow: { flexDirection: "row", gap: 10, marginTop: 2 },

  pill: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1 },
  pillSelected: { backgroundColor: "#1f5ea8", borderColor: "#1f5ea8" },
  pillUnselected: { backgroundColor: "#fff", borderColor: "#ddd" },
  pillText: { fontWeight: "800", fontSize: 14 },
  pillTextSelected: { color: "#fff" },
  pillTextUnselected: { color: "#111" },

  submitBtn: {
    marginTop: 18,
    backgroundColor: "#1f5ea8",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "900", fontSize: 16 },

  cancelBtn: { marginTop: 14, alignItems: "center", paddingVertical: 10 },
  cancelText: { color: "#111", fontWeight: "700" },
});
