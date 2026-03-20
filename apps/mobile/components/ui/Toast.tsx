import { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet, View } from "react-native";
import { Colors, Radius, Spacing } from "@/constants/theme";

interface ToastProps {
  message: string;
  visible: boolean;
  type?: "success" | "error";
}

export function Toast({ message, visible, type = "success" }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 20, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, opacity, translateY]);

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ translateY }] }]}>
      <View style={[styles.dot, { backgroundColor: type === "success" ? Colors.green : Colors.red }]} />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e1c",
    borderRadius: Radius.full,
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    gap: 8,
    borderWidth: 1,
    borderColor: "#2a2a28",
    zIndex: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: "500",
  },
});
