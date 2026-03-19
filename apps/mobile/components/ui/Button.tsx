import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Colors, Radius } from "@/constants/theme";

interface Props extends TouchableOpacityProps {
  variant?: "primary" | "ghost";
  loading?: boolean;
  label: string;
  style?: ViewStyle;
}

export function Button({
  variant = "primary",
  loading = false,
  label,
  onPress,
  style,
  disabled,
  ...props
}: Props) {
  const handlePress = async (e: any) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(e);
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? Colors.bg : Colors.accent}
          size="small"
        />
      ) : (
        <Text style={[styles.label, styles[`label_${variant}`]]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.full,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  primary: {
    backgroundColor: Colors.accent,
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.accentBorder,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
  },
  label_primary: {
    color: Colors.bg,
  },
  label_ghost: {
    color: Colors.accent,
    fontSize: 14,
  },
});
