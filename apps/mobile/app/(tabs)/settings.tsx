import { useState } from "react";
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
import { Toggle } from "@/components/ui/Toggle";
import { Colors, Spacing, Radius, MODALITY_LABELS } from "@/constants/theme";
import { logout } from "@/lib/api";
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
  const [dailyNotif, setDailyNotif] = useState(true);
  const [cycleNotif, setCycleNotif] = useState(true);
  const [appleConnected, setAppleConnected] = useState(false);

  async function handleToggleApple(enabled: boolean) {
    if (enabled) {
      const data = await requestAndReadHealth();
      setAppleConnected(data != null);
      if (!data) {
        Alert.alert(
          "Permissão necessária",
          "Ative o acesso ao Apple Health nas Configurações do iPhone."
        );
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
          <View>
            <Text style={styles.profileName}>{user?.name}</Text>
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
            <Text style={styles.upgradeTitle}>
              Fazer upgrade para Pro — R$29/mês
            </Text>
            <Text style={styles.upgradeText}>
              Recomendações de IA, histórico completo, 3 wearables
            </Text>
          </TouchableOpacity>
        )}

        {/* Integrações */}
        <Text style={styles.sectionLabel}>INTEGRAÇÕES</Text>

        <View style={styles.intCard}>
          <View style={[styles.intIcon, { backgroundColor: "#1a1a1a" }]}>
            <Text>📱</Text>
          </View>
          <View style={styles.intInfo}>
            <Text style={styles.intName}>Apple Health</Text>
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

        <View style={[styles.intCard, styles.intDisabled]}>
          <View style={[styles.intIcon, { backgroundColor: "#0d1a0d" }]}>
            <Text>⌚</Text>
          </View>
          <View style={styles.intInfo}>
            <Text style={styles.intName}>Garmin Connect</Text>
            <Text style={styles.intStatus}>Em breve</Text>
          </View>
        </View>

        <View style={[styles.intCard, styles.intDisabled]}>
          <View style={[styles.intIcon, { backgroundColor: "#1a0d0d" }]}>
            <Text>💪</Text>
          </View>
          <View style={styles.intInfo}>
            <Text style={styles.intName}>Whoop</Text>
            <Text style={styles.intStatus}>Em breve</Text>
          </View>
        </View>

        {/* Notificações */}
        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>
          NOTIFICAÇÕES
        </Text>

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

        {/* Ações */}
        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>CONTA</Text>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() =>
            Linking.openURL("mailto:suporte@famme.app?subject=Suporte Femme Performance")
          }
        >
          <Text style={styles.actionText}>Falar com suporte</Text>
          <Text style={styles.actionChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionRow} onPress={handleLogout}>
          <Text style={[styles.actionText, { color: Colors.menstrual }]}>
            Sair
          </Text>
          <Text style={[styles.actionChevron, { color: Colors.menstrual }]}>›</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Femme Performance v1.0.0</Text>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  content: {
    padding: Spacing.xl,
    paddingBottom: 40,
  },
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
  avatarText: {
    fontSize: 17,
    fontWeight: "500",
    color: Colors.accent,
  },
  profileName: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.text,
  },
  profileSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  upgradeCard: {
    backgroundColor: Colors.accentDim,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
  },
  upgradeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.accent,
    marginBottom: 4,
  },
  upgradeText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
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
  intDisabled: {
    opacity: 0.4,
  },
  intIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  intInfo: {
    flex: 1,
  },
  intName: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "500",
  },
  intStatus: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
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
  actionText: {
    fontSize: 14,
    color: Colors.text,
  },
  actionChevron: {
    fontSize: 20,
    color: Colors.textMuted,
    lineHeight: 22,
  },
  version: {
    fontSize: 11,
    color: Colors.textDisabled,
    textAlign: "center",
    marginTop: 24,
  },
});
