import { TouchableOpacity, Animated, StyleSheet } from "react-native";
import { useRef, useEffect } from "react";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/theme";

interface Props {
  value: boolean;
  onToggle: (val: boolean) => void;
}

export function Toggle({ value, onToggle }: Props) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value, anim]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [3, 23] });
  const bgColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#2a2a28", Colors.accent],
  });

  return (
    <TouchableOpacity
      onPress={async () => {
        await Haptics.selectionAsync();
        onToggle(!value);
      }}
      activeOpacity={0.9}
    >
      <Animated.View style={[styles.track, { backgroundColor: bgColor }]}>
        <Animated.View style={[styles.thumb, { transform: [{ translateX }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 44,
    height: 24,
    borderRadius: 99,
    justifyContent: "center",
  },
  thumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.bg,
  },
});
