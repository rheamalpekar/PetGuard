import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import AlertNotificationComponent from "@/components/AlertNotificationComponent";

export default function BookingScreen() {
  const params = useLocalSearchParams();
  const service = String(params.service ?? "Service Booking");

  const [ownerName, setOwnerName] = useState("");
  const [petName, setPetName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  const [gpsLocation, setGpsLocation] = useState("");
  const [fetchingLocation, setFetchingLocation] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const getCurrentLocation = async () => {
    try {
      setFetchingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to fetch GPS details."
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const latitude = location.coords.latitude.toFixed(6);
      const longitude = location.coords.longitude.toFixed(6);

      setGpsLocation(`Latitude: ${latitude}, Longitude: ${longitude}`);
    } catch (error) {
      console.error("Error fetching location:", error);
      Alert.alert("Location Error", "Unable to fetch GPS location right now.");
    } finally {
      setFetchingLocation(false);
    }
  };

  const handleBooking = () => {
    if (!ownerName.trim() || !petName.trim() || !phone.trim() || !date.trim()) {
      Alert.alert("Missing Information", "Please fill all required fields.");
      return;
    }

    const bookingData = {
      service,
      ownerName,
      petName,
      phone,
      date,
      notes,
      gpsLocation,
      createdAt: new Date().toISOString(),
    };

    console.log("Booking created:", bookingData);

    setAlertMessage("Booking Successful ✅");
    setAlertVisible(true);

    setTimeout(() => {
      router.push({
        pathname: "/non-emergency/confirmation",
        params: {
          service,
          ownerName,
          petName,
          phone,
          date,
          notes,
          gpsLocation,
        },
      });
    }, 1200);
  };

  return (
    <View style={styles.wrapper}>
      <AlertNotificationComponent
        message={alertMessage}
        type="success"
        visible={alertVisible}
        onHide={() => setAlertVisible(false)}
      />

      <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
        <Text style={styles.title}>Appointment Booking</Text>
        <Text style={styles.subtitle}>{service}</Text>

        <Text style={styles.label}>Owner Name *</Text>
        <TextInput
          style={styles.input}
          value={ownerName}
          onChangeText={setOwnerName}
          placeholder="Enter owner name"
        />

        <Text style={styles.label}>Pet Name *</Text>
        <TextInput
          style={styles.input}
          value={petName}
          onChangeText={setPetName}
          placeholder="Enter pet name"
        />

        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Preferred Date *</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="MM/DD/YYYY"
        />

        <Text style={styles.label}>GPS Location</Text>
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

        <Text style={styles.label}>Additional Notes</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any additional details..."
          multiline
          textAlignVertical="top"
        />

        <Pressable style={styles.bookBtn} onPress={handleBooking}>
          <Text style={styles.bookBtnText}>Confirm Booking</Text>
        </Pressable>

        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  screen: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: "#2e7d32",
    fontWeight: "700",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    color: "#222",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 15,
  },
  notesInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  locationInput: {
    color: "#444",
  },
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
  bookBtn: {
    backgroundColor: "#2e7d32",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  bookBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  backBtn: {
    marginTop: 18,
    alignItems: "center",
  },
  backText: {
    color: "#007bff",
    fontSize: 14,
    fontWeight: "600",
  },
});