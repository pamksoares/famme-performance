import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { Colors, Spacing, Radius } from "@/constants/theme";
import { register, saveCycleWithToken } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { requestAndReadHealth } from "@/lib/health";
import { onboardingData } from "./profile";

export default function WearableScreen() {
  const { setUser } = useAuthStore();
  const [appleEnabled, setAppleEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFinish(skip = false) {
    setLoading(true);
    setError(null);
    try {
      // 1. Cria a conta
      const { user, accessToken } = await register({
        name: onboardingData.name,
        email: onboardingData.email,
        password: onboardingData.password,
        modality: onboardingData.modality,
      });

      // 2. Salva o ciclo (usa o token recém criado temporariamente)
      await saveCycleWithToken(accessToken, {
        startDate: onboardingData.startDate,
        cycleLengthDays: onboardingData.cycleLengthDays,
      });

      // 3. Só autentica no app depois que tudo deu certo
      await setUser(user, accessToken);

      if (!skip && appleEnabled) {
        await requestAndReadHealth();
      }
      router.replace("/(tabs)/");
    } catch (e: any) {
      setError(e.message ?? "Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.step}>PASSO 3 DE 3</Text>
      <Text style={styles.title}>Conecte um dispositivo</Text>
      <Text style={styles.subtitle}>
        Opcional — você pode conectar agora ou depois nas Configurações.
      </Text>

      {/* Apple Health */}
      {Platform.OS === "ios" ? (
        <View style={styles.card}>
          <View style={styles.iconBox}>
            <Text style={styles.iconText}>📱</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.deviceName}>Apple Health</Text>
            <Text style={styles.deviceSub}>Sono · HRV · FC repouso</Text>
          </View>
          <Toggle value={appleEnabled} onToggle={setAppleEnabled} />
        </View>
      ) : (
        <View style={[styles.card, { opacity: 0.5 }]}>
          <View style={styles.iconBox}>
            <Text style={styles.iconText}>🏃</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.deviceName}>Health Connect</Text>
            <Text style={styles.deviceSub}>Garmin, Samsung Health e mais</Text>
          </View>
          <View style={styles.soonBadge}>
            <Text style={styles.soonText}>Em breve</Text>
          </View>
        </View>
      )}

      {/* Garmin */}
      <View style={[styles.card, styles.cardSoon]}>
        <View style={[styles.iconBox, { backgroundColor: "#0a1a0f" }]}>
          <Text style={styles.iconText}>⌚</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.deviceName}>Garmin Connect</Text>
          <Text style={styles.deviceSub}>Treinos · FC · Body Battery</Text>
        </View>
        <View style={styles.soonBadge}>
          <Text style={styles.soonText}>Em breve</Text>
        </View>
      </View>

      {/* Whoop */}
      <View style={[styles.card, { opacity: 0.4 }]}>
        <View style={[styles.iconBox, { backgroundColor: "#1a0d0d" }]}>
          <Text style={styles.iconText}>💪</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.deviceName}>Whoop</Text>
          <Text style={styles.deviceSub}>Recovery · Strain · Sleep</Text>
        </View>
        <View style={styles.soonBadge}>
          <Text style={styles.soonText}>Em breve</Text>
        </View>
      </View>

      <Text style={styles.hint}>
        Sem wearable? Tudo bem — o Femme calcula seu score só com os dados do
        ciclo.
      </Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.actions}>
        {loading ? (
          <ActivityIndicator color={Colors.accent} />
        ) : (
          <>
            <Button
              label={appleEnabled ? "Conectar e entrar" : "Entrar no app"}
              onPress={() => handleFinish(false)}
            />
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={() => handleFinish(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.skipText}>Pular por agora</Text>
            </TouchableOpacity>
          </>
        )}
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
  },
  step: {
    fontSize: 11,
    color: Colors.textDim,
    letterSpacing: 1,
    marginBottom: Spacing.xxl,
  },
  title: {
    fontSize: 22,
    color: Colors.text,
    marginBottom: 8,
    fontFamily: "serif",
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: Spacing.xxl,
    lineHeight: 21,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardSoon: {
    opacity: 0.7,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { fontSize: 18 },
  info: { flex: 1 },
  deviceName: { fontSize: 14, color: Colors.text, fontWeight: "500" },
  deviceSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  soonBadge: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  soonText: { fontSize: 10, color: Colors.textDim },
  hint: {
    fontSize: 12,
    color: Colors.textDim,
    lineHeight: 18,
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  error: {
    color: Colors.menstrual,
    fontSize: 13,
    marginTop: 12,
    textAlign: "center",
  },
  actions: {
    marginTop: "auto",
    paddingBottom: Spacing.xxl,
  },
  skipBtn: {
    alignItems: "center",
    paddingVertical: 16,
  },
  skipText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});
