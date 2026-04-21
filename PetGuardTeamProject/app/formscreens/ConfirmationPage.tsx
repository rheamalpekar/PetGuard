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
import NetInfo from "@react-native-community/netinfo";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import {
  getInfoFormDataById,
  loadQueuedInfoForms,
  subscribeToActiveReports,
} from "@/backendServices/ApiService";
import DisclaimerText from '@/components/DisclaimerText';
import type { ConfirmationDisplayData, InfoFormData } from "@/types/DataModels";

const DEFAULT_REQUEST_ID = "xh4TG0RzYeqkCjnO0ETb";

export default function ConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { justSynced } = useAuth();
  const [formData, setFormData] = useState<InfoFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const { user } = useAuth();

  const formId =
    typeof params.formId === "string" ? params.formId : null;

  const isQueuedRequest = formId?.startsWith("queued_") ?? false;

  const isDemo = !formId && !isQueuedRequest;

  const requestId = isDemo
    ? "DEMO-REQUEST"
    : formId ?? "UNKNOWN";

  const showVectorAssets = isOnline;

  const [synced, setSynced] = useState(false);
  console.log(requestId);

  const dummyData: ConfirmationDisplayData = {
    yourName: "Demo User",
    emailAddress: "demo@petguard.app",
    phoneNumber: "123-456-7890",
    additionalDetails: "This is a sample request for demonstration purposes.",
    location: "Arlington, TX",
  };

  const displayData: ConfirmationDisplayData = formData || dummyData;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(
        Boolean(state.isConnected && state.isInternetReachable !== false),
      );
    });

    NetInfo.fetch()
      .then((state) => {
        setIsOnline(
          Boolean(state.isConnected && state.isInternetReachable !== false),
        );
      })
      .catch(() => {
        setIsOnline(false);
      });

    return unsubscribe;
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        if (isQueuedRequest) {
          const queue = await loadQueuedInfoForms();
          const queuedItem = queue.find((item) => item.localId === requestId);
          setFormData(queuedItem?.data ?? null);
          return;
        }

        if (formId) {
          const data = await getInfoFormDataById(formId);
          setFormData(data);
          return;
        }

        setFormData(null);
      } catch (error) {
        setFormData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [formId, isQueuedRequest, requestId]);

  useEffect(() => {
    if (justSynced && isQueuedRequest) {
      setSynced(true);
      Alert.alert("Uploaded", "Your request has been sent to the server.");
    }
  }, [justSynced, isQueuedRequest]);

  useEffect(() => {
    if (!user) return;

    const unsub = subscribeToActiveReports(user.uid, setActiveCount);
    return unsub;
  }, [user]);

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

  if (!displayData) {
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
    router.push("/emergency");
  };

  const handleViewProfileHistory = () => {
    router.push({
      pathname: "/screens/UserProfileScreen",
      params: { tab: "history" },
    });
  };

  const handleShareRequest = async () => {
    try {
      const location =
        displayData.location && typeof displayData.location === "object"
          ? displayData.location.address
          : displayData.location ?? "N/A";

      await Share.share({
        message: `PetGuard Non-Emergency Request\nRequest ID: ${requestId}\nEstimated Response Time: 0hrs 59mins\nContact: ${displayData.yourName} | ${displayData.phoneNumber}\nEmail: ${displayData.emailAddress}\nDescription: ${displayData.additionalDetails}\nLocation: ${location}`,
        title: "PetGuard Request Details",
      });
    } catch (error) {
      Alert.alert("Share failed", "Unable to share the request at this time.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {isQueuedRequest && !synced && (
          <View style={styles.offlineBanner}>
            <Ionicons name="cloud-offline-outline" size={20} color="#FBBF24" />
            <Text style={styles.offlineBannerText}>
              This request has not been sent to the server yet. It will be uploaded when you are back online.
            </Text>
          </View>
        )}

        {isQueuedRequest && synced && (
          <View style={styles.syncedBanner}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#34D399" />
            <Text style={styles.syncedBannerText}>
              This request has been successfully uploaded to the server.
            </Text>
          </View>
        )}

        <View style={styles.topSection}>
          <View style={styles.topTextArea}>
            <Text style={styles.heading}>Request Confirmed</Text>
            <Text style={styles.subHeading}>
              This is a Non-Emergency request{"\n"}for service.
            </Text>
          </View>

          <View style={styles.iconWrapper}>
            {showVectorAssets ? (
              <>
                <MaterialCommunityIcons name="paw" size={64} color="white" />
                <Ionicons
                  name="checkmark-circle"
                  size={34}
                  color="#3B82F6"
                  style={styles.checkIcon}
                />
              </>
            ) : (
              <Text style={styles.offlineVisualFallback}>Offline</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Request ID</Text>

          <View style={styles.rowBetween}>
            <Text style={styles.requestId}>{requestId}</Text>
            <TouchableOpacity
              onPress={async () => {
                await Clipboard.setStringAsync(requestId);
                Alert.alert("Copied!", "Request ID copied to clipboard.");
              }}
            >
              {showVectorAssets ? (
                <Feather name="copy" size={34} color="#2563EB" />
              ) : (
                <Text style={styles.offlineIconText}>Copy</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Request Tracking</Text>

          <View style={styles.timeRow}>
            <Text style={styles.timeNumber}>0</Text>
            <Text style={styles.timeText}>hr</Text>
            <Text style={styles.timeNumber}> 59</Text>
            <Text style={styles.timeText}>min</Text>
          </View>

          <View style={styles.activeReportSection}>
            {/* <Text style={styles.label}>Active Reports</Text> */}
            <Text style={styles.infoText}>
              You have <Text style={styles.blueText}>{activeCount}</Text> active
              report.
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.contactHeading}>Contact Details</Text>

          <View style={styles.infoRow}>
            {showVectorAssets ? (
              <Ionicons
                name="person"
                size={28}
                color="#2563EB"
                style={styles.infoIcon}
              />
            ) : null}
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Name:</Text> {displayData.yourName}
            </Text>
          </View>

          <View style={styles.infoRow}>
            {showVectorAssets ? (
              <Ionicons
                name="mail"
                size={28}
                color="#2563EB"
                style={styles.infoIcon}
              />
            ) : null}
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Email:</Text> {displayData.emailAddress}
            </Text>
          </View>

          <View style={styles.infoRow}>
            {showVectorAssets ? (
              <Ionicons
                name="call"
                size={28}
                color="#2563EB"
                style={styles.infoIcon}
              />
            ) : null}
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Phone number:</Text>{" "}
              {displayData.phoneNumber}
            </Text>
          </View>

          <View style={styles.infoRow}>
            {showVectorAssets ? (
              <Ionicons
                name="location"
                size={28}
                color="#2563EB"
                style={styles.infoIcon}
              />
            ) : null}
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Location:</Text>{" "}
              {displayData.location &&
              typeof displayData.location === "object" &&
              displayData.location !== null
                ? displayData.location.address
                : displayData.location ?? "N/A"}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.bottomMessageWrapper}>
          <Text style={styles.bottomMessage}>
            While you wait, please stay calm.{"\n"}
            We will be with you shortly.
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
            onPress={handleViewProfileHistory}
          >
            <Text style={styles.cancelButtonText}>View All Requests</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShareRequest}
          >
            {showVectorAssets ? (
              <Feather
                name="share-2"
                size={22}
                color="#60A5FA"
                style={styles.shareIcon}
              />
            ) : null}
            <Text style={styles.shareButtonText}>Share Request</Text>
          </TouchableOpacity>
        </View>
        <DisclaimerText />
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

  offlineVisualFallback: {
    color: "#D1D5DB",
    fontSize: 18,
    fontWeight: "600",
  },

  offlineIconText: {
    color: "#2563EB",
    fontSize: 16,
    fontWeight: "600",
  },

  section: {
    marginBottom: 18,
  },

  label: {
    color: "#E5E7EB",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 14,
  },
  sectionHeading: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 22,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  requestId: {
    color: "white",
    fontSize: 14,
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
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 45,
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
    fontSize: 18,
    fontWeight: "700",
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

  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#78350F",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  offlineBannerText: {
    color: "#FDE68A",
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },

  syncedBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#064E3B",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  syncedBannerText: {
    color: "#A7F3D0",
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
});
