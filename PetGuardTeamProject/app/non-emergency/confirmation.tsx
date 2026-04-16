import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

export default function ConfirmationScreen() {
  const params = useLocalSearchParams();

  const service = String(params.service ?? "Service");
  const ownerName = String(params.ownerName ?? "");
  const petName = String(params.petName ?? "");
  const phone = String(params.phone ?? "");
  const date = String(params.date ?? "");
  const notes = String(params.notes ?? "");
  const gpsLocation = String(params.gpsLocation ?? "");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>✅ Booking Confirmed</Text>
      <Text style={styles.subtitle}>
        Your appointment has been booked successfully.
      </Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Booking Details</Text>

        <Text style={styles.item}>
          <Text style={styles.label}>Service:</Text> {service}
        </Text>

        <Text style={styles.item}>
          <Text style={styles.label}>Owner Name:</Text> {ownerName}
        </Text>

        <Text style={styles.item}>
          <Text style={styles.label}>Pet Name:</Text> {petName}
        </Text>

        <Text style={styles.item}>
          <Text style={styles.label}>Phone:</Text> {phone}
        </Text>

        <Text style={styles.item}>
          <Text style={styles.label}>Preferred Date:</Text> {date}
        </Text>

        <Text style={styles.item}>
          <Text style={styles.label}>GPS Location:</Text>{" "}
          {gpsLocation || "Not provided"}
        </Text>

        <Text style={styles.item}>
          <Text style={styles.label}>Notes:</Text> {notes || "N/A"}
        </Text>
      </View>

      <Pressable
        style={styles.primaryBtn}
        onPress={() => router.push("/emergency")}
      >
        <Text style={styles.primaryBtnText}>Back to Services</Text>
      </Pressable>

      <Pressable
        style={styles.secondaryBtn}
        onPress={() =>
          router.push({
            pathname: "/non-emergency/booking",
            params: { service },
          })
        }
      >
        <Text style={styles.secondaryBtnText}>Book Another Appointment</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1f6f2a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#555",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e3e3e3",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
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
  primaryBtn: {
    backgroundColor: "#2e7d32",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryBtn: {
    backgroundColor: "#1f5ea8",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});