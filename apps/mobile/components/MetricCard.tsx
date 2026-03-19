import { View, Text, StyleSheet } from "react-native";
import { Colors, Radius } from "@/constants/theme";

interface Props {
  value: string;
  label: string;
}

export function MetricCard({ value, label }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  value: {
    fontSize: 20,
    fontWeight: "500",
    color: Colors.accent,
  },
  label: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 3,
  },
});
