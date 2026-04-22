import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { auth } from "@/backendServices/firebase";
import {
  clearCachedUserProfile,
  getUserProfileWithCache,
  updateUserProfile,
  getUserRequests,
  deleteUserAccount,
  logoutUser,
} from "@/backendServices/ApiService";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import type { ServiceRequest, UserProfile } from "@/types/DataModels";
import {
  formatCountdown,
  formatTrackingStatus,
  getRequestTracking,
} from "@/utils/requestTracking";

const UserProfileScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user: contextUser } = useAuth();
  const user = contextUser ?? auth.currentUser;
  const isGuest = user?.isAnonymous ?? false;

  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "profile" | "history" | "settings"
  >(params.tab === "history" || params.tab === "settings" ? params.tab : "profile");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [nowMs, setNowMs] = useState(Date.now());

  const profileFields = [
    { key: "fullName", label: "Full Name", value: profileData?.fullName },
    { key: "email", label: "Email", value: profileData?.email },
    { key: "phone", label: "Phone", value: profileData?.phoneNumber },
  ];

  const guestProfile = {
    fullName: "Guest User",
    email: "guest@preview.app",
    phoneNumber: "—",
  };

  useEffect(() => {
    if (!auth.currentUser && !isGuest) {
      router.replace("/auth/LoginScreen" as never);
    }
  }, [isGuest, router]);

  useEffect(() => {
    const fetchUser = async () => {
      const uid = user?.uid;
      if (!uid) {
        setLoadingProfile(false);
        return;
      }

      if (user?.isAnonymous) {
        setProfileData(null);
        setLoadingProfile(false);
        return;
      }

      try {
        const data = await getUserProfileWithCache(uid);
        setProfileData(data);
      } catch (e) {
        console.log("Profile load error", e);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchUser();
  }, [user?.uid, user?.isAnonymous]);

  const loadHistory = async () => {

    try {
      setLoadingHistory(true);

      const uid = user?.uid;
      if (!uid) {
        console.log("No user returning");
        return;
      }

      const data = await getUserRequests(uid);

      setRequests(data);
    } catch (e) {
      console.log("History error", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history" && user) {
      loadHistory();
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (params.tab === "history" || params.tab === "settings") {
      setActiveTab(params.tab);
    }
  }, [params.tab]);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleDeleteAccount = async () => {
    if (isGuest) {
      router.replace("/auth/LoginScreen" as never);
      return;
    }

    try {
      await deleteUserAccount();

      showAlert(
        "Account Deleted",
        "Your account and all data have been permanently removed.",
      );

      router.replace("/auth/LoginScreen" as never);
    } catch (e) {
      console.log(e);

      showAlert("Error", "Failed to delete account.");
    }
  };

  const handleClearProfileCache = async () => {
    const uid = user?.uid;
    if (!uid) return;

    if (isGuest) {
      showAlert(
        "Not Available",
        "Profile cache clearing is only available for signed-in accounts.",
      );
      return;
    }

    try {
      await clearCachedUserProfile(uid);
      setProfileData(null);
      showAlert("Cache Cleared", "Stored profile information was cleared.");
    } catch (e) {
      console.log("Clear profile cache error", e);
      showAlert("Error", "Failed to clear cached profile information.");
    }
  };

  const showAlert = (title: string, message: string) => {
    if (typeof window !== "undefined" && typeof window.alert === "function") {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const displayRequests = requests;

  const emergencyCount = requests.filter(r => r.requestType === 'emergency').length;
  const nonEmergencyCount = requests.filter(r => r.requestType === 'non-emergency').length;

  const formatRequestDate = (createdAt: ServiceRequest["createdAt"]) => {
    if (createdAt instanceof Date) return createdAt.toLocaleString();
    return createdAt?.toDate?.().toLocaleString?.() || "N/A";
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0B1220" }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.appName}>PetGuard</Text>
          {/* <Ionicons name="settings-outline" size={22} color="white" /> */}
        </View>

        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Ionicons name="person-circle-outline" size={42} color="#9CA3AF" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.name}>
              {profileData?.fullName || (isGuest ? guestProfile.fullName : "—")}
            </Text>

            <Text style={styles.sub}>
              {profileData?.email || (isGuest ? guestProfile.email : "—")}
            </Text>

            <View style={styles.badges}>
              <View style={styles.badgeBlue}>
                <Text style={styles.badgeText}>Verified</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.tabs}>
          {["profile", "history", "settings"].map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => {
                setActiveTab(t as any);
              }}
              style={styles.tabBtn}
            >
              <Text
                style={[styles.tabText, activeTab === t && styles.tabActive]}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
              {activeTab === t && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === "profile" && (
          <>
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>Edit Profile</Text>
                <TouchableOpacity
                  onPress={async () => {
                    const uid = auth.currentUser?.uid;
                    if (!uid) return;

                    if (isGuest) {
                      router.replace("/auth/LoginScreen" as never);
                      return;
                    }

                    if (isEditing) {
                      if (!profileData) return;

                      await updateUserProfile(uid, {
                        fullName: profileData.fullName,
                        phoneNumber: profileData.phoneNumber,
                      });
                    }

                    setIsEditing(!isEditing);
                  }}
                >
                  <Text style={styles.editBtn}>
                    {isEditing ? "Save" : "Edit"}
                  </Text>
                </TouchableOpacity>
              </View>

              {profileFields.map((item) => (
                <View key={item.key} style={styles.profileRow}>
                  <Text style={styles.profileLabel}>{item.label}</Text>
                  <Text style={styles.profileValue}>{item.value ?? "—"}</Text>
                </View>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Request Statistics</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{emergencyCount}</Text>
                  <Text style={styles.statLabel}>Emergency</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{nonEmergencyCount}</Text>
                  <Text style={styles.statLabel}>Non-Emergency</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {activeTab === "history" && (
          <>
            <Text style={styles.sectionTitle}>Request History</Text>

            {displayRequests.map((item) => (
              <RequestHistoryCard
                key={item.id}
                item={item}
                nowMs={nowMs}
                formatRequestDate={formatRequestDate}
              />
            ))}
          </>
        )}

        {activeTab === "settings" && (
          <>
            <TouchableOpacity
              style={styles.clearCache}
              onPress={handleClearProfileCache}
            >
              <Text style={{ color: "white" }}>Clear Profile Cache</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signOut}
              onPress={async () => {
                if (isGuest) {
                  router.replace("/auth/LoginScreen" as never);
                  return;
                }
                await logoutUser();
                router.replace("/auth/LoginScreen" as never);
              }}
            >
              <Text style={{ color: "white" }}>Sign Out</Text>
            </TouchableOpacity>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Danger Zone</Text>
              <Text style={styles.dangerText}>
                Permanently delete your account. This cannot be undone.
              </Text>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => {
                  setShowDeleteModal(true);
                }}
              >
                <Text style={styles.deleteText}>Delete Account</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {showDeleteModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              {deleteStep === 1 && (
                <>
                  <Ionicons name="warning-outline" size={48} color="#EF4444" />
                  <Text style={styles.modalTitle}>Delete Account</Text>
                  <Text style={styles.modalText}>
                    This will permanently delete your account and all associated
                    data including:
                  </Text>
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.modalBullet}>• All requests</Text>
                    <Text style={styles.modalBullet}>• Uploaded photos</Text>
                    <Text style={styles.modalBullet}>
                      • Personal information
                    </Text>
                  </View>
                  <Text style={[styles.modalText, { marginTop: 14 }]}>
                    This action cannot be undone.
                  </Text>
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={styles.modalCancel}
                      onPress={() => setShowDeleteModal(false)}
                    >
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalNext}
                      onPress={() => setDeleteStep(2)}
                    >
                      <Text style={styles.modalNextText}>Continue</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
              {deleteStep === 2 && (
                <>
                  <Ionicons
                    name="alert-circle-outline"
                    size={48}
                    color="#EF4444"
                  />
                  <Text style={styles.modalTitle}>Final Confirmation</Text>
                  <Text style={styles.modalText}>
                    Are you absolutely sure you want to delete your account?
                  </Text>
                  <Text style={[styles.modalText, { marginTop: 10 }]}>
                    This will remove everything permanently.
                  </Text>
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={styles.modalCancel}
                      onPress={() => setShowDeleteModal(false)}
                    >
                      <Text style={styles.modalCancelText}>Go Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalDelete}
                      onPress={handleDeleteAccount}
                    >
                      <Text style={styles.modalDeleteText}>Delete Forever</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

function RequestHistoryCard({
  item,
  nowMs,
  formatRequestDate,
}: {
  item: ServiceRequest;
  nowMs: number;
  formatRequestDate: (createdAt: ServiceRequest["createdAt"]) => string;
}) {
  const tracking = getRequestTracking(item.createdAt, nowMs);
  const statusLabel = formatTrackingStatus(tracking.status);
  const countdownLabel = formatCountdown(tracking.remainingMs);

  return (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <View style={styles.historyLeft}>
          <View
            style={[
              styles.statusIcon,
              tracking.status === "completed" ? styles.green : styles.blue,
            ]}
          >
            <Ionicons
              name={tracking.status === "completed" ? "checkmark" : "time"}
              color="white"
              size={14}
            />
          </View>

          <View style={styles.historyContent}>
            <Text style={styles.historyTitle}>
              Request #{item.formId || item.id}
            </Text>
            <Text style={styles.historySub}>
              {item.additionalDetails || "No description"}
            </Text>
            <Text style={styles.historyTime}>
              {formatRequestDate(item.createdAt)}
            </Text>
            <Text style={styles.historyCountdown}>
              {tracking.status === "completed"
                ? "Completed"
                : `${countdownLabel} remaining`}
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.historyRight,
            tracking.status === "completed" && styles.historyComplete,
          ]}
        >
          {statusLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1220" },
  scroll: { padding: 20 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  appName: { color: "white", fontSize: 18, fontWeight: "600" },

  userRow: { flexDirection: "row", marginBottom: 20 },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 16,
    backgroundColor: "#1F2937",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  name: { color: "white", fontSize: 22, fontWeight: "600" },
  sub: { color: "#9CA3AF", marginBottom: 6 },

  badges: { flexDirection: "row", gap: 8 },
  badgeBlue: { backgroundColor: "#1E3A8A", padding: 6, borderRadius: 12 },
  badgeText: { color: "white", fontSize: 12 },

  tabs: { flexDirection: "row", marginBottom: 16 },
  tabBtn: { flex: 1, alignItems: "center" },
  tabText: { color: "#9CA3AF" },
  tabActive: { color: "#3B82F6" },
  tabUnderline: {
    height: 2,
    width: "100%",
    backgroundColor: "#3B82F6",
    marginTop: 4,
  },

  card: {
    backgroundColor: "#1F2937",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  cardTitle: { color: "white", fontSize: 16, marginBottom: 10 },
  editBtn: { color: "#3B82F6" },

  profileRow: { marginBottom: 10 },
  profileLabel: { color: "#9CA3AF" },
  profileValue: { color: "white" },

  petRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  petIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  petName: { color: "white" },
  petDesc: { color: "#9CA3AF", fontSize: 12 },

  sectionTitle: { color: "white", fontSize: 18, marginBottom: 12 },

  historyLeft: { flexDirection: "row", gap: 10 },
  historyTitle: { color: "white" },
  historySub: { color: "#9CA3AF", fontSize: 12 },
  historyTime: { color: "#6B7280", fontSize: 12 },
  historyRight: { color: "#3B82F6" },

  statusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  green: { backgroundColor: "#10B981" },
  blue: { backgroundColor: "#2563EB" },
  red: { backgroundColor: "#EF4444" },
  historyContent: {
    flex: 1,
  },
  historyCountdown: {
    color: "#60A5FA",
    fontSize: 12,
    marginTop: 3,
  },
  historyComplete: {
    color: "#10B981",
  },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 8,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    color: "white",
    fontSize: 28,
    fontWeight: "700",
  },
  statLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#374151",
  },

  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  settingTitle: { color: "white" },
  settingSub: { color: "#9CA3AF", fontSize: 12 },

  dangerText: { color: "#9CA3AF", marginBottom: 10 },
  deleteBtn: {
    borderWidth: 1,
    borderColor: "#EF4444",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  deleteText: { color: "#EF4444" },

  signOut: {
    marginTop: 20,
    padding: 14,
    backgroundColor: "#111827",
    borderRadius: 12,
    alignItems: "center",
    margin: 20,
  },
  clearCache: {
    marginTop: 12,
    padding: 14,
    backgroundColor: "#111827",
    borderRadius: 12,
    alignItems: "center",
  },

  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#1F2937",
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
  },
  modalTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
    marginTop: 10,
  },
  modalText: {
    color: "#D1D5DB",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
  },
  modalBullet: {
    color: "#D1D5DB",
    fontSize: 14,
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: 20,
    gap: 10,
  },
  modalCancel: {
    flex: 1,
    backgroundColor: "#111827",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  modalCancelText: {
    color: "#9CA3AF",
  },
  modalNext: {
    flex: 1,
    backgroundColor: "#2563EB",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  modalNextText: {
    color: "white",
  },
  modalDelete: {
    flex: 1,
    backgroundColor: "#EF4444",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  modalDeleteText: {
    color: "white",
    fontWeight: "600",
  },
});

export default UserProfileScreen;
