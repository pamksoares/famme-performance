import { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { Colors, Spacing, Radius } from "@/constants/theme";
import { getTodayScore, getTodayCheckIn, submitCheckIn } from "@/lib/api";
import type { CyclePhase } from "@/lib/api";

const PHASE_LABELS: Record<CyclePhase, string> = {
  MENSTRUAL: "Menstrual",
  FOLLICULAR: "Folicular",
  OVULATORY: "Ovulatória",
  LUTEAL: "Lútea",
};

const PHASE_COLORS: Record<CyclePhase, string> = {
  MENSTRUAL: Colors.menstrual,
  FOLLICULAR: Colors.follicular,
  OVULATORY: Colors.ovulatory,
  LUTEAL: Colors.luteal,
};

function scoreColor(score: number) {
  if (score >= 75) return Colors.green;
  if (score >= 50) return Colors.yellow;
  return Colors.red;
}

function EmojiScale({
  value,
  onChange,
  emojis,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  emojis: string[];
  label: string;
}) {
  return (
    <View style={styles.scaleWrap}>
      <Text style={styles.scaleLabel}>{label}</Text>
      <View style={styles.scaleRow}>
        {emojis.map((emoji, i) => {
          const v = i + 1;
          const selected = value === v;
          return (
            <TouchableOpacity
              key={v}
              style={[styles.scaleBtn, selected && styles.scaleBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChange(v);
              }}
              accessibilityLabel={`${label} ${v}`}
              accessibilityRole="button"
            >
              <Text style={styles.scaleEmoji}>{emoji}</Text>
              {selected && <View style={styles.scaleDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function CheckInScreen() {
  const queryClient = useQueryClient();
  const notesRef = useRef<TextInput>(null);

  const [energy, setEnergy] = useState(3);
  const [mood, setMood] = useState(3);
  const [pain, setPain] = useState(false);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [notes, setNotes] = useState("");
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" as const });

  const { data: score } = useQuery({
    queryKey: ["score", "today"],
    queryFn: getTodayScore,
  });

  const { data: existingCheckIn } = useQuery({
    queryKey: ["checkin", "today"],
    queryFn: getTodayCheckIn,
  });

  const mutation = useMutation({
    mutationFn: submitCheckIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkin"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setToast({ visible: true, message: "Check-in salvo ✓", type: "success" });
      setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500);
    },
    onError: () => {
      setToast({ visible: true, message: "Erro ao salvar", type: "error" });
      setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500);
    },
  });

  const todayLabel = () => {
    return new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.dateLabel}>{todayLabel()}</Text>
            <Text style={styles.title}>Check-in diário</Text>
          </View>

          {/* Score mini card */}
          {score && (
            <Card style={styles.scoreCard}>
              <View style={styles.scoreRow}>
                <View>
                  <Text style={[styles.phasePill, { color: PHASE_COLORS[score.phase as CyclePhase] }]}>
                    {PHASE_LABELS[score.phase as CyclePhase]} · Dia {score.cycleDay}
                  </Text>
                  <Text style={styles.scoreLabel}>Score de hoje</Text>
                </View>
                <Text style={[styles.scoreValue, { color: scoreColor(score.score) }]}>
                  {score.score}
                </Text>
              </View>
            </Card>
          )}

          {existingCheckIn && (
            <View style={styles.savedBadge}>
              <Text style={styles.savedText}>✓ Check-in de hoje já registrado</Text>
            </View>
          )}

          {/* Formulário */}
          <Card style={styles.formCard}>
            <EmojiScale
              label="Energia"
              value={energy}
              onChange={setEnergy}
              emojis={["⚡", "⚡", "⚡", "⚡", "⚡"]}
            />
            <View style={styles.divider} />

            <EmojiScale
              label="Humor"
              value={mood}
              onChange={setMood}
              emojis={["😔", "😕", "😐", "🙂", "😊"]}
            />
            <View style={styles.divider} />

            <View style={styles.scaleWrap}>
              <Text style={styles.scaleLabel}>Dor ou desconforto</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleBtn, !pain && styles.toggleBtnActive]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPain(false); }}
                  accessibilityLabel="Sem dor"
                  accessibilityRole="button"
                >
                  <Text style={[styles.toggleText, !pain && styles.toggleTextActive]}>Não</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, pain && styles.toggleBtnPain]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPain(true); }}
                  accessibilityLabel="Com dor"
                  accessibilityRole="button"
                >
                  <Text style={[styles.toggleText, pain && styles.toggleTextPain]}>Sim</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.divider} />

            <EmojiScale
              label="Qualidade do sono"
              value={sleepQuality}
              onChange={setSleepQuality}
              emojis={["🌙", "🌙", "🌙", "🌙", "🌙"]}
            />
            <View style={styles.divider} />

            <View style={styles.scaleWrap}>
              <Text style={styles.scaleLabel}>Nota livre (opcional)</Text>
              <TextInput
                ref={notesRef}
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Como você está se sentindo hoje?"
                placeholderTextColor={Colors.textDim}
                multiline
                numberOfLines={3}
                maxLength={500}
                accessibilityLabel="Nota livre"
              />
            </View>
          </Card>

          <View style={styles.btnWrap}>
            <Button
              label={mutation.isPending ? "Salvando..." : "Salvar check-in"}
              onPress={() =>
                mutation.mutate({ energy, mood, pain, sleepQuality, notes: notes.trim() || undefined })
              }
              disabled={mutation.isPending}
              accessibilityLabel="Salvar check-in"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
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
  dateLabel: {
    fontSize: 11,
    color: Colors.textDim,
    letterSpacing: 0.3,
    marginBottom: 4,
    textTransform: "capitalize",
  },
  title: { fontSize: 20, fontWeight: "500", color: Colors.text },
  scoreCard: { margin: Spacing.xl, marginBottom: 0 },
  scoreRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  phasePill: { fontSize: 13, fontWeight: "500", marginBottom: 4 },
  scoreLabel: { fontSize: 11, color: Colors.textMuted },
  scoreValue: { fontSize: 36, fontWeight: "500" },
  savedBadge: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    backgroundColor: "rgba(200,240,154,0.1)",
    borderRadius: Radius.full,
    paddingVertical: 8,
    paddingHorizontal: Spacing.lg,
    alignSelf: "flex-start",
  },
  savedText: { fontSize: 12, color: Colors.green },
  formCard: { margin: Spacing.xl, gap: 0 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 16 },
  scaleWrap: { gap: 10 },
  scaleLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: "500" },
  scaleRow: { flexDirection: "row", gap: 8 },
  scaleBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  scaleBtnActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentDim,
  },
  scaleEmoji: { fontSize: 20 },
  scaleDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
  toggleRow: { flexDirection: "row", gap: 8 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  toggleBtnActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentDim,
  },
  toggleBtnPain: {
    borderColor: Colors.red,
    backgroundColor: "rgba(240,153,123,0.1)",
  },
  toggleText: { fontSize: 14, color: Colors.textMuted, fontWeight: "500" },
  toggleTextActive: { color: Colors.accent },
  toggleTextPain: { color: Colors.red },
  notesInput: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderInput,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
  },
  btnWrap: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl },
});
