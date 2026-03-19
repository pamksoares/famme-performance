import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { Colors, Radius } from "@/constants/theme";

interface Props {
  value: string;
  label: string;
}

export function MetricCard({ value, label }: Props) {
  const { width } = useWindowDimensions();
  // Em telas menores, reduz o padding e fonte
  const isSmall = width < 380;

  return (
    <View style={[styles.card, isSmall && styles.cardSmall]}>
      <Text
        style={[styles.value, isSmall && styles.valueSmall]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 0,
  },
  cardSmall: {
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  value: {
    fontSize: 20,
    fontWeight: "500",
    color: Colors.accent,
  },
  valueSmall: {
    fontSize: 17,
  },
  label: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 3,
    textAlign: "center",
  },
});
