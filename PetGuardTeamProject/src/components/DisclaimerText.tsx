import React from "react";
import { Text, StyleSheet, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function DisclaimerText() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Demo / Educational use only — no real team dispatch.
      </Text>

      <TouchableOpacity onPress={() => router.push("/screens/AboutScreen")}>
        <Text style={styles.link}>Learn more</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    alignItems: "center",
  },
  text: {
    color: "#9CA3AF",
    fontSize: 12,
    textAlign: "center",
  },
  link: {
    color: "#60A5FA",
    fontSize: 12,
    marginTop: 4,
  },
});
