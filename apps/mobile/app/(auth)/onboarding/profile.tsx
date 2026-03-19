import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Colors, Spacing, Radius } from "@/constants/theme";

type Modality = "CROSSFIT" | "HYROX" | "RUNNING" | "WEIGHTLIFTING";

const MODALITIES: Array<{ key: Modality; label: string }> = [
  { key: "CROSSFIT", label: "CrossFit" },
  { key: "HYROX", label: "Hyrox" },
  { key: "RUNNING", label: "Corrida" },
  { key: "WEIGHTLIFTING", label: "Musculação" },
];

// Estado compartilhado entre as telas de onboarding (simples — sem redux)
export const onboardingData: {
  name: string;
  modality: Modality;
  email: string;
  password: string;
  startDate: string;
  cycleLengthDays: number;
} = {
  name: "",
  modality: "CROSSFIT",
  email: "",
  password: "",
  startDate: new Date().toISOString().split("T")[0],
  cycleLengthDays: 28,
};

export default function ProfileScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [modality, setModality] = useState<Modality>("CROSSFIT");

  const canContinue = name.trim().length >= 2 && email.includes("@") && password.length >= 8;

  function handleContinue() {
    onboardingData.name = name.trim();
    onboardingData.email = email.trim().toLowerCase();
    onboardingData.password = password;
    onboardingData.modality = modality;
    router.push("/(auth)/onboarding/cycle");
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.step}>PERFIL — 1 DE 3</Text>
        <Text style={styles.title}>Como você se chama?</Text>
        <Text style={styles.subtitle}>Vamos personalizar sua experiência.</Text>

        <Text style={styles.label}>NOME</Text>
        <TextInput
          style={styles.input}
          placeholder="Seu nome"
          placeholderTextColor={Colors.textDim}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <Text style={styles.label}>E-MAIL</Text>
        <TextInput
          style={styles.input}
          placeholder="seu@email.com"
          placeholderTextColor={Colors.textDim}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>SENHA</Text>
        <TextInput
          style={styles.input}
          placeholder="Mínimo 8 caracteres"
          placeholderTextColor={Colors.textDim}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={[styles.label, { marginTop: 4 }]}>MODALIDADE PRINCIPAL</Text>
        <View style={styles.grid}>
          {MODALITIES.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[styles.option, modality === m.key && styles.optionSelected]}
              onPress={() => setModality(m.key)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.optionText,
                  modality === m.key && styles.optionTextSelected,
                ]}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actions}>
          <Button label="Continuar" onPress={handleContinue} disabled={!canContinue} />
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: Spacing.xxl,
  },
  option: {
    width: "47%",
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: 12,
    alignItems: "center",
  },
  optionSelected: {
    borderColor: Colors.accent,
  },
  optionText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  optionTextSelected: {
    color: Colors.accent,
  },
  actions: {
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
