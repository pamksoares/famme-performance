import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { Colors, Spacing } from "@/constants/theme";
import { getTodayScore, getRecommendation } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

const DOT_COLORS = {
  green: Colors.green,
  yellow: Colors.yellow,
  red: Colors.red,
};

export default function TrainingScreen() {
  const { user } = useAuthStore();
  const isPro = user?.plan === "PRO" || user?.plan === "ELITE";

  const { data: score } = useQuery({
    queryKey: ["score", "today"],
    queryFn: getTodayScore,
  });

  const {
    data: rec,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["recommendation"],
    queryFn: getRecommendation,
    enabled: !!score && isPro,
    staleTime: 1000 * 60 * 60 * 6, // 6h cache
  });

  // Recomendação já em cache no score
  const cachedRec = score?.recommendation
    ? JSON.parse(score.recommendation)
    : null;

  const recommendation = rec ?? cachedRec;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Recomendação de hoje</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Classificação */}
        {isLoading && isPro ? (
          <View style={styles.loading}>
            <ActivityIndicator color={Colors.accent} />
            <Text style={styles.loadingText}>
              Analisando seus dados com IA...
            </Text>
          </View>
        ) : !isPro ? (
          <View style={styles.upgradeCard}>
            <Text style={styles.upgradeBadge}>PRO</Text>
            <Text style={styles.upgradeTitle}>
              Recomendações personalizadas
            </Text>
            <Text style={styles.upgradeText}>
              Faça upgrade para o plano Pro e receba recomendações geradas por IA
              baseadas no seu ciclo hormonal e dados do wearable.
            </Text>
          </View>
        ) : recommendation ? (
          <>
            <Card style={styles.classCard}>
              <View style={styles.classRow}>
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        DOT_COLORS[
                          recommendation.classification as keyof typeof DOT_COLORS
                        ] ?? Colors.accent,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.classTitle,
                    {
                      color:
                        DOT_COLORS[
                          recommendation.classification as keyof typeof DOT_COLORS
                        ] ?? Colors.accent,
                    },
                  ]}
                >
                  {recommendation.title}
                </Text>
              </View>
              <Text style={styles.rationale}>{recommendation.rationale}</Text>
            </Card>

            <Text style={styles.sectionLabel}>TREINO RECOMENDADO</Text>
            <Card>
              <Text style={styles.trainingType}>
                {recommendation.trainingType}
              </Text>
              <View style={styles.exercises}>
                {recommendation.exercises.map((ex: string) => (
                  <Pill key={ex} label={ex} variant="green" />
                ))}
              </View>
            </Card>

            <Text style={styles.sectionLabel}>RECUPERAÇÃO</Text>
            <Card>
              <Text style={styles.recoveryText}>{recommendation.recovery}</Text>
            </Card>

            {recommendation.alert && (
              <>
                <Text style={styles.sectionLabel}>ALERTA</Text>
                <View style={styles.alertCard}>
                  <Text style={styles.alertTitle}>
                    {recommendation.classification === "green"
                      ? "Janela de PR aberta"
                      : "Atenção"}
                  </Text>
                  <Text style={styles.alertText}>{recommendation.alert}</Text>
                </View>
              </>
            )}
          </>
        ) : score ? (
          // Score existe mas sem recomendação ainda
          <View style={styles.loading}>
            <Text style={styles.loadingText}>
              Nenhuma recomendação disponível para hoje.
            </Text>
          </View>
        ) : (
          <View style={styles.loading}>
            <Text style={styles.loadingText}>
              Registre seus dados na aba Início para ver a recomendação.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.bgHeader,
  },
  title: {
    fontSize: 17,
    fontWeight: "500",
    color: Colors.text,
  },
  content: {
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  loading: {
    paddingVertical: 48,
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: Spacing.xxl,
  },
  upgradeCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    alignItems: "center",
    gap: 12,
  },
  upgradeBadge: {
    backgroundColor: Colors.accentDim,
    color: Colors.accent,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    overflow: "hidden",
  },
  upgradeTitle: {
    fontSize: 17,
    fontWeight: "500",
    color: Colors.text,
    textAlign: "center",
  },
  upgradeText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  classCard: {
    borderColor: Colors.accentBorder,
    marginBottom: Spacing.md,
  },
  classRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  classTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  rationale: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 22,
  },
  sectionLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 12,
    marginTop: 8,
  },
  trainingType: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.text,
    marginBottom: 6,
  },
  exercises: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  recoveryText: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 22,
  },
  alertCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  alertTitle: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: "500",
    marginBottom: 4,
  },
  alertText: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 20,
  },
});
