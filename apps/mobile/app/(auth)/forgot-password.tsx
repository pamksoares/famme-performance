import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Colors, Spacing, Radius } from "@/constants/theme";
import { forgotPassword } from "@/lib/api";

type Step = "email" | "code";

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canSendEmail = email.includes("@");
  const canReset = code.length === 6 && newPassword.length >= 8;

  async function handleSendEmail() {
    setLoading(true);
    setError(null);
    try {
      await forgotPassword(email.trim().toLowerCase());
      setStep("code");
    } catch {
      setError("Não foi possível enviar o código. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    setLoading(true);
    setError(null);
    try {
      const { resetPassword } = await import("@/lib/api");
      await resetPassword({
        email: email.trim().toLowerCase(),
        code: code.trim(),
        newPassword,
      });
      setSuccess(true);
    } catch (e: any) {
      setError(e.message ?? "Código inválido ou expirado.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.title}>Senha redefinida!</Text>
          <Text style={styles.subtitle}>
            Sua senha foi atualizada com sucesso.
          </Text>
          <Button
            label="Ir para o login"
            onPress={() => router.replace("/(auth)/login")}
            style={{ marginTop: Spacing.xxl }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.inner}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>‹ Voltar</Text>
          </TouchableOpacity>

          {step === "email" ? (
            <>
              <Text style={styles.title}>Esqueceu a senha?</Text>
              <Text style={styles.subtitle}>
                Digite seu e-mail e enviaremos um código de 6 dígitos para
                redefinir sua senha.
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
                autoCorrect={false}
              />

              {error && <Text style={styles.error}>{error}</Text>}

              <Button
                label="Enviar código"
                onPress={handleSendEmail}
                loading={loading}
                disabled={!canSendEmail}
                style={{ marginTop: Spacing.xl }}
              />
            </>
          ) : (
            <>
              <Text style={styles.title}>Digite o código</Text>
              <Text style={styles.subtitle}>
                Enviamos um código de 6 dígitos para{" "}
                <Text style={{ color: Colors.accent }}>{email}</Text>.
              </Text>

              <Text style={styles.label}>CÓDIGO</Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="000000"
                placeholderTextColor={Colors.textDim}
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
              />

              <Text style={styles.label}>NOVA SENHA</Text>
              <TextInput
                style={styles.input}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor={Colors.textDim}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />

              {error && <Text style={styles.error}>{error}</Text>}

              <Button
                label="Redefinir senha"
                onPress={handleResetPassword}
                loading={loading}
                disabled={!canReset}
                style={{ marginTop: Spacing.xl }}
              />

              <TouchableOpacity
                style={styles.resend}
                onPress={() => {
                  setCode("");
                  setError(null);
                  handleSendEmail();
                }}
              >
                <Text style={styles.resendText}>Não recebi o código</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  inner: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xl,
    justifyContent: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xxl,
  },
  backBtn: {
    marginBottom: Spacing.xxl,
  },
  backText: {
    color: Colors.accent,
    fontSize: 15,
  },
  successIcon: {
    fontSize: 48,
    color: Colors.accent,
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 24,
    color: Colors.text,
    marginBottom: 10,
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
  codeInput: {
    fontSize: 24,
    letterSpacing: 8,
    textAlign: "center",
  },
  error: {
    color: Colors.menstrual,
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  resend: {
    alignItems: "center",
    marginTop: Spacing.xl,
    padding: 8,
  },
  resendText: {
    color: Colors.textMuted,
    fontSize: 13,
    textDecorationLine: "underline",
  },
});
