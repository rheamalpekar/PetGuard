import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";

export default function VaccinationScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>💉 Vaccination Service</Text>
      <Text style={styles.subtitle}>
        Schedule vaccinations for your pet easily
      </Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Available Services</Text>
        <Text style={styles.item}>• Rabies Vaccination</Text>
        <Text style={styles.item}>• General Immunization</Text>
        <Text style={styles.item}>• Booster Shots</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Steps</Text>
        <Text style={styles.item}>1. Select vaccine type</Text>
        <Text style={styles.item}>2. Choose preferred date</Text>
        <Text style={styles.item}>3. Visit nearest clinic</Text>
      </View>

      <Pressable
        style={styles.button}
        onPress={() =>
          router.push({
            pathname: "/non-emergency/booking",
            params: { service: "Vaccination" },
          })
        }
      >
        <Text style={styles.buttonText}>Schedule Appointment</Text>
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
    backgroundColor: "#2e7d32",
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