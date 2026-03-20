import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";
import { Colors, Spacing, PHASE_COLORS, PHASE_LABELS } from "@/constants/theme";
import { getScoreHistory } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import type { CyclePhase } from "@/lib/api";

const BAR_MAX_HEIGHT = 80;
const FREE_DAYS_LIMIT = 14;
const PRO_DAYS_LIMIT = 30;

function ScoreBar({
  score,
  phase,
  date,
  showLabel,
  locked,
}: {
  score: number;
  phase: CyclePhase;
  date: string;
  showLabel: boolean;
  locked?: boolean;
}) {
  const height = Math.max(4, (score / 100) * BAR_MAX_HEIGHT);
  const d = new Date(date + "T12:00:00");
  const label = d.toLocaleDateString("pt-BR", { day: "numeric", month: "numeric" });
  return (
    <View style={styles.barWrapper}>
      <View
        style={[
          styles.bar,
          {
            height,
            backgroundColor: locked
              ? Colors.border
              : (PHASE_COLORS[phase] ?? Colors.accent),
            opacity: locked ? 0.4 : 1,
          },
        ]}
      />
      {showLabel && (
        <Text style={[styles.barLabel, locked && { color: Colors.textDisabled }]}>
          {label}
        </Text>
      )}
    </View>
  );
}

export default function HistoryScreen() {
  const { user } = useAuthStore();
  const isPro = user?.plan === "PRO" || user?.plan === "ELITE";
  const daysToFetch = isPro ? PRO_DAYS_LIMIT : FREE_DAYS_LIMIT;

  const { data, isLoading } = useQuery({
    queryKey: ["score", "history", daysToFetch],
    queryFn: () => getScoreHistory(daysToFetch),
  });

  const scores = data?.scores ?? [];
  const insights = data?.insights ?? [];

  const labelInterval = scores.length <= 7 ? 1 : scores.length <= 14 ? 2 : 3;

  const bestPhase = [...insights].sort((a, b) => b.avgScore - a.avgScore)[0];
  const worstPhase = [...insights].sort((a, b) => a.avgScore - b.avgScore)[0];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Histórico</Text>
          <Text style={styles.subtitle}>Seus padrões ao longo do tempo</Text>
        </View>
        {!isPro && (
          <TouchableOpacity
            style={styles.proBadge}
            onPress={() => router.push("/(tabs)/upgrade")}
          >
            <Text style={styles.proBadgeText}>Pro →</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Gráfico de barras */}
        <Text style={styles.sectionLabel}>
          SCORE — ÚLTIMOS {daysToFetch} DIAS
        </Text>
        <Card style={styles.chartCard}>
          {isLoading ? (
            <View style={{ height: BAR_MAX_HEIGHT + 20 }} />
          ) : scores.length === 0 ? (
            <Text style={styles.empty}>Sem dados ainda. Use o app por alguns dias!</Text>
          ) : (
            <View style={styles.chart}>
              {scores.map((s, i) => (
                <ScoreBar
                  key={i}
                  score={s.score}
                  phase={s.phase as CyclePhase}
                  date={s.date}
                  showLabel={i % labelInterval === 0 || i === scores.length - 1}
                />
              ))}
            </View>
          )}
        </Card>

        {/* Paywall para histórico extendido */}
        {!isPro && (
          <TouchableOpacity
            style={styles.upgradePrompt}
            onPress={() => router.push("/(tabs)/upgrade")}
            activeOpacity={0.85}
          >
            <Text style={styles.upgradePromptTitle}>✦ Desbloqueie 30 dias de histórico</Text>
            <Text style={styles.upgradePromptText}>
              Com o plano Pro você vê padrões completos do seu ciclo e treina com mais precisão.
            </Text>
            <Text style={styles.upgradePromptCta}>Ver planos →</Text>
          </TouchableOpacity>
        )}

        {/* Insights do ciclo */}
        {insights.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>INSIGHTS DO CICLO</Text>

            {bestPhase && (
              <Card>
                <Text style={styles.insightTitle}>Padrão identificado</Text>
                <Text style={styles.insightText}>
                  Seus melhores scores são na fase{" "}
                  <Text style={{ color: Colors.accent }}>
                    {PHASE_LABELS[bestPhase.phase as CyclePhase]}
                  </Text>
                  , com média de{" "}
                  <Text style={{ color: Colors.accent }}>
                    {bestPhase.avgScore}
                  </Text>{" "}
                  pontos ({bestPhase.sampleSize} dias registrados).
                </Text>
              </Card>
            )}

            {worstPhase && worstPhase.phase !== bestPhase?.phase && (
              <View style={styles.alertCard}>
                <Text
                  style={[
                    styles.alertTitle,
                    {
                      color:
                        PHASE_COLORS[worstPhase.phase as CyclePhase] ??
                        Colors.luteal,
                    },
                  ]}
                >
                  Fase {PHASE_LABELS[worstPhase.phase as CyclePhase]} — atenção
                </Text>
                <Text style={styles.alertText}>
                  Score médio de{" "}
                  <Text style={{ color: Colors.text }}>{worstPhase.avgScore}</Text>{" "}
                  nessa fase. Considere reduzir volume e priorizar recuperação.
                </Text>
              </View>
            )}

            <Text style={[styles.sectionLabel, { marginTop: 8 }]}>
              MÉDIA POR FASE
            </Text>
            {insights
              .sort((a, b) => b.avgScore - a.avgScore)
              .map((ins) => (
                <View key={ins.phase} style={styles.phaseRow}>
                  <View
                    style={[
                      styles.phaseDot,
                      {
                        backgroundColor:
                          PHASE_COLORS[ins.phase as CyclePhase] ?? Colors.accent,
                      },
                    ]}
                  />
                  <Text style={styles.phaseLabel}>
                    {PHASE_LABELS[ins.phase as CyclePhase]}
                  </Text>
                  <Text style={styles.phaseScore}>{ins.avgScore}</Text>
                  <View style={styles.phaseBarBg}>
                    <View
                      style={[
                        styles.phaseBarFill,
                        {
                          width: `${ins.avgScore}%`,
                          backgroundColor:
                            PHASE_COLORS[ins.phase as CyclePhase] ?? Colors.accent,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
          </>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.bgHeader,
  },
  title: {
    fontSize: 17,
    fontWeight: "500",
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  proBadge: {
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: Colors.accentDim,
  },
  proBadgeText: { fontSize: 12, color: Colors.accent, fontWeight: "500" },
  content: {
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  chartCard: {
    padding: 18,
    marginBottom: 16,
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: BAR_MAX_HEIGHT + 20,
    gap: 3,
    flex: 1,
  },
  barWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    height: BAR_MAX_HEIGHT + 20,
  },
  bar: {
    width: "100%",
    borderRadius: 3,
    minWidth: 4,
  },
  barLabel: {
    fontSize: 8,
    color: Colors.textDisabled,
    marginTop: 4,
    textAlign: "center",
  },
  empty: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    paddingVertical: 24,
  },
  upgradePrompt: {
    backgroundColor: Colors.accentDim,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    marginBottom: 20,
  },
  upgradePromptTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.accent,
    marginBottom: 6,
  },
  upgradePromptText: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 20,
    marginBottom: 10,
  },
  upgradePromptCta: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: "500",
  },
  insightTitle: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: "500",
    marginBottom: 5,
  },
  insightText: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 22,
  },
  alertCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.luteal,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
    marginBottom: 10,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 4,
  },
  alertText: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  phaseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  phaseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  phaseLabel: {
    fontSize: 13,
    color: Colors.text,
    width: 80,
  },
  phaseScore: {
    fontSize: 13,
    color: Colors.accent,
    width: 30,
    textAlign: "right",
  },
  phaseBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 99,
    overflow: "hidden",
  },
  phaseBarFill: {
    height: 4,
    borderRadius: 99,
  },
});
