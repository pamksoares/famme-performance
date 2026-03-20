import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation } from "@tanstack/react-query";
import Svg, { Path } from "react-native-svg";
import { Colors, Spacing, Radius } from "@/constants/theme";
import { createCheckout } from "@/lib/api";

type Plan = "PRO" | "ELITE";

const PLANS = [
  {
    key: "PRO" as Plan,
    name: "PRO",
    price: "R$ 19,90",
    period: "/mês",
    color: Colors.accent,
    features: [
      "Histórico completo de dados",
      "Insights mensais por fase",
      "Recomendação de IA ilimitada",
      "Notificações de fase e lembrete diário",
      "Sem anúncios",
    ],
  },
  {
    key: "ELITE" as Plan,
    name: "ELITE",
    price: "R$ 34,90",
    period: "/mês",
    color: Colors.yellow,
    badge: "Mais completo",
    features: [
      "Tudo do PRO",
      "Integração wearable prioritária",
      "Suporte prioritário via chat",
      "Acesso antecipado a novidades",
      "Relatório mensal em PDF",
    ],
  },
];

const TESTIMONIALS = [
  {
    name: "Ana P.",
    text: "Desde que comecei a treinar na minha fase folicular, melhorei muito. O app mudou minha relação com o treino!",
  },
  {
    name: "Juliana M.",
    text: "Parecia que eu era preguiçosa na fase lútea. Agora sei que é hormonal — e ajusto o treino. Incrível.",
  },
  {
    name: "Carolina S.",
    text: "A recomendação de IA é cirúrgica. Parei de me machucar tentando PR no dia errado.",
  },
];

function CheckIcon({ color = Colors.green }: { color?: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function UpgradeScreen() {
  const [selected, setSelected] = useState<Plan>("PRO");

  const mutation = useMutation({
    mutationFn: (plan: Plan) =>
      createCheckout({
        plan,
        successUrl: "femmeperformance://upgrade-success",
        cancelUrl: "femmeperformance://upgrade",
      }),
    onSuccess: ({ url }) => {
      Linking.openURL(url);
    },
    onError: () => {
      Alert.alert("Erro", "Não foi possível iniciar o checkout. Tente novamente.");
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityLabel="Voltar"
            accessibilityRole="button"
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M19 12H5M12 5l-7 7 7 7" stroke={Colors.text} strokeWidth={1.5} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Escolha seu plano</Text>
        </View>

        <View style={styles.tagline}>
          <Text style={styles.taglineText}>🌿 7 dias grátis · Cancele quando quiser</Text>
        </View>

        {/* Planos */}
        {PLANS.map((plan) => {
          const isSelected = selected === plan.key;
          return (
            <TouchableOpacity
              key={plan.key}
              style={[
                styles.planCard,
                isSelected && { borderColor: plan.color, backgroundColor: `${plan.color}0D` },
              ]}
              onPress={() => setSelected(plan.key)}
              accessibilityLabel={`Selecionar plano ${plan.name}`}
              accessibilityRole="button"
            >
              <View style={styles.planHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.planTitleRow}>
                    <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
                    {plan.badge && (
                      <View style={[styles.badge, { backgroundColor: `${plan.color}20` }]}>
                        <Text style={[styles.badgeText, { color: plan.color }]}>{plan.badge}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.planPriceRow}>
                    <Text style={styles.planPrice}>{plan.price}</Text>
                    <Text style={styles.planPeriod}>{plan.period}</Text>
                  </View>
                </View>
                <View style={[styles.radio, isSelected && { borderColor: plan.color }]}>
                  {isSelected && (
                    <View style={[styles.radioDot, { backgroundColor: plan.color }]} />
                  )}
                </View>
              </View>
              <View style={styles.featureList}>
                {plan.features.map((f, i) => (
                  <View key={i} style={styles.featureRow}>
                    <CheckIcon color={plan.color} />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Comparativo FREE */}
        <View style={styles.freeCard}>
          <Text style={styles.freeTitle}>Plano gratuito inclui:</Text>
          {["Histórico dos últimos 7 dias", "Score diário básico", "Acompanhamento de fase"].map((f) => (
            <View key={f} style={styles.featureRow}>
              <CheckIcon color={Colors.textMuted} />
              <Text style={[styles.featureText, { color: Colors.textMuted }]}>{f}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={styles.ctaWrap}>
          <TouchableOpacity
            style={[
              styles.ctaBtn,
              { backgroundColor: selected === "ELITE" ? Colors.yellow : Colors.accent },
            ]}
            onPress={() => mutation.mutate(selected)}
            disabled={mutation.isPending}
            accessibilityLabel={`Começar trial grátis do plano ${selected}`}
            accessibilityRole="button"
          >
            <Text style={styles.ctaBtnText}>
              {mutation.isPending ? "Aguarde..." : `Começar 7 dias grátis · ${selected}`}
            </Text>
          </TouchableOpacity>
          <Text style={styles.ctaDisclaimer}>
            Após o trial, cobramos automaticamente. Cancele a qualquer momento.
          </Text>
        </View>

        {/* Depoimentos */}
        <View style={styles.testimonials}>
          <Text style={styles.testimonialsTitle}>O QUE DIZEM AS USUÁRIAS</Text>
          {TESTIMONIALS.map((t, i) => (
            <View key={i} style={styles.testimonialCard}>
              <Text style={styles.testimonialText}>"{t.text}"</Text>
              <Text style={styles.testimonialName}>— {t.name}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.bgHeader,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1a1a18",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "500", color: Colors.text },
  tagline: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  taglineText: { fontSize: 14, color: Colors.textMuted },
  planCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: 14,
  },
  planHeader: { flexDirection: "row", alignItems: "flex-start" },
  planTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  planName: { fontSize: 18, fontWeight: "700" },
  badge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  planPriceRow: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  planPrice: { fontSize: 26, fontWeight: "700", color: Colors.text },
  planPeriod: { fontSize: 13, color: Colors.textMuted },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  featureList: { gap: 8 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { fontSize: 13, color: Colors.text, flex: 1 },
  freeCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    backgroundColor: "#111110",
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: 8,
  },
  freeTitle: { fontSize: 13, color: Colors.textMuted, fontWeight: "500", marginBottom: 4 },
  ctaWrap: { paddingHorizontal: Spacing.xl, gap: 12, marginBottom: Spacing.xl },
  ctaBtn: { borderRadius: Radius.full, paddingVertical: 16, alignItems: "center" },
  ctaBtnText: { fontSize: 15, fontWeight: "700", color: "#0a0a08" },
  ctaDisclaimer: { fontSize: 11, color: Colors.textDim, textAlign: "center" },
  testimonials: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl, gap: 12 },
  testimonialsTitle: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  testimonialCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: 8,
  },
  testimonialText: { fontSize: 13, color: Colors.text, lineHeight: 20, fontStyle: "italic" },
  testimonialName: { fontSize: 12, color: Colors.textMuted },
});
