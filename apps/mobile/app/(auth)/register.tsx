import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Colors, Spacing, Radius } from "@/constants/theme";
import { register } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

type Modality = "CROSSFIT" | "HYROX" | "RUNNING" | "WEIGHTLIFTING";

const MODALITIES: Array<{ key: Modality; label: string }> = [
  { key: "CROSSFIT", label: "CrossFit" },
  { key: "HYROX", label: "Hyrox" },
  { key: "RUNNING", label: "Corrida" },
  { key: "WEIGHTLIFTING", label: "Musculação" },
];

export default function RegisterScreen() {
  const { setUser } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [modality, setModality] = useState<Modality>("CROSSFIT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    name.trim().length >= 2 && email.includes("@") && password.length >= 8;

  async function handleRegister() {
    setLoading(true);
    setError(null);
    try {
      const { user, accessToken } = await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        modality,
      });
      await setUser(user, accessToken);
      router.replace("/(tabs)/");
    } catch (e: any) {
      setError(e.message ?? "Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
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
          contentContainerStyle={styles.scroll}
        >
          <Text style={styles.title}>Criar sua conta</Text>
          <Text style={styles.subtitle}>
            Comece a treinar com o seu ciclo a favor.
          </Text>

          <Text style={styles.label}>NOME</Text>
          <TextInput
            style={styles.input}
            placeholder="Seu nome"
            placeholderTextColor={Colors.textDim}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoCorrect={false}
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
            autoCorrect={false}
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

          <Text style={[styles.label, { marginTop: 4 }]}>
            MODALIDADE PRINCIPAL
          </Text>
          <View style={styles.grid}>
            {MODALITIES.map((m) => (
              <TouchableOpacity
                key={m.key}
                style={[
                  styles.option,
                  modality === m.key && styles.optionSelected,
                ]}
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

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.actions}>
            <Button
              label="Criar conta"
              onPress={handleRegister}
              loading={loading}
              disabled={!canSubmit}
            />
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => router.replace("/(auth)/login")}
            >
              <Text style={styles.loginLinkText}>
                Já tenho uma conta.{" "}
                <Text style={styles.loginLinkAccent}>Entrar</Text>
              </Text>
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
  },
  scroll: {
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxxl,
  },
  title: {
    fontSize: 26,
    color: Colors.text,
    marginBottom: 8,
    fontFamily: "serif",
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: Spacing.xxl,
    lineHeight: 22,
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
    gap: 8,
    marginBottom: Spacing.xl,
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderInput,
    backgroundColor: Colors.bgCard,
  },
  optionSelected: {
    borderColor: Colors.accent,
    backgroundColor: "rgba(200,240,154,0.08)",
  },
  optionText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  optionTextSelected: {
    color: Colors.accent,
  },
  error: {
    color: Colors.menstrual,
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  actions: {
    marginTop: Spacing.md,
  },
  loginLink: {
    alignItems: "center",
    marginTop: Spacing.xl,
    padding: 8,
  },
  loginLinkText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  loginLinkAccent: {
    color: Colors.accent,
    fontWeight: "600",
  },
});
