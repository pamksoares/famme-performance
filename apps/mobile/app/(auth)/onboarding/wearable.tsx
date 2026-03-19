import { useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { Colors, Spacing, Radius } from "@/constants/theme";
import { register, saveCycle } from "@/lib/api";
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
      // 1. Registra o usuário
      const { user, accessToken } = await register({
        name: onboardingData.name,
        email: onboardingData.email,
        password: onboardingData.password,
        modality: onboardingData.modality,
      });

      // 2. Persiste a sessão
      await setUser(user, accessToken);

      // 3. Salva o ciclo menstrual
      await saveCycle({
        startDate: onboardingData.startDate,
        cycleLengthDays: onboardingData.cycleLengthDays,
      });

      // 4. Solicita HealthKit se habilitado
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
      <Text style={styles.step}>WEARABLE — 3 DE 3</Text>
      <Text style={styles.title}>Conecte seu dispositivo</Text>
      <Text style={styles.subtitle}>
        Usamos seus dados de sono e HRV para um score mais preciso.
      </Text>

      <View style={styles.card}>
        <View style={styles.iconBox}>
          <Text style={styles.iconText}>📱</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.deviceName}>Apple Health</Text>
          <Text style={styles.deviceSub}>Sono, HRV, FC</Text>
        </View>
        <Toggle value={appleEnabled} onToggle={setAppleEnabled} />
      </View>

      <View style={[styles.card, styles.cardDisabled]}>
        <View style={[styles.iconBox, { backgroundColor: "#0d1a0d" }]}>
          <Text style={styles.iconText}>⌚</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.deviceName}>Garmin Connect</Text>
          <Text style={styles.deviceSub}>Treinos, FC, stress</Text>
        </View>
        <Text style={styles.soon}>Em breve</Text>
      </View>

      <View style={[styles.card, styles.cardDisabled]}>
        <View style={[styles.iconBox, { backgroundColor: "#1a0d0d" }]}>
          <Text style={styles.iconText}>💪</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.deviceName}>Whoop</Text>
          <Text style={styles.deviceSub}>Recovery, strain</Text>
        </View>
        <Text style={styles.soon}>Em breve</Text>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.actions}>
        {loading ? (
          <ActivityIndicator color={Colors.accent} style={{ marginBottom: 16 }} />
        ) : (
          <>
            <Button label="Entrar no app" onPress={() => handleFinish(false)} />
            <Button
              variant="ghost"
              label="Pular por agora"
              style={{ marginTop: 12 }}
              onPress={() => handleFinish(true)}
            />
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
    letterSpacing: 0.8,
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
  cardDisabled: {
    opacity: 0.5,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 18,
  },
  info: {
    flex: 1,
  },
  deviceName: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "500",
  },
  deviceSub: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  soon: {
    fontSize: 10,
    color: Colors.textDim,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  error: {
    color: Colors.menstrual,
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
  },
  actions: {
    marginTop: "auto",
    paddingBottom: Spacing.xxl,
  },
});
