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
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "@/backendServices/firebase";
import {
  getUserProfile,
  updateUserProfile,
  getUserRequests,
  deleteUserAccount,
  logoutUser,
} from "@/backendServices/ApiService";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";

const UserProfileScreen = () => {
  const router = useRouter();
  const { isGuest } = useAuth();

  const [profileData, setProfileData] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "profile" | "history" | "settings"
  >("profile");
  const [user, setUser] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);

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
      router.replace("/auth/login");
    }
  }, [isGuest]);

  useEffect(() => {
    const fetchUser = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      try {
        const data = await getUserProfile(uid);
        setProfileData(data);
      } catch (e) {
        console.log("Profile load error", e);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      console.log("AUTH STATE:", u);
      setUser(u);
    });
    return unsub;
  }, []);

  const loadHistory = async () => {
    console.log("LOAD HISTORY TRIGGERED");

    try {
      setLoadingHistory(true);

      const uid = user?.uid;
      if (!uid || isGuest) {
        console.log("NO USER OR GUEST → returning");
        return;
      }

      const data = await getUserRequests(uid);
      console.log("REQUESTS:", data);

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

  const handleDeleteAccount = async () => {
    if (isGuest) {
      router.replace("/auth/login");
      return;
    }

    try {
      await deleteUserAccount();

      showAlert(
        "Account Deleted",
        "Your account and all data have been permanently removed.",
      );

      router.replace("/auth/login");
    } catch (e) {
      console.log(e);

      showAlert("Error", "Failed to delete account.");
    }
  };

  const showAlert = (title: string, message: string) => {
    if (typeof window !== "undefined") {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const displayRequests = isGuest
    ? [
        {
          id: "demo1",
          formId: "DEMO123",
          additionalDetails: "Sample emergency report preview",
          status: "pending",
          createdAt: { toDate: () => new Date() },
        },
      ]
    : requests;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0B1220" }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.appName}>PetGuard</Text>
          <Ionicons name="settings-outline" size={22} color="white" />
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
                      router.replace("/auth/login");
                      return;
                    }

                    if (isEditing) {
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
          </>
        )}

        {activeTab === "history" && (
          <>
            <Text style={styles.sectionTitle}>Request History</Text>

            {displayRequests.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.rowBetween}>
                  <View style={styles.historyLeft}>
                    <View style={[styles.statusIcon, styles.green]}>
                      <Ionicons name="checkmark" color="white" size={14} />
                    </View>

                    <View>
                      <Text style={styles.historyTitle}>
                        Request #{item.formId || item.id}
                      </Text>
                      <Text style={styles.historySub}>
                        {item.additionalDetails || "No description"}
                      </Text>
                      <Text style={styles.historyTime}>
                        {item.createdAt?.toDate?.().toLocaleString?.() || "—"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.historyRight}>{item.status}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {activeTab === "settings" && (
          <>
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

            <TouchableOpacity
              style={styles.signOut}
              onPress={async () => {
                if (isGuest) {
                  router.replace("/auth/login");
                  return;
                }
                await logoutUser();
                router.replace("/auth/login");
              }}
            >
              <Text style={{ color: "white" }}>Sign Out</Text>
            </TouchableOpacity>
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
  red: { backgroundColor: "#EF4444" },

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
