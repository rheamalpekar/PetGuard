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
import { detectEmergency } from "./core/EmergencyAlertSystem";

type SeverityUI = "Low" | "Medium" | "High";

export default function ReportEmergency() {
  const params = useLocalSearchParams();
  const prefillType = String(params.prefillType ?? "");

  const [type, setType] = useState<string>(prefillType);
  const [severity, setSeverity] = useState<SeverityUI>("Medium");
  const [description, setDescription] = useState<string>("");
  const [location, setLocation] = useState<string>("");

  // If user comes again with different tile selection while screen is mounted
  useEffect(() => {
    if (prefillType) setType(prefillType);
  }, [prefillType]);

  const submit = () => {
    const trimmedType = type.trim();
    const trimmedDesc = description.trim();
    const trimmedLoc = location.trim();

    if (!trimmedType || !trimmedDesc) {
      Alert.alert("Missing info", "Please fill Emergency Type and Description.");
      return;
    }

    const analysis = detectEmergency({
      emergencyType: trimmedType,
      description: trimmedDesc,
    });

    if (analysis.isEmergency) {
      router.push(
        {
          pathname: "/emergency-warning", // ✅ IMPORTANT: change to your warning route
          // If you are NOT creating a separate warning route,
          // change this back to: pathname: "/emergency"
          params: {
            analysis: JSON.stringify(analysis),
            emergencyType: trimmedType,
            description: trimmedDesc,
            severity,
            location: trimmedLoc,
          },
        } as never
      );
      return;
    }

    Alert.alert(
      "Submitted ✅",
      `Type: ${trimmedType}\nSeverity: ${severity}\nLocation: ${trimmedLoc || "N/A"}\n\nDescription:\n${trimmedDesc}`
    );

    router.back();
  };

  const confirmCancel = () => {
    Alert.alert("Cancel report?", "Your entered details will be lost.", [
      { text: "Keep editing", style: "cancel" },
      { text: "Cancel", style: "destructive", onPress: () => router.back() },
    ]);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>📝</Text>
        <Text style={styles.headerTitle}>Report Emergency</Text>
      </View>

      <Text style={styles.label}>
        Emergency Type <Text style={styles.required}>*</Text>
      </Text>
      <TextInput
        value={type}
        onChangeText={setType}
        placeholder="Injury / Road accident / Stray attack..."
        placeholderTextColor="#999"
        style={styles.input}
      />

      <Text style={[styles.label, { marginTop: 16 }]}>Severity</Text>
      <View style={styles.severityRow}>
        <SeverityPill label="Low" selected={severity === "Low"} onPress={() => setSeverity("Low")} />
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

      <Text style={[styles.label, { marginTop: 16 }]}>
        Location <Text style={styles.optional}>(optional)</Text>
      </Text>
      <TextInput
        value={location}
        onChangeText={setLocation}
        placeholder="Auto GPS later / enter address for now"
        placeholderTextColor="#999"
        style={styles.input}
      />

      <Text style={[styles.label, { marginTop: 16 }]}>
        Description <Text style={styles.required}>*</Text>
      </Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Describe what happened..."
        placeholderTextColor="#999"
        style={[styles.input, styles.textarea]}
        multiline
        textAlignVertical="top"
      />

      <Pressable style={styles.submitBtn} onPress={submit}>
        <Text style={styles.submitText}>Submit Report</Text>
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
      <Text style={[styles.pillText, selected ? styles.pillTextSelected : styles.pillTextUnselected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 16, paddingBottom: 28 },

  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  headerIcon: { fontSize: 22 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#111" },

  label: { fontSize: 14, fontWeight: "700", color: "#222", marginBottom: 8 },
  required: { color: "#c00" },
  optional: { color: "#666", fontWeight: "600" },

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
  textarea: { minHeight: 120, paddingTop: 12 },

  severityRow: { flexDirection: "row", gap: 10, marginTop: 2 },

  pill: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1 },
  pillSelected: { backgroundColor: "#ff2d2d", borderColor: "#ff2d2d" },
  pillUnselected: { backgroundColor: "#fff", borderColor: "#ddd" },
  pillText: { fontWeight: "800", fontSize: 14 },
  pillTextSelected: { color: "#fff" },
  pillTextUnselected: { color: "#111" },

  submitBtn: {
    marginTop: 18,
    backgroundColor: "#ff2d2d",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "900", fontSize: 16 },

  cancelBtn: { marginTop: 14, alignItems: "center", paddingVertical: 10 },
  cancelText: { color: "#111", fontWeight: "700" },
});