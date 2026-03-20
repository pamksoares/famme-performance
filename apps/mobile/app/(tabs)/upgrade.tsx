import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Colors, Spacing, Radius } from "@/constants/theme";
import { createCheckout } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

type PlanKey = "PRO" | "ELITE";

const PLANS = [
  {
    key: "PRO" as PlanKey,
    name: "Pro",
    price: "R$ 29/mês",
    color: Colors.accent,
    features: [
      "Recomendações de treino com IA",
      "Histórico completo (30 dias)",
      "Até 2 wearables conectados",
      "Score diário com detalhes",
      "Alertas de mudança de fase",
    ],
  },
  {
    key: "ELITE" as PlanKey,
    name: "Elite",
    price: "R$ 59/mês",
    color: Colors.ovulatory,
    features: [
      "Tudo do Pro",
      "Histórico ilimitado",
      "Até 3 wearables conectados",
      "Análise de tendências avançada",
      "Suporte prioritário",
      "Relatório mensal em PDF",
    ],
  },
];

const FREE_LIMITS = [
  "Histórico de 14 dias",
  "Score básico sem detalhes de IA",
  "1 wearable conectado",
];

export default function UpgradeScreen() {
  const { user } = useAuthStore();
  const [selected, setSelected] = useState<PlanKey>("PRO");

  const checkoutMutation = useMutation({
    mutationFn: () =>
      createCheckout({
        plan: selected,
        successUrl: "famme://upgrade/success",
        cancelUrl: "famme://upgrade",
      }),
    onSuccess: async ({ url }) => {
      await Linking.openURL(url);
    },
    onError: (e: any) => {
      Alert.alert(
        "Erro",
        e.message ?? "Não foi possível abrir o checkout. Tente novamente."
      );
    },
  });

  if (user?.plan !== "FREE") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.alreadyPro}>
          <Text style={styles.checkmark}>✦</Text>
          <Text style={styles.alreadyTitle}>
            Você já é {user?.plan === "PRO" ? "Pro" : "Elite"}!
          </Text>
          <Text style={styles.alreadySub}>
            Aproveite todos os recursos premium da Femme Performance.
          </Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Upgrade</Text>
          <Text style={styles.subtitle}>
            Treine com dados reais do seu ciclo hormonal.
          </Text>
        </View>

        {/* Plano atual */}
        <View style={styles.freeCard}>
          <Text style={styles.freePlanLabel}>PLANO GRATUITO — LIMITAÇÕES</Text>
          {FREE_LIMITS.map((l) => (
            <View key={l} style={styles.limitRow}>
              <Text style={styles.limitDot}>·</Text>
              <Text style={styles.limitText}>{l}</Text>
            </View>
          ))}
        </View>

        {/* Seleção de plano */}
        <Text style={styles.sectionLabel}>ESCOLHA SEU PLANO</Text>
        {PLANS.map((plan) => {
          const isSelected = selected === plan.key;
          return (
            <TouchableOpacity
              key={plan.key}
              style={[
                styles.planCard,
                isSelected && {
                  borderColor: plan.color,
                  backgroundColor: `${plan.color}10`,
                },
              ]}
              onPress={() => setSelected(plan.key)}
              activeOpacity={0.8}
            >
              <View style={styles.planHeader}>
                <View>
                  <Text style={[styles.planName, isSelected && { color: plan.color }]}>
                    {plan.name}
                  </Text>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    isSelected && { borderColor: plan.color, backgroundColor: plan.color },
                  ]}
                >
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </View>

              <View style={styles.divider} />

              {plan.features.map((f) => (
                <View key={f} style={styles.featureRow}>
                  <Text style={[styles.featureCheck, { color: plan.color }]}>✓</Text>
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </TouchableOpacity>
          );
        })}

        {/* CTA */}
        <TouchableOpacity
          style={[
            styles.ctaBtn,
            checkoutMutation.isPending && { opacity: 0.6 },
          ]}
          onPress={() => checkoutMutation.mutate()}
          disabled={checkoutMutation.isPending}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>
            {checkoutMutation.isPending
              ? "Abrindo checkout..."
              : `Assinar ${selected === "PRO" ? "Pro — R$ 29/mês" : "Elite — R$ 59/mês"}`}
          </Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          Cancele quando quiser. Sem multa ou fidelidade.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl, paddingBottom: 48 },
  header: { marginBottom: Spacing.xl },
  closeBtn: {
    alignSelf: "flex-end",
    padding: 8,
    marginBottom: Spacing.md,
  },
  closeText: { fontSize: 16, color: Colors.textMuted },
  title: {
    fontSize: 28,
    fontFamily: "serif",
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: { fontSize: 14, color: Colors.textMuted, lineHeight: 22 },
  freeCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  freePlanLabel: {
    fontSize: 10,
    color: Colors.textDim,
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  limitRow: { flexDirection: "row", gap: 8, marginBottom: 5 },
  limitDot: { color: Colors.textDim, fontSize: 14, lineHeight: 20 },
  limitText: { fontSize: 13, color: Colors.textMuted, flex: 1 },
  sectionLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  planCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  planName: { fontSize: 18, fontWeight: "600", color: Colors.text },
  planPrice: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.bg,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 14,
  },
  featureRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  featureCheck: { fontSize: 13, fontWeight: "700", width: 14 },
  featureText: { fontSize: 13, color: Colors.textMuted, flex: 1, lineHeight: 20 },
  ctaBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  ctaText: { fontSize: 15, fontWeight: "700", color: Colors.bg },
  terms: {
    fontSize: 11,
    color: Colors.textDisabled,
    textAlign: "center",
  },
  alreadyPro: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xxl,
  },
  checkmark: { fontSize: 40, color: Colors.accent, marginBottom: Spacing.xl },
  alreadyTitle: {
    fontSize: 22,
    fontFamily: "serif",
    color: Colors.text,
    marginBottom: 10,
  },
  alreadySub: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },
  backBtn: { padding: 12 },
  backText: { color: Colors.accent, fontSize: 15 },
});
