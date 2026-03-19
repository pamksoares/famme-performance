import { View, Text, StyleSheet } from "react-native";
import { Colors, Radius } from "@/constants/theme";

type PillVariant = "green" | "purple" | "amber" | "coral";

const PILL_STYLES: Record<PillVariant, { bg: string; color: string }> = {
  green: { bg: Colors.accentDim, color: Colors.accent },
  purple: { bg: "rgba(175,169,236,0.12)", color: Colors.luteal },
  amber: { bg: "rgba(239,159,39,0.12)", color: Colors.ovulatory },
  coral: { bg: "rgba(240,153,123,0.12)", color: Colors.menstrual },
};

interface Props {
  label: string;
  variant?: PillVariant;
}

export function Pill({ label, variant = "green" }: Props) {
  const { bg, color } = PILL_STYLES[variant];
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    fontWeight: "500",
  },
});
