import { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Share,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Svg, { Path } from "react-native-svg";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { PhaseBar } from "@/components/PhaseBar";
import { MetricCard } from "@/components/MetricCard";
import { Colors, Spacing, PHASE_LABELS } from "@/constants/theme";
import { getTodayScore, submitScore } from "@/lib/api";
import { syncHealthData } from "@/lib/health";
import { useAuthStore } from "@/lib/store";
import type { CyclePhase } from "@/lib/api";

const PHASE_PILL_VARIANT: Record<CyclePhase, "green" | "purple" | "amber" | "coral"> = {
  FOLLICULAR: "green",
  OVULATORY: "amber",
  LUTEAL: "purple",
  MENSTRUAL: "coral",
};

function scoreColor(score: number): string {
  if (score >= 75) return Colors.green;
  if (score >= 50) return Colors.yellow;
  return Colors.red;
}

function scoreEmoji(score: number): string {
  if (score >= 75) return "🟢";
  if (score >= 50) return "🟡";
  return "🔴";
}

export default function HomeScreen() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const {
    data: score,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["score", "today"],
    queryFn: getTodayScore,
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const health = await syncHealthData();
      if (health && Object.keys(health).length > 0) {
        return submitScore(health);
      }
      return submitScore({});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["score"] });
    },
  });

  useEffect(() => {
    if (!score) {
      syncMutation.mutate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleShareScore() {
    if (!score) return;
    const phase = PHASE_LABELS[score.phase as CyclePhase];
    const emoji = scoreEmoji(score.score);
    const message = [
      `${emoji} Score Femme Performance: ${score.score}/100`,
      `Fase ${phase} · Dia ${score.cycleDay} do ciclo`,
      "",
      "Treine com o seu ciclo a favor. 💚",
      "femmeperformance.app",
    ].join("\n");

    try {
      await Share.share({ message });
    } catch {
      Alert.alert("Erro", "Não foi possível compartilhar.");
    }
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  const todayLabel = () => {
    const now = new Date();
    return now.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.accent}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.dateLabel}>{todayLabel()}</Text>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.name} numberOfLines={1}>{user?.name ?? "—"}</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn} onPress={() => router.push("/(tabs)/settings")}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                stroke={Colors.accent}
                strokeWidth={1.5}
              />
              <Path
                d="M13.73 21a2 2 0 0 1-3.46 0"
                stroke={Colors.accent}
                strokeWidth={1.5}
              />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Score card */}
        {isLoading || syncMutation.isPending ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={Colors.accent} />
            <Text style={styles.loadingText}>Calculando seu score...</Text>
          </View>
        ) : score ? (
          <Card style={styles.scoreCard}>
            <View style={styles.scoreRow}>
              <View>
                <Pill
                  label={PHASE_LABELS[score.phase as CyclePhase]}
                  variant={PHASE_PILL_VARIANT[score.phase as CyclePhase]}
                />
                <Text style={styles.cycleDay}>
                  Dia {score.cycleDay} do ciclo
                </Text>
              </View>
              <View style={styles.scoreRight}>
                <View style={styles.scoreNum}>
                  <Text
                    style={[
                      styles.scoreValue,
                      { color: scoreColor(score.score) },
                    ]}
                  >
                    {score.score}
                  </Text>
                  <Text style={styles.scoreLabel}>score hoje</Text>
                </View>
                <TouchableOpacity
                  style={styles.shareBtn}
                  onPress={handleShareScore}
                  activeOpacity={0.7}
                >
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"
                      stroke={Colors.accent}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
              </View>
            </View>
            <PhaseBar currentPhase={score.phase as CyclePhase} />
            {score.streakDays != null && score.streakDays >= 2 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>🔥 {score.streakDays} dias seguidos</Text>
              </View>
            )}
          </Card>
        ) : (
          <Card style={styles.scoreCard}>
            <Text style={styles.noScore}>
              Não foi possível calcular o score. Configure seu ciclo em
              Configurações.
            </Text>
          </Card>
        )}

        {/* Métricas do dia */}
        {score && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SEUS DADOS HOJE</Text>
            <View style={styles.metrics}>
              <MetricCard
                value={score.sleepHours != null ? `${score.sleepHours}h` : "—"}
                label="sono"
              />
              <MetricCard
                value={score.hrv != null ? String(score.hrv) : "—"}
                label="HRV"
              />
              <MetricCard
                value={
                  score.restingHeartRate != null
                    ? String(score.restingHeartRate)
                    : "—"
                }
                label="FC repouso"
              />
            </View>
          </View>
        )}

        {/* CTA Recomendação */}
        {score && (
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/training")}
            activeOpacity={0.8}
          >
            <Card style={styles.recCard}>
              <View style={styles.recRow}>
                <View>
                  <Text style={styles.recLabel}>RECOMENDAÇÃO DE HOJE</Text>
                  <Text style={styles.recTitle}>
                    {score.recommendation
                      ? (() => {
                          try {
                            return JSON.parse(score.recommendation).title;
                          } catch {
                            return "Ver recomendação";
                          }
                        })()
                      : "Ver recomendação"}
                  </Text>
                  <Text style={styles.recSub}>
                    {PHASE_LABELS[score.phase as CyclePhase]} · Score {score.score}
                  </Text>
                </View>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M9 18l6-6-6-6"
                    stroke={Colors.accent}
                    strokeWidth={2}
                  />
                </Svg>
              </View>
            </Card>
          </TouchableOpacity>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.bgHeader,
  },
  dateLabel: {
    fontSize: 11,
    color: Colors.textDim,
    letterSpacing: 0.3,
    marginBottom: 4,
    textTransform: "capitalize",
  },
  greeting: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  name: {
    fontSize: 20,
    fontWeight: "500",
    color: Colors.text,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accentDim,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingCard: {
    margin: Spacing.xl,
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  scoreCard: {
    margin: Spacing.xl,
    marginBottom: 0,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  cycleDay: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
  },
  scoreRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  scoreNum: {
    alignItems: "flex-end",
  },
  scoreValue: {
    fontSize: 38,
    fontWeight: "500",
    lineHeight: 44,
  },
  scoreLabel: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  shareBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  noScore: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  sectionLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  metrics: {
    flexDirection: "row",
    gap: 8,
  },
  recCard: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.md,
  },
  recRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 5,
    letterSpacing: 0.6,
  },
  recTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.text,
  },
  recSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 3,
  },
  streakBadge: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "rgba(239,159,39,0.12)",
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(239,159,39,0.3)",
  },
  streakText: {
    fontSize: 12,
    color: Colors.yellow,
    fontWeight: "500",
  },
});
