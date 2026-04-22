import React from "react";
import { View, Text, StyleSheet, Pressable, useColorScheme } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/theme";

export default function ConfirmationScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const params = useLocalSearchParams();

  const service = String(params.service ?? "Service");
  const ownerName = String(params.ownerName ?? "");
  const petName = String(params.petName ?? "");
  const phone = String(params.phone ?? "");
  const date = String(params.date ?? "");
  const notes = String(params.notes ?? "");
  const gpsLocation = String(params.gpsLocation ?? "");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>✅ Booking Confirmed</Text>
      <Text style={[styles.subtitle, { color: colors.icon }]}>
        Your appointment has been booked successfully.
      </Text>

      <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#fff' }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Booking Details</Text>

        <Text style={[styles.item, { color: colors.text }]}>
          <Text style={[styles.label, { color: colors.text }]}>Service:</Text> {service}
        </Text>

        <Text style={[styles.item, { color: colors.text }]}>
          <Text style={[styles.label, { color: colors.text }]}>Owner Name:</Text> {ownerName}
        </Text>

        <Text style={[styles.item, { color: colors.text }]}>
          <Text style={[styles.label, { color: colors.text }]}>Pet Name:</Text> {petName}
        </Text>

        <Text style={[styles.item, { color: colors.text }]}>
          <Text style={[styles.label, { color: colors.text }]}>Phone:</Text> {phone}
        </Text>

        <Text style={[styles.item, { color: colors.text }]}>
          <Text style={[styles.label, { color: colors.text }]}>Preferred Date:</Text> {date}
        </Text>

        <Text style={[styles.item, { color: colors.text }]}>
          <Text style={[styles.label, { color: colors.text }]}>GPS Location:</Text>{" "}
          {gpsLocation || "Not provided"}
        </Text>

        <Text style={[styles.item, { color: colors.text }]}>
          <Text style={[styles.label, { color: colors.text }]}>Notes:</Text> {notes || "N/A"}
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
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 20,
  },
  card: {
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
  },
  item: {
    fontSize: 15,
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