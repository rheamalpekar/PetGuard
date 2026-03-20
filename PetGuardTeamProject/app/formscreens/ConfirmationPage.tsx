import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Share,
  Alert,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getInfoFormDataById } from "@/backendServices/ApiService";

const DEFAULT_REQUEST_ID = "xh4TG0RzYeqkCjnO0ETb";

export default function ConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const formId =
    typeof params.formId === "string" ? params.formId : DEFAULT_REQUEST_ID;
  const requestId = formId || DEFAULT_REQUEST_ID;
  console.log(requestId);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getInfoFormDataById(formId);
        setFormData(data);
      } catch (error) {
        Alert.alert("Error", error.message || "Could not load form data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [formId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ color: "white" }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!formData) {
    return (
      <SafeAreaView style={styles.container}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ color: "white" }}>No data found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleReturnToDashboard = () => {
    router.replace("/");
  };

  const handleCancelRequest = () => {
    Alert.alert(
      "Cancel Request",
      "Are you sure you want to cancel this request?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => router.replace("/"),
        },
      ],
    );
  };

  const handleShareRequest = async () => {
    try {
      await Share.share({
        message: `PetGuard Non-Emergency Request\nRequest ID: ${requestId}\nEstimated Response Time: 54 Minutes\nContact: ${formData.yourName} | ${formData.mobileNumber}\nLocation: ${formData.location}`,
        title: "PetGuard Request Details",
      });
    } catch (error) {
      Alert.alert("Share failed", "Unable to share the request at this time.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.topSection}>
          <View style={styles.topTextArea}>
            <Text style={styles.heading}>Request Confirmed</Text>
            <Text style={styles.subHeading}>
              This is a Non-Emergency request{"\n"}for service.
            </Text>
          </View>

          <View style={styles.iconWrapper}>
            <MaterialCommunityIcons name="paw" size={64} color="white" />
            <Ionicons
              name="checkmark-circle"
              size={34}
              color="#3B82F6"
              style={styles.checkIcon}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Request ID</Text>

          <View style={styles.rowBetween}>
            <Text style={styles.requestId}>{requestId}</Text>
            <TouchableOpacity
              onPress={async () => {
                await Clipboard.setStringAsync(requestId);
                Alert.alert("Copied!", "Request ID copied to clipboard.");
              }}
            >
              <Feather name="copy" size={34} color="#2563EB" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.label}>Estimated Response Time</Text>

          <View style={styles.timeRow}>
            <Text style={styles.timeNumber}>54</Text>
            <Text style={styles.timeText}> Minutes</Text>
          </View>

          <View style={styles.activeReportSection}>
            <Text style={styles.label}>Active Reports</Text>
            <Text style={styles.infoText}>
              You have <Text style={styles.blueText}>1</Text> active report.
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.contactHeading}>Contact Details</Text>

          <View style={styles.infoRow}>
            <Ionicons
              name="person"
              size={28}
              color="#2563EB"
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Name:</Text> {formData.yourName}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name="mail"
              size={28}
              color="#2563EB"
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Email:</Text> {formData.emailAddress}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name="call"
              size={28}
              color="#2563EB"
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Phone number:</Text>{" "}
              {formData.phoneNumber}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name="location"
              size={28}
              color="#2563EB"
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Location:</Text>{" "}
              {typeof formData.location === "object" &&
              formData.location !== null
                ? formData.location.address
                : formData.location}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.bottomMessageWrapper}>
          <Text style={styles.bottomMessage}>
            While you wait, please ensure that the animal is safe.{"\n"}We will
            be with you shortly.
          </Text>
        </View>

        <View style={styles.centerButtonWrapper}>
          <TouchableOpacity
            style={styles.dashboardButton}
            onPress={handleReturnToDashboard}
          >
            <Text style={styles.dashboardButtonText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomButtonsRow}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelRequest}
          >
            <Text style={styles.cancelButtonText}>Cancel Request</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShareRequest}
          >
            <Feather
              name="share-2"
              size={22}
              color="#60A5FA"
              style={styles.shareIcon}
            />
            <Text style={styles.shareButtonText}>Share Request</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
  },

  scrollContainer: {
    padding: 22,
    paddingBottom: 40,
  },

  topSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 10,
    marginBottom: 28,
  },

  topTextArea: {
    flex: 1,
    paddingRight: 12,
  },

  heading: {
    color: "white",
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 10,
  },

  subHeading: {
    color: "#D1D5DB",
    fontSize: 15,
    lineHeight: 24,
  },

  iconWrapper: {
    width: 90,
    height: 90,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  checkIcon: {
    position: "absolute",
    right: 4,
    bottom: 12,
  },

  section: {
    marginBottom: 18,
  },

  label: {
    color: "#E5E7EB",
    fontSize: 15,
    marginBottom: 14,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  requestId: {
    color: "white",
    fontSize: 24,
    fontWeight: "500",
    letterSpacing: 1,
  },

  divider: {
    height: 1,
    backgroundColor: "#243244",
    marginVertical: 8,
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 22,
  },

  timeNumber: {
    color: "#3B82F6",
    fontSize: 58,
    fontWeight: "700",
    lineHeight: 62,
  },

  timeText: {
    color: "white",
    fontSize: 22,
    marginBottom: 8,
  },

  activeReportSection: {
    marginTop: 8,
  },

  contactHeading: {
    color: "white",
    fontSize: 17,
    fontWeight: "500",
    marginBottom: 22,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  infoIcon: {
    width: 34,
  },

  infoText: {
    color: "white",
    fontSize: 15,
    lineHeight: 24,
    flexShrink: 1,
  },

  bold: {
    fontWeight: "700",
  },

  blueText: {
    color: "#60A5FA",
    fontWeight: "700",
  },

  bottomMessageWrapper: {
    marginTop: 12,
    marginBottom: 26,
  },

  bottomMessage: {
    color: "#E5E7EB",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 28,
  },

  centerButtonWrapper: {
    alignItems: "center",
    marginBottom: 22,
  },

  dashboardButton: {
    backgroundColor: "#0F5DAA",
    paddingVertical: 16,
    paddingHorizontal: 34,
    borderRadius: 30,
    minWidth: 250,
    alignItems: "center",
  },

  dashboardButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },

  bottomButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
  },

  cancelButton: {
    flex: 1,
    backgroundColor: "#0F5DAA",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },

  cancelButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "500",
  },

  shareButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#3B82F6",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  shareIcon: {
    marginRight: 8,
  },

  shareButtonText: {
    color: "#60A5FA",
    fontSize: 15,
    fontWeight: "500",
  },
});