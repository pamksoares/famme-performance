import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Linking } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Toggle } from "@/components/ui/Toggle";
import { Colors, Spacing, Radius, MODALITY_LABELS } from "@/constants/theme";
import {
  logout,
  getGarminStatus,
  getGarminConnectUrl,
  disconnectGarmin,
} from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import {
  requestNotificationPermissions,
  scheduleDailyScoreNotification,
  cancelDailyScoreNotification,
} from "@/lib/notifications";
import { requestAndReadHealth } from "@/lib/health";

const PLAN_LABELS = { FREE: "Gratuito", PRO: "Pro", ELITE: "Elite" };

export default function SettingsScreen() {
  const { user, clearUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [dailyNotif, setDailyNotif] = useState(true);
  const [cycleNotif, setCycleNotif] = useState(true);
  const [appleConnected, setAppleConnected] = useState(false);

  // Status Garmin
  const { data: garminStatus, isLoading: garminLoading } = useQuery({
    queryKey: ["garmin", "status"],
    queryFn: getGarminStatus,
    retry: false,
  });

  const garminConnected = garminStatus?.connected ?? false;

  // Conectar Garmin
  const connectGarminMutation = useMutation({
    mutationFn: async () => {
      const { url } = await getGarminConnectUrl();
      await Linking.openURL(url);
    },
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["garmin"] });
      }, 3000);
    },
    onError: () => {
      Alert.alert("Erro", "Não foi possível conectar com o Garmin. Tente novamente.");
    },
  });

  // Desconectar Garmin
  const disconnectGarminMutation = useMutation({
    mutationFn: disconnectGarmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["garmin"] });
    },
  });

  function handleGarminPress() {
    if (garminConnected) {
      Alert.alert(
        "Desconectar Garmin",
        "Deseja remover a integração com o Garmin Connect?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Desconectar",
            style: "destructive",
            onPress: () => disconnectGarminMutation.mutate(),
          },
        ]
      );
    } else {
      connectGarminMutation.mutate();
    }
  }

  async function handleToggleApple(enabled: boolean) {
    if (enabled) {
      const data = await requestAndReadHealth();
      setAppleConnected(data != null);
      if (!data) {
        if (Platform.OS === "android") {
          Alert.alert(
            "Permissão necessária",
            "Instale o Health Connect (Google Play) e conecte o Garmin Connect ou outro app de saúde."
          );
        } else {
          Alert.alert(
            "Permissão necessária",
            "Ative o acesso ao Apple Health nas Configurações do iPhone."
          );
        }
      }
    } else {
      setAppleConnected(false);
    }
  }

  async function handleToggleDailyNotif(enabled: boolean) {
    setDailyNotif(enabled);
    if (enabled) {
      const granted = await requestNotificationPermissions();
      if (granted) {
        await scheduleDailyScoreNotification();
      } else {
        setDailyNotif(false);
        Alert.alert(
          "Permissão necessária",
          "Ative as notificações nas Configurações do iPhone."
        );
      }
    } else {
      await cancelDailyScoreNotification();
    }
  }

  async function handleLogout() {
    Alert.alert("Sair", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await logout().catch(() => null);
          await clearUser();
          router.replace("/(auth)/onboarding/");
        },
      },
    ]);
  }

  const initials = user?.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const garminLastSync = garminStatus?.lastSyncedAt
    ? new Date(garminStatus.lastSyncedAt).toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Configurações</Text>
        <Text style={styles.subtitle}>Perfil e integrações</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Perfil */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName} numberOfLines={1}>{user?.name}</Text>
            <Text style={styles.profileSub}>
              {MODALITY_LABELS[user?.modality ?? "CROSSFIT"]} ·{" "}
              <Text style={{ color: Colors.accent }}>
                {PLAN_LABELS[user?.plan ?? "FREE"]}
              </Text>
            </Text>
          </View>
        </View>

        {/* Upgrade */}
        {user?.plan === "FREE" && (
          <TouchableOpacity style={styles.upgradeCard} activeOpacity={0.8}>
            <Text style={styles.upgradeTitle}>Fazer upgrade para Pro — R$29/mês</Text>
            <Text style={styles.upgradeText}>
              Recomendações de IA, histórico completo, 3 wearables
            </Text>
          </TouchableOpacity>
        )}

        {/* Integrações */}
        <Text style={styles.sectionLabel}>INTEGRAÇÕES</Text>

        {/* Apple Health (iOS) / Health Connect (Android) */}
        <View style={styles.intCard}>
          <View style={[styles.intIcon, { backgroundColor: "#1a1a1a" }]}>
            <Text>{Platform.OS === "android" ? "🏃" : "📱"}</Text>
          </View>
          <View style={styles.intInfo}>
            <Text style={styles.intName}>
              {Platform.OS === "android" ? "Health Connect" : "Apple Health"}
            </Text>
            <Text style={styles.intStatus}>
              {Platform.OS === "android"
                ? "Garmin, Samsung Health e mais"
                : "Sono · HRV · FC repouso"}
            </Text>
            <Text
              style={[
                styles.intStatus,
                { color: appleConnected ? Colors.accent : Colors.textMuted },
              ]}
            >
              {appleConnected ? "Conectado" : "Não conectado"}
            </Text>
          </View>
          <Toggle value={appleConnected} onToggle={handleToggleApple} />
        </View>

        {/* Garmin Connect */}
        <TouchableOpacity
          style={styles.intCard}
          onPress={handleGarminPress}
          activeOpacity={0.75}
          disabled={garminLoading || connectGarminMutation.isPending || disconnectGarminMutation.isPending}
        >
          <View style={[styles.intIcon, { backgroundColor: "#0a1a0f" }]}>
            <Text>⌚</Text>
          </View>
          <View style={styles.intInfo}>
            <Text style={styles.intName}>Garmin Connect</Text>
            <Text
              style={[
                styles.intStatus,
                { color: garminConnected ? Colors.accent : Colors.textMuted },
              ]}
            >
              {garminLoading
                ? "Verificando..."
                : garminConnected
                ? garminLastSync
                  ? `Sincronizado ${garminLastSync}`
                  : "Conectado"
                : "Toque para conectar"}
            </Text>
          </View>
          {connectGarminMutation.isPending || disconnectGarminMutation.isPending ? (
            <ActivityIndicator size="small" color={Colors.accent} />
          ) : garminConnected ? (
            <View style={styles.connectedBadge}>
              <Text style={styles.connectedText}>✓</Text>
            </View>
          ) : (
            <View style={styles.connectBtn}>
              <Text style={styles.connectBtnText}>Conectar</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Whoop */}
        <View style={[styles.intCard, { opacity: 0.4 }]}>
          <View style={[styles.intIcon, { backgroundColor: "#1a0d0d" }]}>
            <Text>💪</Text>
          </View>
          <View style={styles.intInfo}>
            <Text style={styles.intName}>Whoop</Text>
            <Text style={styles.intStatus}>Em breve</Text>
          </View>
          <View style={styles.soonBadge}>
            <Text style={styles.soonText}>Em breve</Text>
          </View>
        </View>

        {/* Notificações */}
        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>NOTIFICAÇÕES</Text>

        <View style={styles.intCard}>
          <View style={styles.intInfo}>
            <Text style={styles.intName}>Score diário</Text>
            <Text style={styles.intStatus}>Toda manhã às 7h</Text>
          </View>
          <Toggle value={dailyNotif} onToggle={handleToggleDailyNotif} />
        </View>

        <View style={styles.intCard}>
          <View style={styles.intInfo}>
            <Text style={styles.intName}>Alertas de ciclo</Text>
            <Text style={styles.intStatus}>Mudança de fase</Text>
          </View>
          <Toggle value={cycleNotif} onToggle={setCycleNotif} />
        </View>

        {/* Conta */}
        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>CONTA</Text>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() =>
            Linking.openURL(
              "mailto:suporte@famme.app?subject=Suporte Femme Performance"
            )
          }
        >
          <Text style={styles.actionText}>Falar com suporte</Text>
          <Text style={styles.actionChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionRow} onPress={handleLogout}>
          <Text style={[styles.actionText, { color: Colors.menstrual }]}>Sair</Text>
          <Text style={[styles.actionChevron, { color: Colors.menstrual }]}>›</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Femme Performance v1.0.0</Text>
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
  title: { fontSize: 17, fontWeight: "500", color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: 13, color: Colors.textMuted },
  content: { padding: Spacing.xl, paddingBottom: 40 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accentDim,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 17, fontWeight: "500", color: Colors.accent },
  profileName: { fontSize: 15, fontWeight: "500", color: Colors.text },
  profileSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  upgradeCard: {
    backgroundColor: Colors.accentDim,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
  },
  upgradeTitle: { fontSize: 14, fontWeight: "600", color: Colors.accent, marginBottom: 4 },
  upgradeText: { fontSize: 12, color: Colors.textMuted },
  sectionLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  intCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  intIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  intInfo: { flex: 1 },
  intName: { fontSize: 14, color: Colors.text, fontWeight: "500" },
  intStatus: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  connectedBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  connectedText: { fontSize: 12, color: Colors.accent },
  connectBtn: {
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: Colors.accentDim,
  },
  connectBtnText: { fontSize: 11, color: Colors.accent },
  soonBadge: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  soonText: { fontSize: 10, color: Colors.textDim },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionText: { fontSize: 14, color: Colors.text },
  actionChevron: { fontSize: 20, color: Colors.textMuted, lineHeight: 22 },
  version: {
    fontSize: 11,
    color: Colors.textDisabled,
    textAlign: "center",
    marginTop: 24,
  },
});
