import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";

type Props = {
  message: string;
  type?: "success" | "error" | "warning" | "info";
  visible: boolean;
  onHide: () => void;
};

export default function AlertNotificationComponent({
  message,
  type = "info",
  visible,
  onHide,
}: Props) {
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (!visible) return;

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start(() => onHide());
    }, 2500);

    return () => clearTimeout(timer);
  }, [visible, slideAnim]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: getColor(type), transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

function getColor(type: Props["type"]) {
  switch (type) {
    case "success":
      return "#2e7d32";
    case "error":
      return "#d32f2f";
    case "warning":
      return "#f57c00";
    default:
      return "#1f5ea8";
  }
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    zIndex: 999,
    elevation: 6,
  },
  text: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
});