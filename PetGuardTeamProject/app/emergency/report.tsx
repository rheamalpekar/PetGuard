import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Vibration,
  AccessibilityInfo,
  Switch,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import NetInfo from "@react-native-community/netinfo";
import { useAudioPlayer } from "expo-audio";
import { detectEmergency } from "./core/EmergencyAlertSystem";
import { queueEmergency } from "../../utils/offlineQueue";
// import { submitEmergencyReport } from "@/services/ApiResponse";
import { addEmergencyReport } from "@/backendServices/ApiService";

type SeverityUI = "Low" | "Medium" | "High";

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

export default function ReportEmergency() {
  const params = useLocalSearchParams();
  const prefillType = String(params.prefillType ?? "");

  const [type, setType] = useState<string>(prefillType);
  const [severity, setSeverity] = useState<SeverityUI>("Medium");
  const [description, setDescription] = useState<string>("");
  const [location, setLocation] = useState<string>("");

  const [gpsLocation, setGpsLocation] = useState<string>("");
  const [fetchingLocation, setFetchingLocation] = useState<boolean>(false);

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [showChecklist, setShowChecklist] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [dispatchNotified, setDispatchNotified] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [enableVibration, setEnableVibration] = useState<boolean>(true);
  const [enableSoundAlert, setEnableSoundAlert] = useState<boolean>(true);
  const [autoNotifyDispatch, setAutoNotifyDispatch] = useState<boolean>(true);

  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const emergencyPlayer = useAudioPlayer(require("../../assets/emergency.mp3"));

  useEffect(() => {
    if (prefillType) setType(prefillType);
  }, [prefillType]);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const getCurrentLocation = async () => {
    try {
      setFetchingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location access is required.");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lat = loc.coords.latitude.toFixed(6);
      const lon = loc.coords.longitude.toFixed(6);

      setGpsLocation(`Latitude: ${lat}, Longitude: ${lon}`);
    } catch (error) {
      console.error("Error fetching location:", error);
      Alert.alert("Location Error", "Unable to fetch location right now.");
    } finally {
      setFetchingLocation(false);
    }
  };

  const previewAnalysis = useMemo(() => {
    const trimmedType = type.trim();
    const trimmedDesc = description.trim();

    if (!trimmedType || !trimmedDesc) return null;

    try {
      return detectEmergency({
        emergencyType: trimmedType,
        description: trimmedDesc,
      }) as AnalysisResult;
    } catch {
      return null;
    }
  }, [type, description]);

  const playEmergencySound = () => {
    try {
      emergencyPlayer.seekTo(0);
      emergencyPlayer.play();
    } catch (error) {
      console.log("Error playing emergency sound:", error);
    }
  };

  const runEmergencyFeedback = (result: AnalysisResult) => {
    AccessibilityInfo.announceForAccessibility?.(
      `Emergency detected. Severity ${result.severity}. Classification ${result.classification}.`
    );

    if (enableVibration) {
      if (result.severity === "critical") {
        Vibration.vibrate([0, 600, 200, 600, 200, 900]);
      } else if (result.severity === "high") {
        Vibration.vibrate([0, 400, 150, 400]);
      } else if (result.severity === "medium") {
        Vibration.vibrate([0, 250, 150, 250]);
      } else {
        Vibration.vibrate(150);
      }
    }

    if (enableSoundAlert) {
      playEmergencySound();
    }
  };

  const simulateDispatchNotification = (
    result: AnalysisResult,
    formData: {
      type: string;
      severity: SeverityUI;
      description: string;
      location: string;
      gpsLocation: string;
    }
  ) => {
    const payload = {
      timestamp: new Date().toISOString(),
      emergencyType: formData.type,
      selectedSeverity: formData.severity,
      detectedSeverity: result.severity,
      classification: result.classification,
      dispatchProtocol: result.dispatchProtocol,
      location: formData.location || "N/A",
      gpsLocation: formData.gpsLocation || "N/A",
      description: formData.description,
      scenarioId: result.scenarioId,
      checklist: result.checklist,
      detectionMs: result.detectionMs,
      source: Platform.OS,
    };

    console.log("🚨 Admin/Dispatch Notification Sent:", payload);
    setDispatchNotified(true);
  };

  const startCountdown = (seconds: number, onDone: () => void) => {
    if (countdownRef.current) clearInterval(countdownRef.current);

    setCountdown(seconds);

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          onDone();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const submit = async () => {
    const trimmedType = type.trim();
    const trimmedDesc = description.trim();
    const trimmedLoc = location.trim();

    if (!trimmedType || !trimmedDesc) {
      Alert.alert("Missing info", "Please fill Emergency Type and Description.");
      return;
    }

    setSubmitting(true);

    let result: AnalysisResult;
    try {
      result = detectEmergency({
        emergencyType: trimmedType,
        description: trimmedDesc,
      }) as AnalysisResult;
    } catch {
      setSubmitting(false);
      Alert.alert("Error", "Unable to analyze this emergency right now.");
      return;
    }

    setAnalysis(result);
    setShowChecklist(true);

    const networkState = await NetInfo.fetch();

    if (!networkState.isConnected) {
      await queueEmergency({
        id: Date.now().toString(),
        emergencyType: trimmedType,
        severity,
        description: trimmedDesc,
        location: trimmedLoc,
        gpsLocation,
        createdAt: new Date().toISOString(),
      });

      setSubmitting(false);

      if (result.isEmergency) {
        runEmergencyFeedback(result);
      }

      Alert.alert(
        "Offline Mode",
        "Emergency saved locally. It will sync when internet returns."
      );

      router.push(
        {
          pathname: "/emergency/warning",
          params: {
            analysis: JSON.stringify(result),
            emergencyType: trimmedType,
            description: trimmedDesc,
            severity,
            location: trimmedLoc,
            gpsLocation,
            dispatchNotified: "false",
          },
        } as never
      );

      return;
    }

    if (result.isEmergency) {
      runEmergencyFeedback(result);
    }

    if (!result.isEmergency) {
      setSubmitting(false);
      Alert.alert(
        "Submitted ✅",
        `Type: ${trimmedType}\nSeverity: ${severity}\nLocation: ${trimmedLoc || "N/A"}\nGPS: ${
          gpsLocation || "N/A"
        }\n\nDescription:\n${trimmedDesc}`
      );
      return;
    }

    const doDispatch = () => {
      if (autoNotifyDispatch) {
        simulateDispatchNotification(result, {
          type: trimmedType,
          severity,
          description: trimmedDesc,
          location: trimmedLoc,
          gpsLocation,
        });
      }

      setSubmitting(false);

      router.push(
        {
          pathname: "/emergency/warning",
          params: {
            analysis: JSON.stringify(result),
            emergencyType: trimmedType,
            description: trimmedDesc,
            severity,
            location: trimmedLoc,
            gpsLocation,
            dispatchNotified: autoNotifyDispatch ? "true" : "false",
          },
        } as never
      );
    };

    if ((result.countdownSeconds ?? 0) > 0) {
      startCountdown(result.countdownSeconds, doDispatch);

      setTimeout(() => {
        Alert.alert(
          "Emergency Detected 🚨",
          `Classification: ${result.classification}\nSeverity: ${result.severity}\n\nDispatch countdown started.`,
          [
            {
              text: "Send Now",
              onPress: () => {
                if (countdownRef.current) clearInterval(countdownRef.current);
                setCountdown(0);
                doDispatch();
              },
            },
            {
              text: "Review Checklist",
              style: "cancel",
              onPress: () => setSubmitting(false),
            },
          ]
        );
      }, 250);
    } else {
      doDispatch();
    }
  };

  const confirmCancel = () => {
    Alert.alert("Cancel report?", "Your entered details will be lost.", [
      { text: "Keep editing", style: "cancel" },
      {
        text: "Cancel",
        style: "destructive",
        onPress: () => {
          if (countdownRef.current) clearInterval(countdownRef.current);
          router.back();
        },
      },
    ]);
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
        <SeverityPill label="Low" selected={severity === "Low"} onPress={() => setSeverity("Low")} />
        <SeverityPill label="Medium" selected={severity === "Medium"} onPress={() => setSeverity("Medium")} />
        <SeverityPill label="High" selected={severity === "High"} onPress={() => setSeverity("High")} />
      </View>

      <Text style={[styles.label, { marginTop: 16 }]}>
        Location <Text style={styles.optional}>(optional manual input)</Text>
      </Text>
      <TextInput
        value={location}
        onChangeText={setLocation}
        placeholder="Enter address / landmark"
        placeholderTextColor="#999"
        style={styles.input}
      />

      <Text style={[styles.label, { marginTop: 16 }]}>GPS Location</Text>
      <Pressable style={styles.locationBtn} onPress={getCurrentLocation}>
        <Text style={styles.locationBtnText}>
          {fetchingLocation ? "Fetching Location..." : "Use Current GPS Location"}
        </Text>
      </Pressable>

      <TextInput
        style={[styles.input, styles.locationInput]}
        value={gpsLocation}
        editable={false}
        placeholder="GPS coordinates will appear here"
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

      <View style={styles.previewCard}>
        <Text style={styles.previewTitle}>Emergency Detection Preview</Text>
        <Text style={styles.previewText}>Detected Severity: {detectedSeverity}</Text>
        <Text style={styles.previewText}>Classification: {detectedClassification}</Text>
        {previewAnalysis?.detectionMs !== undefined && (
          <Text style={styles.previewSubText}>Detection Time: {previewAnalysis.detectionMs} ms</Text>
        )}
      </View>

      {(showChecklist || checklist.length > 0) && (
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

      {countdown !== null && (
        <View style={styles.timerCard}>
          <Text style={styles.timerTitle}>Emergency Timer / Countdown</Text>
          <Text style={styles.timerValue}>{countdown}s</Text>
          <Text style={styles.previewSubText}>
            Dispatch will trigger automatically when timer reaches zero.
          </Text>
        </View>
      )}

      {dispatchNotified && (
        <View style={styles.dispatchCard}>
          <Text style={styles.dispatchTitle}>Admin / Dispatch Notification</Text>
          <Text style={styles.dispatchText}>Dispatch has been notified successfully 🚨</Text>
        </View>
      )}

      <View style={styles.optionsCard}>
        <Text style={styles.optionsTitle}>Alert Customization Options</Text>

        <OptionRow
          label="Enable vibration patterns"
          value={enableVibration}
          onValueChange={setEnableVibration}
        />

        <OptionRow
          label="Enable sound alert"
          value={enableSoundAlert}
          onValueChange={setEnableSoundAlert}
        />

        <OptionRow
          label="Auto notify admin / dispatch"
          value={autoNotifyDispatch}
          onValueChange={setAutoNotifyDispatch}
        />
      </View>

      <Pressable
        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
        onPress={submit}
        disabled={submitting}
      >
        <Text style={styles.submitText}>
          {submitting ? "Processing Emergency..." : "Submit Report"}
        </Text>
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

function OptionRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.optionRow}>
      <Text style={styles.optionLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
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
  locationInput: { color: "#444" },
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

  locationBtn: {
    backgroundColor: "#1f5ea8",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  locationBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
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

  timerCard: {
    marginTop: 14,
    backgroundColor: "#fff4ea",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#ffd2a6",
    alignItems: "center",
  },
  timerTitle: { fontSize: 16, fontWeight: "800", color: "#a14b00", marginBottom: 6 },
  timerValue: { fontSize: 30, fontWeight: "900", color: "#ff2d2d" },

  dispatchCard: {
    marginTop: 14,
    backgroundColor: "#eefbf0",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#c8efcf",
  },
  dispatchTitle: { fontSize: 16, fontWeight: "800", color: "#1f6f2a", marginBottom: 6 },
  dispatchText: { fontSize: 14, color: "#184f20", fontWeight: "600" },

  optionsCard: {
    marginTop: 14,
    backgroundColor: "#f8faff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#d7e6ff",
  },
  optionsTitle: { fontSize: 16, fontWeight: "800", color: "#144ea8", marginBottom: 8 },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  optionLabel: { fontSize: 14, color: "#222", flex: 1, marginRight: 12 },

  submitBtn: {
    marginTop: 18,
    backgroundColor: "#ff2d2d",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { color: "#fff", fontWeight: "900", fontSize: 16 },

  cancelBtn: { marginTop: 14, alignItems: "center", paddingVertical: 10 },
  cancelText: { color: "#111", fontWeight: "700" },
});