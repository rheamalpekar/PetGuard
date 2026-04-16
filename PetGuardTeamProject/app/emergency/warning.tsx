import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

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

export default function EmergencyWarningScreen() {
  const params = useLocalSearchParams();

  const analysis = useMemo(() => {
    try {
      return JSON.parse(String(params.analysis ?? "{}")) as AnalysisResult;
    } catch {
      return null;
    }
  }, [params.analysis]);

  const emergencyType = String(params.emergencyType ?? "");
  const description = String(params.description ?? "");
  const severity = String(params.severity ?? "");
  const location = String(params.location ?? "");
  const gpsLocation = String(params.gpsLocation ?? "");
  const dispatchNotified = String(params.dispatchNotified ?? "false");

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚨 Emergency Alert</Text>
        <Text style={styles.headerSub}>
          Dispatch notification completed successfully
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Emergency Details</Text>

        <Text style={styles.item}>
          <Text style={styles.label}>Type:</Text> {emergencyType}
        </Text>

        <Text style={styles.item}>
          <Text style={styles.label}>Selected Severity:</Text> {severity}
        </Text>

        <Text style={styles.item}>
          <Text style={styles.label}>Detected Severity:</Text>{" "}
          {analysis?.severity ?? "N/A"}
        </Text>

        <Text style={styles.item}>
          <Text style={styles.label}>Classification:</Text>{" "}
          {analysis?.classification ?? "N/A"}
        </Text>

        <Text style={styles.item}>
          <Text style={styles.label}>Manual Location:</Text> {location || "N/A"}
        </Text>

        <Text style={styles.item}>
          <Text style={styles.label}>GPS Location:</Text>{" "}
          {gpsLocation || "Not available"}
        </Text>

        <Text style={styles.item}>
          <Text style={styles.label}>Description:</Text> {description}
        </Text>

        <Text style={styles.item}>
          <Text style={styles.label}>Dispatch Protocol:</Text>{" "}
          {analysis?.dispatchProtocol ?? "N/A"}
        </Text>

        <Text style={styles.item}>
          <Text style={styles.label}>Dispatch Status:</Text>{" "}
          {dispatchNotified === "true" ? "Notified ✅" : "Pending"}
        </Text>

        <Text style={styles.item}>
          <Text style={styles.label}>Detection Time:</Text>{" "}
          {analysis?.detectionMs ? `${analysis.detectionMs} ms` : "N/A"}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Critical Information Checklist</Text>
        {analysis?.checklist && analysis.checklist.length > 0 ? (
          analysis.checklist.map((item, index) => (
            <Text key={index} style={styles.checkItem}>
              • {item}
            </Text>
          ))
        ) : (
          <Text style={styles.item}>No checklist available.</Text>
        )}
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => router.push("/emergency")}
        >
          <Text style={styles.primaryBtnText}>Back to Emergency Home</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryBtn}
          onPress={() => router.push("/emergency/report")}
        >
          <Text style={styles.secondaryBtnText}>Report Another Emergency</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    backgroundColor: "#ffeded",
    borderWidth: 1,
    borderColor: "#ffc8c8",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#b00020",
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 14,
    color: "#555",
  },
  card: {
    backgroundColor: "#f8f8f8",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
    color: "#111",
  },
  item: {
    fontSize: 15,
    color: "#222",
    marginBottom: 8,
    lineHeight: 22,
  },
  label: {
    fontWeight: "700",
  },
  checkItem: {
    fontSize: 15,
    color: "#222",
    marginBottom: 8,
    lineHeight: 22,
  },
  buttonRow: {
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: "#1f5ea8",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryBtn: {
    backgroundColor: "#ff2d2d",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
  secondaryBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
});