import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Colors, Spacing, Radius } from "@/constants/theme";
import { login } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export default function LoginScreen() {
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.includes("@") && password.length >= 8;

  async function handleLogin() {
    setLoading(true);
    setError(null);
    try {
      const { user, accessToken } = await login({ email, password });
      await setUser(user, accessToken);
      router.replace("/(tabs)/");
    } catch (e: any) {
      setError(e.message ?? "Erro ao entrar. Verifique suas credenciais.");
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
        <View style={{ flex: 1, justifyContent: "center" }}>
          <Text style={styles.title}>Bem-vinda de volta</Text>
          <Text style={styles.subtitle}>
            Entre com sua conta Femme Performance.
          </Text>

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
            placeholder="Sua senha"
            placeholderTextColor={Colors.textDim}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Button
            label="Entrar"
            onPress={handleLogin}
            loading={loading}
            disabled={!canSubmit}
            style={{ marginTop: Spacing.xl }}
          />

          <TouchableOpacity
            style={styles.back}
            onPress={() => router.replace("/(auth)/onboarding/")}
          >
            <Text style={styles.backText}>Criar uma conta</Text>
          </TouchableOpacity>
        </View>
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
  error: {
    color: Colors.menstrual,
    fontSize: 13,
    marginTop: 4,
  },
  back: {
    alignItems: "center",
    marginTop: Spacing.xl,
    padding: 8,
  },
  backText: {
    color: Colors.accent,
    fontSize: 14,
  },
});
