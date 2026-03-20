import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store";
import { Card } from "@/components/ui/Card";
import { PaywallBanner } from "@/components/PaywallBanner";
import { Colors, Spacing, Radius } from "@/constants/theme";
import { getScoreHistory } from "@/lib/api";

const PHASE_LABELS: Record<string, string> = {
  MENSTRUAL: "Menstrual",
  FOLLICULAR: "Folicular",
  OVULATORY: "Ovulatória",
  LUTEAL: "Lútea",
};

const PHASE_COLORS: Record<string, string> = {
  MENSTRUAL: Colors.menstrual,
  FOLLICULAR: Colors.follicular,
  OVULATORY: Colors.ovulatory,
  LUTEAL: Colors.luteal,
};

function MiniBarChart({ data }: { data: Array<{ score: number; phase: string; date: string }> }) {
  if (data.length === 0) return null;
  const max = 100;

  return (
    <View style={chart.container}>
      {data.slice(-30).map((d, i) => (
        <View key={i} style={chart.barWrap}>
          <View
            style={[
              chart.bar,
              {
                height: Math.max(4, (d.score / max) * 80),
                backgroundColor: PHASE_COLORS[d.phase] ?? Colors.accent,
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const chart = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 90,
    gap: 2,
    paddingVertical: Spacing.sm,
  },
  barWrap: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  bar: { width: "100%", borderRadius: 2, minHeight: 4 },
});

export default function InsightsScreen() {
  const { user } = useAuthStore();
  const isPro = user?.plan === "PRO" || user?.plan === "ELITE";

  const { data: history } = useQuery({
    queryKey: ["history", 90],
    queryFn: () => getScoreHistory(90),
    enabled: isPro,
  });

  if (!isPro) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.title}>Insights mensais</Text>
        </View>
        <PaywallBanner
          message="Insights disponíveis no PRO"
          ctaLabel="Ver planos"
        />
      </SafeAreaView>
    );
  }

  const scores = history?.scores ?? [];
  const insights = history?.insights ?? [];

  const daysWithData = scores.length;
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b.score, 0) / scores.length)
      : 0;

  const sorted = [...insights].sort((a, b) => b.avgScore - a.avgScore);
  const bestPhase = sorted[0];
  const worstPhase = sorted[sorted.length - 1];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Insights mensais</Text>
          <Text style={styles.subtitle}>Últimos 90 dias</Text>
        </View>

        {/* Gráfico */}
        <Card style={styles.card}>
          <Text style={styles.cardLabel}>SCORE POR DIA</Text>
          <MiniBarChart
            data={scores.map((s) => ({
              score: s.score,
              phase: s.phase,
              date: s.date,
            }))}
          />
          <View style={styles.legend}>
            {Object.entries(PHASE_COLORS).map(([phase, color]) => (
              <View key={phase} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: color }]} />
                <Text style={styles.legendLabel}>{PHASE_LABELS[phase]}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Cards de insights por fase */}
        {insights.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SCORE MÉDIO POR FASE</Text>
            {insights.map((insight) => (
              <Card key={insight.phase} style={styles.phaseCard}>
                <View style={styles.phaseRow}>
                  <View style={[styles.phaseDot, { backgroundColor: PHASE_COLORS[insight.phase] ?? Colors.accent }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.phaseName}>{PHASE_LABELS[insight.phase] ?? insight.phase}</Text>
                    <Text style={styles.phaseSample}>{insight.sampleSize} registros</Text>
                  </View>
                  <Text
                    style={[
                      styles.phaseScore,
                      {
                        color:
                          insight.avgScore >= 75
                            ? Colors.green
                            : insight.avgScore >= 50
                            ? Colors.yellow
                            : Colors.red,
                      },
                    ]}
                  >
                    {Math.round(insight.avgScore)}
                  </Text>
                </View>
                <View style={styles.phaseBar}>
                  <View
                    style={[
                      styles.phaseBarFill,
                      {
                        width: `${insight.avgScore}%`,
                        backgroundColor: PHASE_COLORS[insight.phase] ?? Colors.accent,
                      },
                    ]}
                  />
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Destaques */}
        {bestPhase && worstPhase && bestPhase.phase !== worstPhase.phase && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DESTAQUES</Text>
            <Card style={[styles.highlightCard, { borderColor: "rgba(200,240,154,0.3)" }]}>
              <Text style={styles.highlightEmoji}>🏆</Text>
              <View>
                <Text style={styles.highlightTitle}>Melhor fase para treinar</Text>
                <Text style={styles.highlightValue}>
                  {PHASE_LABELS[bestPhase.phase]} · média {Math.round(bestPhase.avgScore)}
                </Text>
              </View>
            </Card>
            <Card style={[styles.highlightCard, { borderColor: "rgba(240,153,123,0.3)" }]}>
              <Text style={styles.highlightEmoji}>💤</Text>
              <View>
                <Text style={styles.highlightTitle}>Fase que pede mais cuidado</Text>
                <Text style={styles.highlightValue}>
                  {PHASE_LABELS[worstPhase.phase]} · média {Math.round(worstPhase.avgScore)}
                </Text>
              </View>
            </Card>
          </View>
        )}

        {/* Resumo */}
        <Card style={[styles.card, { marginBottom: Spacing.xxxl }]}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{daysWithData}</Text>
              <Text style={styles.statLabel}>dias com dados</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, {
                color: avgScore >= 75 ? Colors.green : avgScore >= 50 ? Colors.yellow : Colors.red
              }]}>
                {avgScore}
              </Text>
              <Text style={styles.statLabel}>score médio</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{insights.length}</Text>
              <Text style={styles.statLabel}>fases mapeadas</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.bgHeader,
  },
  title: { fontSize: 20, fontWeight: "500", color: Colors.text },
  subtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  card: { margin: Spacing.xl, marginBottom: 0 },
  cardLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, color: Colors.textMuted },
  section: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  sectionLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  phaseCard: { marginBottom: 8, gap: 10 },
  phaseRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  phaseDot: { width: 10, height: 10, borderRadius: 5 },
  phaseName: { fontSize: 14, fontWeight: "500", color: Colors.text },
  phaseSample: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  phaseScore: { fontSize: 22, fontWeight: "500" },
  phaseBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  phaseBarFill: { height: 4, borderRadius: 2 },
  highlightCard: {
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
  },
  highlightEmoji: { fontSize: 24 },
  highlightTitle: { fontSize: 12, color: Colors.textMuted },
  highlightValue: { fontSize: 14, fontWeight: "500", color: Colors.text, marginTop: 2 },
  statsRow: { flexDirection: "row", alignItems: "center" },
  statItem: { flex: 1, alignItems: "center", gap: 4 },
  statValue: { fontSize: 24, fontWeight: "500", color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textMuted },
  statDivider: { width: 1, height: 40, backgroundColor: Colors.border },
});
