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

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  if (password.length === 0) return { score: 0, label: "", color: "transparent" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: "Fraca", color: Colors.menstrual };
  if (score <= 2) return { score: 2, label: "Razoável", color: Colors.ovulatory };
  if (score <= 3) return { score: 3, label: "Boa", color: Colors.follicular };
  return { score: 4, label: "Forte", color: Colors.accent };
}

export default function RegisterScreen() {
  const { setUser } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [modality, setModality] = useState<Modality>("CROSSFIT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = getPasswordStrength(password);
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
      if (e.status === 409) {
        setError(
          "Este e-mail já está cadastrado. Tente fazer login ou recuperar sua senha."
        );
      } else {
        setError(e.message ?? "Erro ao criar conta. Tente novamente.");
      }
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

          {/* Indicador de força de senha */}
          {password.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBars}>
                {[1, 2, 3, 4].map((level) => (
                  <View
                    key={level}
                    style={[
                      styles.strengthBar,
                      {
                        backgroundColor:
                          strength.score >= level
                            ? strength.color
                            : Colors.border,
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.strengthLabel, { color: strength.color }]}>
                {strength.label}
              </Text>
            </View>
          )}

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

          {error?.includes("já está cadastrado") && (
            <TouchableOpacity
              onPress={() => router.push("/(auth)/forgot-password")}
              style={styles.recoverBtn}
            >
              <Text style={styles.recoverText}>Recuperar senha →</Text>
            </TouchableOpacity>
          )}

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
  strengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: Spacing.md,
    marginTop: -Spacing.sm,
  },
  strengthBars: {
    flexDirection: "row",
    gap: 4,
    flex: 1,
  },
  strengthBar: {
    flex: 1,
    height: 3,
    borderRadius: 99,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: "500",
    width: 48,
    textAlign: "right",
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
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  recoverBtn: {
    marginBottom: Spacing.md,
  },
  recoverText: {
    color: Colors.accent,
    fontSize: 13,
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
