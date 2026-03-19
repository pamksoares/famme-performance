import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Colors, Spacing } from "@/constants/theme";
import Svg, { Circle, Line, Polygon } from "react-native-svg";

function FemmeLogo() {
  return (
    <Svg width={72} height={72} viewBox="0 0 400 400">
      <Circle cx="200" cy="200" r="160" fill="none" stroke={Colors.accent} strokeWidth="8" />
      <Circle cx="200" cy="200" r="110" fill="none" stroke={Colors.accent} strokeWidth="4" opacity={0.4} />
      <Line x1="200" y1="40" x2="200" y2="360" stroke={Colors.accent} strokeWidth="6" />
      <Line x1="40" y1="200" x2="360" y2="200" stroke={Colors.accent} strokeWidth="6" />
      <Polygon points="200,40 214,182 200,200 186,182" fill={Colors.accent} />
      <Polygon points="360,200 218,214 200,200 218,186" fill={Colors.accent} opacity={0.7} />
      <Polygon points="200,360 186,218 200,200 214,218" fill={Colors.accent} opacity={0.5} />
      <Polygon points="40,200 182,186 200,200 182,214" fill={Colors.accent} opacity={0.35} />
      <Circle cx="200" cy="200" r="18" fill={Colors.accent} />
      <Circle cx="200" cy="200" r="7" fill={Colors.bg} />
    </Svg>
  );
}

export default function SplashScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoArea}>
        <FemmeLogo />
        <Text style={styles.brand}>FEMME</Text>
        <Text style={styles.sub}>performance</Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.headline}>
          Treine com{"\n"}seu corpo,{"\n"}
          <Text style={styles.heroAccent}>não contra ele</Text>
        </Text>
        <Text style={styles.caption}>
          Dados corporais + ciclo hormonal ={"\n"}treino inteligente para a sua biologia.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          label="Começar"
          onPress={() => router.push("/(auth)/onboarding/profile")}
        />
        <Button
          variant="ghost"
          label="Já tenho conta"
          style={{ marginTop: 12 }}
          onPress={() => router.push("/(auth)/login")}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxl,
    justifyContent: "space-between",
  },
  logoArea: {
    alignItems: "center",
    marginBottom: Spacing.xxxl,
  },
  brand: {
    fontSize: 28,
    color: Colors.text,
    letterSpacing: 3,
    marginTop: 20,
    fontFamily: "serif",
  },
  sub: {
    fontSize: 15,
    color: Colors.accent,
    fontStyle: "italic",
    letterSpacing: 6,
    fontFamily: "serif",
  },
  hero: {
    flex: 1,
    justifyContent: "center",
  },
  headline: {
    fontSize: 26,
    color: Colors.text,
    lineHeight: 34,
    fontFamily: "serif",
    marginBottom: 14,
  },
  heroAccent: {
    color: Colors.accent,
    fontStyle: "italic",
  },
  caption: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 24,
  },
  actions: {},
});
