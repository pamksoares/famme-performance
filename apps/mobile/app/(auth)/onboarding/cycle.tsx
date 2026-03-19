import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Colors, Spacing, Radius } from "@/constants/theme";
import { onboardingData } from "./profile";

export default function CycleScreen() {
  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [cycleDays, setCycleDays] = useState(28);

  function adjust(delta: number) {
    setCycleDays((d) => Math.min(35, Math.max(21, d + delta)));
  }

  function handleContinue() {
    onboardingData.startDate = startDate;
    onboardingData.cycleLengthDays = cycleDays;
    router.push("/(auth)/onboarding/wearable");
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.step}>CICLO — 2 DE 3</Text>
      <Text style={styles.title}>Seu ciclo menstrual</Text>
      <Text style={styles.subtitle}>
        Usamos isso para calibrar suas recomendações.
      </Text>

      <Text style={styles.label}>PRIMEIRO DIA DO ÚLTIMO CICLO</Text>
      <TextInput
        style={styles.input}
        value={startDate}
        onChangeText={setStartDate}
        placeholder="AAAA-MM-DD"
        placeholderTextColor={Colors.textDim}
        keyboardType="numbers-and-punctuation"
      />

      <Text style={[styles.label, { marginTop: 4 }]}>DURAÇÃO MÉDIA DO CICLO</Text>
      <View style={styles.counter}>
        <TouchableOpacity style={styles.counterBtn} onPress={() => adjust(-1)}>
          <Text style={styles.counterBtnText}>−</Text>
        </TouchableOpacity>
        <View style={styles.counterValue}>
          <Text style={styles.counterNumber}>{cycleDays}</Text>
          <Text style={styles.counterUnit}> dias</Text>
        </View>
        <TouchableOpacity style={styles.counterBtn} onPress={() => adjust(1)}>
          <Text style={styles.counterBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <Button label="Continuar" onPress={handleContinue} />
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>
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
  label: {
    fontSize: 11,
    color: Colors.textDim,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderInput,
    borderRadius: Radius.md,
    padding: 14,
    color: Colors.text,
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderInput,
    borderRadius: Radius.md,
    padding: 16,
    marginBottom: Spacing.xxl,
  },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#222220",
    alignItems: "center",
    justifyContent: "center",
  },
  counterBtnText: {
    color: Colors.text,
    fontSize: 20,
    lineHeight: 22,
  },
  counterValue: {
    flex: 1,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  counterNumber: {
    fontSize: 28,
    fontWeight: "500",
    color: Colors.text,
  },
  counterUnit: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  actions: {
    marginTop: "auto",
    paddingBottom: Spacing.xxl,
  },
  back: {
    alignItems: "center",
    marginTop: 8,
    padding: 8,
  },
  backText: {
    color: Colors.textDisabled,
    fontSize: 14,
  },
});
