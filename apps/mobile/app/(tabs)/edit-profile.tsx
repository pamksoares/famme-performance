import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Colors, Spacing, Radius } from "@/constants/theme";
import { updateUser, saveCycle, getCycle } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

type Modality = "CROSSFIT" | "HYROX" | "RUNNING" | "WEIGHTLIFTING";

const MODALITIES: Array<{ key: Modality; label: string }> = [
  { key: "CROSSFIT", label: "CrossFit" },
  { key: "HYROX", label: "Hyrox" },
  { key: "RUNNING", label: "Corrida" },
  { key: "WEIGHTLIFTING", label: "Musculação" },
];

export default function EditProfileScreen() {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();

  const [name, setName] = useState(user?.name ?? "");
  const [modality, setModality] = useState<Modality>(
    (user?.modality as Modality) ?? "CROSSFIT"
  );
  const [cycleLength, setCycleLength] = useState("28");
  const [cycleStartDate, setCycleStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const { data: cycle } = useQuery({
    queryKey: ["cycle"],
    queryFn: getCycle,
  });

  useEffect(() => {
    if (cycle) {
      setCycleLength(String(cycle.cycleLengthDays));
      setCycleStartDate(cycle.startDate.split("T")[0]);
    }
  }, [cycle]);

  const canSave = name.trim().length >= 2;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updatedUser = await updateUser({
        name: name.trim(),
        modality,
      });

      const days = parseInt(cycleLength, 10);
      if (!isNaN(days) && days >= 21 && days <= 35) {
        await saveCycle({ startDate: cycleStartDate, cycleLengthDays: days });
      }

      return updatedUser;
    },
    onSuccess: async (updatedUser) => {
      const token = await import("expo-secure-store").then((m) =>
        m.getItemAsync("access_token")
      );
      await setUser(updatedUser as any, token ?? "");
      queryClient.invalidateQueries({ queryKey: ["cycle"] });
      queryClient.invalidateQueries({ queryKey: ["score"] });
      Alert.alert("Salvo!", "Seu perfil foi atualizado.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (e: any) => {
      Alert.alert("Erro", e.message ?? "Não foi possível salvar. Tente novamente.");
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.topTitle}>Editar Perfil</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <Text style={styles.label}>NOME</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Seu nome"
            placeholderTextColor={Colors.textDim}
            autoCapitalize="words"
            autoCorrect={false}
          />

          <Text style={styles.label}>MODALIDADE PRINCIPAL</Text>
          <View style={styles.grid}>
            {MODALITIES.map((m) => (
              <TouchableOpacity
                key={m.key}
                style={[
                  styles.option,
                  modality === m.key && styles.optionSelected,
                ]}
                onPress={() => setModality(m.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.optionText,
                    modality === m.key && styles.optionTextSelected,
                  ]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>CICLO MENSTRUAL</Text>

          <Text style={styles.label}>INÍCIO DO ÚLTIMO CICLO (AAAA-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={cycleStartDate}
            onChangeText={setCycleStartDate}
            placeholder="2024-03-01"
            placeholderTextColor={Colors.textDim}
            keyboardType="numbers-and-punctuation"
          />

          <Text style={styles.label}>DURAÇÃO DO CICLO (DIAS)</Text>
          <View style={styles.cycleLengthRow}>
            {["21", "24", "25", "26", "27", "28", "29", "30", "31", "32", "35"].map(
              (d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.dayChip,
                    cycleLength === d && styles.dayChipSelected,
                  ]}
                  onPress={() => setCycleLength(d)}
                >
                  <Text
                    style={[
                      styles.dayChipText,
                      cycleLength === d && styles.dayChipTextSelected,
                    ]}
                  >
                    {d}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>

          <Button
            label="Salvar alterações"
            onPress={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            disabled={!canSave}
            style={{ marginTop: Spacing.xxl }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cancelText: { color: Colors.textMuted, fontSize: 15, width: 60 },
  topTitle: { fontSize: 15, fontWeight: "500", color: Colors.text },
  content: { padding: Spacing.xl, paddingBottom: 48 },
  sectionTitle: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.6,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
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
    marginBottom: Spacing.lg,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: Spacing.lg,
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderInput,
    backgroundColor: Colors.bgCard,
  },
  optionSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentDim,
  },
  optionText: { fontSize: 13, color: Colors.textMuted, fontWeight: "500" },
  optionTextSelected: { color: Colors.accent },
  cycleLengthRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: Spacing.md,
  },
  dayChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderInput,
    backgroundColor: Colors.bgCard,
  },
  dayChipSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentDim,
  },
  dayChipText: { fontSize: 13, color: Colors.textMuted },
  dayChipTextSelected: { color: Colors.accent },
});
