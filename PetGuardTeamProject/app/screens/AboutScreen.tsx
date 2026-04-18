import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function AboutScreen() {
  const router = useRouter();

  const handleEmailPress = () => {
    Linking.openURL("mailto:spandanmahat00@gmail.com");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>About PetGuard</Text>

        <View style={{ width: 22 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="paw" size={26} color="#3B82F6" />
            <Text style={styles.title}>PetGuard</Text>
          </View>

          <Text style={styles.text}>
            A demo mobile application for animal emergency reporting and care
            services.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="warning-outline" size={22} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Important</Text>
          </View>

          <Text style={styles.text}>
            This app is for educational/demo purposes only and does NOT dispatch
            real emergency or non-emergency services.
          </Text>

          <Text style={styles.text}>
            We may collect location, photos, and contact information within this
            app for simulation purposes. This data is not shared with third
            parties.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="mail-outline" size={22} color="#10B981" />
            <Text style={styles.sectionTitle}>Contact</Text>
          </View>

          <Text style={styles.contactIntro}>
            You can contact any of the team members below if you have any questions:
          </Text>

          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => Linking.openURL("mailto:sxm4112@mavs.uta.edu")}
          >
            <Ionicons name="mail" size={18} color="#60A5FA" />
            <View>
              <Text style={styles.contactName}>Spandan Mahat</Text>
              <Text style={styles.email}>sxm4112@mavs.uta.edu</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => Linking.openURL("mailto:sxf5977@mavs.uta.edu")}
          >
            <Ionicons name="mail" size={18} color="#60A5FA" />
            <View>
              <Text style={styles.contactName}>Steven Fitzgerald</Text>
              <Text style={styles.email}>sxf5977@mavs.uta.edu</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => Linking.openURL("mailto:kyle.henry@mavs.uta.edu")}
          >
            <Ionicons name="mail" size={18} color="#60A5FA" />
            <View>
              <Text style={styles.contactName}>Kyle Henry</Text>
              <Text style={styles.email}>kyle.henry@mavs.uta.edu</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => Linking.openURL("mailto:vxp4855@mavs.uta.edu")}
          >
            <Ionicons name="mail" size={18} color="#60A5FA" />
            <View>
              <Text style={styles.contactName}>
                Venkata Pavan Ganesh Pallothu
              </Text>
              <Text style={styles.email}>vxp4855@mavs.uta.edu</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => Linking.openURL("mailto:rxm2942@mavs.uta.edu")}
          >
            <Ionicons name="mail" size={18} color="#60A5FA" />
            <View>
              <Text style={styles.contactName}>Rhea Malpekar</Text>
              <Text style={styles.email}>rxm2942@mavs.uta.edu</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },

  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },

  content: {
    padding: 20,
  },

  card: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },

  title: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
  },

  sectionTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  text: {
    color: "#D1D5DB",
    fontSize: 14,
    lineHeight: 22,
  },

  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },

  contactIntro: {
    color: "#9CA3AF",
    fontSize: 13,
    marginBottom: 10,
  },

  contactName: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },

  email: {
    color: "#60A5FA",
    fontSize: 14,
    fontWeight: "500",
  },
});
