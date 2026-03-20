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
import { PaywallBanner } from "@/components/PaywallBanner";
import { Colors, Spacing, Radius } from "@/constants/theme";
import { getTodayScore, getRecommendation } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

const INTENSITY_COLORS = {
  LEVE: Colors.luteal,
  MODERADO: Colors.yellow,
  INTENSO: Colors.green,
};

const INTENSITY_LABELS = {
  LEVE: "Leve",
  MODERADO: "Moderado",
  INTENSO: "Intenso",
};

const CLASS_COLORS = {
  green: Colors.green,
  yellow: Colors.yellow,
  red: Colors.red,
};

// Suporte para novo formato (titulo/treino) e antigo (title/trainingType)
function normalize(rec: Record<string, unknown>) {
  return {
    classification: (rec.classification as string) ?? "green",
    titulo: (rec.titulo ?? rec.title ?? "Recomendação de hoje") as string,
    intensidade: (rec.intensidade ?? "MODERADO") as "LEVE" | "MODERADO" | "INTENSO",
    treino: (rec.treino ?? rec.trainingType ?? "") as string,
    recuperacao: (rec.recuperacao ?? rec.recovery ?? "") as string,
    alerta: (rec.alerta ?? rec.alert ?? null) as string | null,
    motivacao: (rec.motivacao ?? "") as string,
  };
}

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
  } = useQuery({
    queryKey: ["recommendation"],
    queryFn: getRecommendation,
    enabled: !!score && isPro,
    staleTime: 1000 * 60 * 60 * 6,
  });

  const cachedRaw = score?.recommendation
    ? (() => { try { return JSON.parse(score.recommendation); } catch { return null; } })()
    : null;

  const rawRec = rec ?? cachedRaw;
  const recommendation = rawRec ? normalize(rawRec) : null;

  const intensityColor = recommendation
    ? INTENSITY_COLORS[recommendation.intensidade] ?? Colors.accent
    : Colors.accent;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Recomendação de hoje</Text>
        {recommendation && (
          <View style={[styles.intensityBadge, { backgroundColor: `${intensityColor}20`, borderColor: `${intensityColor}50` }]}>
            <Text style={[styles.intensityText, { color: intensityColor }]}>
              {INTENSITY_LABELS[recommendation.intensidade]}
            </Text>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {isLoading && isPro ? (
          <View style={styles.loading}>
            <ActivityIndicator color={Colors.accent} />
            <Text style={styles.loadingText}>Analisando seus dados com IA...</Text>
          </View>
        ) : !isPro ? (
          <PaywallBanner
            message="Recomendações de IA são PRO"
            ctaLabel="Desbloquear PRO"
          />
        ) : recommendation ? (
          <>
            {/* Título principal */}
            <Card style={[styles.mainCard, { borderLeftColor: CLASS_COLORS[recommendation.classification as keyof typeof CLASS_COLORS] ?? Colors.accent }]}>
              <View style={styles.titleRow}>
                <View style={[styles.dot, { backgroundColor: CLASS_COLORS[recommendation.classification as keyof typeof CLASS_COLORS] ?? Colors.accent }]} />
                <Text style={styles.recTitle}>{recommendation.titulo}</Text>
              </View>
              {recommendation.motivacao ? (
                <Text style={styles.motivacao}>"{recommendation.motivacao}"</Text>
              ) : null}
            </Card>

            {/* Treino */}
            {recommendation.treino ? (
              <>
                <Text style={styles.sectionLabel}>TREINO RECOMENDADO</Text>
                <Card>
                  <Text style={styles.treinoText}>{recommendation.treino}</Text>
                </Card>
              </>
            ) : null}

            {/* Recuperação */}
            {recommendation.recuperacao ? (
              <>
                <Text style={styles.sectionLabel}>RECUPERAÇÃO</Text>
                <Card>
                  <Text style={styles.recoveryText}>{recommendation.recuperacao}</Text>
                </Card>
              </>
            ) : null}

            {/* Alerta */}
            {recommendation.alerta ? (
              <>
                <Text style={styles.sectionLabel}>ALERTA</Text>
                <View style={styles.alertCard}>
                  <Text style={styles.alertText}>{recommendation.alerta}</Text>
                </View>
              </>
            ) : null}
          </>
        ) : score ? (
          <View style={styles.loading}>
            <Text style={styles.loadingText}>Nenhuma recomendação disponível para hoje.</Text>
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
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.bgHeader,
  },
  title: { fontSize: 17, fontWeight: "500", color: Colors.text },
  intensityBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
  },
  intensityText: { fontSize: 12, fontWeight: "600" },
  content: { padding: Spacing.xl, paddingBottom: 40 },
  loading: { paddingVertical: 48, alignItems: "center", gap: 16 },
  loadingText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: Spacing.xxl,
  },
  mainCard: {
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    gap: 8,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  recTitle: { fontSize: 16, fontWeight: "500", color: Colors.text, flex: 1 },
  motivacao: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: "italic",
    lineHeight: 20,
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 12,
    marginTop: 8,
  },
  treinoText: { fontSize: 14, color: Colors.text, lineHeight: 22 },
  recoveryText: { fontSize: 13, color: Colors.textMuted, lineHeight: 22 },
  alertCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.yellow,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  alertText: { fontSize: 13, color: Colors.textMuted, lineHeight: 20 },
});
