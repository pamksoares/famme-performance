import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { Colors, Spacing, Radius } from "@/constants/theme";

interface Props {
  message?: string;
  ctaLabel?: string;
}

export function PaywallBanner({
  message = "Disponível no plano PRO",
  ctaLabel = "Desbloquear PRO",
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            stroke={Colors.yellow}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{message}</Text>
        <Text style={styles.sub}>Faça upgrade para desbloquear esse recurso</Text>
      </View>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => router.push("/(tabs)/upgrade")}
        accessibilityLabel={ctaLabel}
        accessibilityRole="button"
      >
        <Text style={styles.btnText}>{ctaLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: Spacing.xl,
    backgroundColor: "rgba(239,159,39,0.1)",
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: "rgba(239,159,39,0.3)",
    padding: Spacing.lg,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: "rgba(239,159,39,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.text,
  },
  sub: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  btn: {
    backgroundColor: Colors.yellow,
    borderRadius: Radius.full,
    paddingVertical: 10,
    alignItems: "center",
  },
  btnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0a0a08",
  },
});
