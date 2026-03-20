import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Colors, Spacing, Radius } from "@/constants/theme";
import { onboardingData } from "./profile";

// Dias do mês para picker de data
const MONTHS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

function toIsoDate(day: number, month: number, year: number): string {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export default function CycleScreen() {
  const now = new Date();
  const [day, setDay] = useState(now.getDate());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [year, setYear] = useState(now.getFullYear());
  const [cycleDays, setCycleDays] = useState(28);

  function adjustDay(delta: number) {
    const daysInMonth = new Date(year, month, 0).getDate();
    setDay((d) => Math.min(daysInMonth, Math.max(1, d + delta)));
  }

  function adjustMonth(delta: number) {
    setMonth((m) => {
      const next = m + delta;
      if (next < 1) { setYear((y) => y - 1); return 12; }
      if (next > 12) { setYear((y) => y + 1); return 1; }
      return next;
    });
  }

  function adjustCycleDays(delta: number) {
    setCycleDays((d) => Math.min(35, Math.max(21, d + delta)));
  }

  function handleContinue() {
    onboardingData.startDate = toIsoDate(day, month, year);
    onboardingData.cycleLengthDays = cycleDays;
    router.push("/(auth)/onboarding/wearable");
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <Text style={styles.step}>CICLO — 2 DE 3</Text>
          <Text style={styles.title}>Seu ciclo menstrual</Text>
          <Text style={styles.subtitle}>
            Usamos isso para calibrar suas recomendações.
          </Text>

          {/* Data do último ciclo */}
          <Text style={styles.label}>PRIMEIRO DIA DO ÚLTIMO CICLO</Text>
          <View style={styles.dateRow}>
            {/* Dia */}
            <View style={styles.datePicker}>
              <TouchableOpacity style={styles.adjBtn} onPress={() => adjustDay(1)}>
                <Text style={styles.adjText}>▲</Text>
              </TouchableOpacity>
              <Text style={styles.dateValue}>{String(day).padStart(2, "0")}</Text>
              <TouchableOpacity style={styles.adjBtn} onPress={() => adjustDay(-1)}>
                <Text style={styles.adjText}>▼</Text>
              </TouchableOpacity>
              <Text style={styles.dateUnit}>dia</Text>
            </View>

            <Text style={styles.dateSep}>/</Text>

            {/* Mês */}
            <View style={styles.datePicker}>
              <TouchableOpacity style={styles.adjBtn} onPress={() => adjustMonth(1)}>
                <Text style={styles.adjText}>▲</Text>
              </TouchableOpacity>
              <Text style={styles.dateValue}>{MONTHS[month - 1]}</Text>
              <TouchableOpacity style={styles.adjBtn} onPress={() => adjustMonth(-1)}>
                <Text style={styles.adjText}>▼</Text>
              </TouchableOpacity>
              <Text style={styles.dateUnit}>mês</Text>
            </View>

            <Text style={styles.dateSep}>/</Text>

            {/* Ano */}
            <View style={styles.datePicker}>
              <TouchableOpacity style={styles.adjBtn} onPress={() => setYear((y) => y + 1)}>
                <Text style={styles.adjText}>▲</Text>
              </TouchableOpacity>
              <Text style={styles.dateValue}>{year}</Text>
              <TouchableOpacity style={styles.adjBtn} onPress={() => setYear((y) => y - 1)}>
                <Text style={styles.adjText}>▼</Text>
              </TouchableOpacity>
              <Text style={styles.dateUnit}>ano</Text>
            </View>
          </View>

          {/* Duração do ciclo */}
          <Text style={[styles.label, { marginTop: Spacing.xl }]}>DURAÇÃO MÉDIA DO CICLO</Text>
          <View style={styles.counter}>
            <TouchableOpacity style={styles.counterBtn} onPress={() => adjustCycleDays(-1)}>
              <Text style={styles.counterBtnText}>−</Text>
            </TouchableOpacity>
            <View style={styles.counterValue}>
              <Text style={styles.counterNumber}>{cycleDays}</Text>
              <Text style={styles.counterUnit}> dias</Text>
            </View>
            <TouchableOpacity style={styles.counterBtn} onPress={() => adjustCycleDays(1)}>
              <Text style={styles.counterBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actions}>
            <Button label="Continuar" onPress={handleContinue} />
            <TouchableOpacity onPress={() => router.back()} style={styles.back}>
              <Text style={styles.backText}>Voltar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    lineHeight: 21,
  },
  label: {
    fontSize: 11,
    color: Colors.textDim,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  // Date picker
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderInput,
    borderRadius: Radius.md,
    padding: 16,
  },
  datePicker: {
    alignItems: "center",
    flex: 1,
  },
  adjBtn: {
    padding: 6,
  },
  adjText: {
    color: Colors.textDim,
    fontSize: 12,
  },
  dateValue: {
    fontSize: 20,
    fontWeight: "500",
    color: Colors.text,
    minWidth: 48,
    textAlign: "center",
  },
  dateUnit: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  dateSep: {
    color: Colors.textDim,
    fontSize: 20,
    marginBottom: 16,
  },
  // Cycle days counter
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
    paddingBottom: Spacing.xxl,
    marginTop: Spacing.xl,
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
