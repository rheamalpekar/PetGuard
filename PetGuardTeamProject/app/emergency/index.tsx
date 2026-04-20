import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, Alert, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { logoutUser, getUserProfileWithCache } from "@/backendServices/ApiService";
import { useProtectedNavigation } from "@/hooks/useProtectedNavigation";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/backendServices/firebase";
import DisclaimerText from "@/components/DisclaimerText";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EmergencyHome() {
  const { protectedNavigate } = useProtectedNavigation();
  const { user: contextUser } = useAuth();
  const currentUser = contextUser ?? auth.currentUser;
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    const fetchName = async () => {
      const uid = currentUser?.uid;
      if (!uid) return;
      if (currentUser?.isAnonymous) return;

      try {
        const data = await getUserProfileWithCache(uid);
        setFullName(data.fullName);
      } catch (e) {
        console.log("Name load error", e);
      }
    };

    fetchName();
  }, [currentUser?.uid, currentUser?.isAnonymous]);

  const userName = fullName || "Guest User" ;
  const notifCount = 1;

  const goReport = (serviceLabel: string) => {
    protectedNavigate({
      pathname: "/emergency/report",
      params: { prefillType: serviceLabel },
    } as never);
  };

  const handleLogout = async () => {
    const confirmed = Platform.OS === "web" 
      ? window.confirm("Are you sure you want to logout?")
      : await new Promise((resolve) => {
          Alert.alert("Logout", "Are you sure you want to logout?", [
            { text: "Cancel", onPress: () => resolve(false), style: "cancel" },
            {
              text: "Logout",
              onPress: () => resolve(true),
              style: "destructive",
            },
          ]);
        });

    if (confirmed) {
      try {
        console.log("Logout initiated...");
        await logoutUser();
        console.log("User logged out successfully");
        router.replace("/auth/login" as never);
      } catch (error) {
        console.error("Logout error:", error);
        if (Platform.OS !== "web") {
          Alert.alert("Error", "Failed to logout. Please try again.");
        } else {
          alert("Error: Failed to logout. Please try again.");
        }
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0B1220" }}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.logoCircle}>
              <Ionicons name="shield-checkmark" size={20} color="#fff" />
            </View>
            <Text style={styles.brandText}>PetGuard</Text>
          </View>

          <Pressable style={styles.bellWrap} onPress={() => {}}>
            <Ionicons name="notifications-outline" size={26} color="#fff" />
            {notifCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notifCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        <View style={styles.welcomeRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeText}>Welcome, {userName}!</Text>
          </View>

          <Pressable
            style={styles.profileBtn}
            onPress={() => router.push("/screens/UserProfileScreen")}
          >
            <Ionicons name="person-circle-outline" size={18} color="#fff" />
            <Text style={styles.profileBtnText}>Profile</Text>
          </Pressable>

          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>

        <View style={styles.divider} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Select a Service Option</Text>
          <Text style={styles.sectionSub}>How can we help your animal today?</Text>
        </View>

        <View style={styles.divider} />

        <Pressable style={styles.bannerEmergency} onPress={() => goReport("Emergency Services")}>
          <MaterialCommunityIcons name="alarm-light" size={20} color="#fff" />
          <Text style={styles.bannerText}>EMERGENCY SERVICES</Text>
        </Pressable>

        <View style={styles.tileRow}>
          <ServiceTile
            title="Sick Animal"
            bg="#e53935"
            icon={<FontAwesome5 name="first-aid" size={28} color="#fff" />}
            onPress={() => goReport("Sick Animal")}
          />
          <ServiceTile
            title="Car Accident"
            bg="#f39c12"
            icon={<FontAwesome5 name="car-crash" size={28} color="#fff" />}
            onPress={() => goReport("Car Accident")}
          />
          <ServiceTile
            title="Animal Cruelty"
            bg="#d32f2f"
            icon={<MaterialCommunityIcons name="hand-heart" size={30} color="#fff" />}
            onPress={() => goReport("Animal Cruelty")}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.bannerNonEmergency}>
          <Ionicons name="paw" size={20} color="#fff" />
          <Text style={styles.bannerText}>NON-EMERGENCY SERVICES</Text>
        </View>

        <View style={styles.tileRow}>
          <ServiceTile
            title="Vaccination"
            bg="#1e78ff"
            icon={<MaterialCommunityIcons name="needle" size={30} color="#fff" />}
            onPress={() => goReport("Vaccination")}
          />
          <ServiceTile
            title="Adopt / Surrender"
            bg="#2e7d32"
            icon={<Ionicons name="heart" size={30} color="#fff" />}
            onPress={() => goReport("Adopt / Surrender")}
          />
          <ServiceTile
            title="Spay / Neuter"
            bg="#7e57c2"
            icon={<MaterialCommunityIcons name="scissors-cutting" size={30} color="#fff" />}
            onPress={() => goReport("Spay / Neuter")}
          />
        </View>

        <Pressable onPress={() => protectedNavigate("/formscreens/FirebaseTestScreen" as never)} style={styles.navigation}>
          <Text style={styles.navigationText}>Go to Firebase test screen</Text>
        </Pressable>

        <Pressable onPress={() => router.push("/auth/login" as never)} style={styles.navigation}>
          <Text style={styles.navigationText}>Go to Login Screen</Text>
        </Pressable>

        <Pressable onPress={() => router.push("/screens/UserProfileScreen" as never)} style={styles.navigation}>
          <Text style={styles.navigationText}>Go to Profile Screen</Text>
        </Pressable>

        <Pressable onPress={() => protectedNavigate("/formscreens/info-form" as never)} style={styles.navigation}>
          <Text style={styles.navigationText}>Go to Info Form Screen</Text>
        </Pressable>

        <Pressable onPress={() => protectedNavigate("/formscreens/ConfirmationPage" as never)} style={styles.navigation}>
          <Text style={styles.navigationText}>Go to Confirmation screen</Text>
        </Pressable>

        <View style={{ height: 14 }} />
        <DisclaimerText />
      </ScrollView>
    </SafeAreaView>
  );
}

function ServiceTile({
  title,
  bg,
  icon,
  onPress,
}: {
  title: string;
  bg: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.tile, { backgroundColor: bg }]} onPress={onPress}>
      <View style={styles.tileIcon}>{icon}</View>
      <Text style={styles.tileText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0f1115" },

  container: { paddingBottom: 22, alignItems: "center", backgroundColor: "#0f1115" },

  topBar: {
    width: "100%",
    backgroundColor: "#1f5ea8",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: { color: "#fff", fontSize: 22, fontWeight: "900" },

  bellWrap: { padding: 6 },
  badge: {
    position: "absolute",
    top: 3,
    right: 3,
    backgroundColor: "#ff2d2d",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "900" },

  welcomeRow: {
    width: "100%",
    maxWidth: 520,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#161b22",
  },
  welcomeText: { fontSize: 26, fontWeight: "900", color: "#e6edf3" },

  logoutBtn: {
    backgroundColor: "#2c2c2c",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  logoutText: { color: "#fff", fontWeight: "800" },

  divider: {
    width: "100%",
    maxWidth: 520,
    height: 1,
    backgroundColor: "#232a34",
  },

  sectionHeader: {
    width: "100%",
    maxWidth: 520,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#161b22",
  },
  sectionTitle: { fontSize: 24, fontWeight: "900", color: "#e6edf3" },
  sectionSub: { marginTop: 6, fontSize: 14, color: "#9da7b3", fontWeight: "600" },

  bannerEmergency: {
    width: "100%",
    maxWidth: 520,
    marginTop: 14,
    backgroundColor: "#d50000",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  bannerNonEmergency: {
    width: "100%",
    maxWidth: 520,
    marginTop: 14,
    backgroundColor: "#1f5ea8",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  bannerText: { color: "#fff", fontSize: 18, fontWeight: "900", letterSpacing: 0.7 },

  tileRow: {
    width: "100%",
    maxWidth: 520,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  tile: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 110,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  tileIcon: { marginBottom: 10 },
  tileText: { color: "#fff", fontWeight: "900", fontSize: 14, textAlign: "center" },

  footerNote: {
    width: "100%",
    maxWidth: 520,
    paddingHorizontal: 16,
    color: "#8b949e",
    fontSize: 12,
    textAlign: "center",
  },
  navigation: {
    backgroundColor: "#233244",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 12,
  },
  navigationText: {
    color: "#ffffff",
    fontSize: 14,
  },
  profileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#3B82F6",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginRight: 8,
  },
  profileBtnText: {
    color: "#fff",
    fontWeight: "800",
  },
});
