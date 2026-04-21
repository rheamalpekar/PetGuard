import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Switch,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { detectEmergency } from "../../src/emergency/core/EmergencyAlertSystem";
import { EmergencyReportSeverityUI } from "@/types/DataModels";

type AnalysisResult = {
  isEmergency: boolean;
  severity: string;
  classification: string;
  scenarioId: string | null;
  checklist: string[];
  dispatchProtocol: string;
  countdownSeconds: number;
  detectionMs?: number;
  matchedKeywords?: string[];
};

const TARGET_FORM_PATH = "/formscreens/info-form";

export default function ReportEmergency() {
  const params = useLocalSearchParams();
  const prefillType = String(params.prefillType ?? "");

  const [type, setType] = useState<string>(prefillType);
  const [severity, setSeverity] = useState<EmergencyReportSeverityUI>("Medium");
  const [description, setDescription] = useState<string>("");

  const [enableDetection, setEnableDetection] = useState<boolean>(true);

  useEffect(() => {
    if (prefillType) {
      setType(prefillType);
    }
  }, [prefillType]);

  const previewAnalysis = useMemo(() => {
    const trimmedType = type.trim();
    const trimmedDesc = description.trim();

    if (!enableDetection || (!trimmedType && !trimmedDesc)) {
      return null;
    }

    try {
      return detectEmergency({
        emergencyType: trimmedType,
        description: trimmedDesc,
      }) as AnalysisResult;
    } catch {
      return null;
    }
  }, [type, description, enableDetection]);


  const submit = () => {
    const trimmedType = type.trim();
    const trimmedDesc = description.trim();

    if (!trimmedType || !trimmedDesc) {
      Alert.alert("Missing info", "Please fill Emergency Type and Description.");
      return;
    }

    let finalAnalysis: AnalysisResult | null = null;

    if (enableDetection) {
      try {
        finalAnalysis = detectEmergency({
          emergencyType: trimmedType,
          description: trimmedDesc,
        }) as AnalysisResult;
      } catch {
        Alert.alert("Error", "Unable to analyze this emergency right now.");
        return;
      }
    }

    router.push({
      pathname: TARGET_FORM_PATH as never,
      params: {
        emergencyType: trimmedType,
        description: trimmedDesc,
        severity: finalAnalysis?.severity ?? severity,
        classification: finalAnalysis?.classification ?? "",
        scenarioId: finalAnalysis?.scenarioId ?? "",
        dispatchProtocol: finalAnalysis?.dispatchProtocol ?? "",
        checklist: finalAnalysis?.checklist?.join(" | ") ?? "",
        countdownSeconds: String(finalAnalysis?.countdownSeconds ?? 0),
      },
    });
  };

  const detectedSeverity = previewAnalysis?.severity ?? "not detected";
  const detectedClassification = previewAnalysis?.classification ?? "unknown";
  const checklist = previewAnalysis?.checklist ?? [];

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

      <View style={styles.switchCard}>
        <Text style={styles.switchLabel}>Enable emergency detection</Text>
        <Switch value={enableDetection} onValueChange={setEnableDetection} />
      </View>

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

      {enableDetection && (
        <>
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Emergency Detection Preview</Text>
            <Text style={styles.previewText}>
              Detected Severity: {detectedSeverity}
            </Text>
            <Text style={styles.previewText}>
              Classification: {detectedClassification}
            </Text>
            {previewAnalysis?.detectionMs !== undefined && (
              <Text style={styles.previewSubText}>
                Detection Time: {previewAnalysis.detectionMs} ms
              </Text>
            )}
          </View>

          {checklist.length > 0 && (
            <View style={styles.checklistCard}>
              <Text style={styles.checklistTitle}>Critical Information Checklist</Text>
              {checklist.length > 0 ? (
                checklist.map((item, index) => (
                  <Text key={index} style={styles.checklistItem}>
                    • {item}
                  </Text>
                ))
              ) : (
                <Text style={styles.previewSubText}>No checklist available yet.</Text>
              )}
            </View>
          )}
        </>
      )}

      <Pressable style={styles.submitBtn} onPress={submit}>
        <Text style={styles.submitText}>Continue</Text>
      </Pressable>

      <Pressable onPress={() => router.back()} style={styles.cancelBtn}>
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
  label: EmergencyReportSeverityUI;
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
  container: { padding: 16, paddingBottom: 32 },

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

  pill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillSelected: { backgroundColor: "#ff2d2d", borderColor: "#ff2d2d" },
  pillUnselected: { backgroundColor: "#fff", borderColor: "#ddd" },
  pillText: { fontWeight: "800", fontSize: 14 },
  pillTextSelected: { color: "#fff" },
  pillTextUnselected: { color: "#111" },

  switchCard: {
    marginTop: 16,
    backgroundColor: "#f8faff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#d7e6ff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchLabel: {
    fontSize: 14,
    color: "#222",
    fontWeight: "700",
  },

  previewCard: {
    marginTop: 18,
    backgroundColor: "#f8f8f8",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e6e6e6",
  },
  previewTitle: { fontSize: 16, fontWeight: "800", color: "#111", marginBottom: 8 },
  previewText: { fontSize: 14, color: "#222", marginBottom: 4, fontWeight: "600" },
  previewSubText: { fontSize: 13, color: "#666", marginTop: 4 },

  checklistCard: {
    marginTop: 14,
    backgroundColor: "#fff8f8",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#ffd6d6",
  },
  checklistTitle: { fontSize: 16, fontWeight: "800", color: "#b00020", marginBottom: 8 },
  checklistItem: { fontSize: 14, color: "#222", marginBottom: 6 },

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