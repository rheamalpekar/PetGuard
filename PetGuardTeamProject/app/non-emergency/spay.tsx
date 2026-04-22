import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";

export default function SpayScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🐾 Spay / Neuter Service</Text>
      <Text style={styles.subtitle}>
        Ensure your pet’s health and control population responsibly
      </Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Available Services</Text>
        <Text style={styles.item}>• Spay Surgery (Female Pets)</Text>
        <Text style={styles.item}>• Neuter Surgery (Male Pets)</Text>
        <Text style={styles.item}>• Post-Surgery Care Guidance</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Steps</Text>
        <Text style={styles.item}>1. Select pet type & age</Text>
        <Text style={styles.item}>2. Choose clinic & date</Text>
        <Text style={styles.item}>3. Follow pre-surgery instructions</Text>
        <Text style={styles.item}>4. Visit clinic for procedure</Text>
      </View>

      <Pressable
        style={styles.button}
        onPress={() =>
          router.push({
            pathname: "/non-emergency/booking",
            params: { service: "Spay / Neuter" },
          })
        }
      >
        <Text style={styles.buttonText}>Book Appointment</Text>
      </Pressable>

      <Pressable
        style={styles.backBtn}
        onPress={() => router.push("/emergency")}
      >
        <Text style={styles.backText}>← Back to Services</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  item: {
    fontSize: 14,
    marginBottom: 5,
  },
  button: {
    backgroundColor: "#6a1b9a",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  backBtn: {
    marginTop: 20,
    alignItems: "center",
  },
  backText: {
    color: "#007bff",
    fontSize: 14,
  },
});