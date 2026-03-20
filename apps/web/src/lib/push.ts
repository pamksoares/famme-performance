import { CyclePhase } from "@prisma/client";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendPushNotification(message: PushMessage): Promise<void> {
  try {
    await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });
  } catch (e) {
    console.error("[Push] Failed to send notification:", e);
  }
}

export async function sendPhaseChangeNotification(
  pushToken: string,
  phase: CyclePhase
): Promise<void> {
  const PHASE_MESSAGES: Record<CyclePhase, { title: string; body: string }> = {
    MENSTRUAL: {
      title: "Nova fase: Menstrual 🔴",
      body: "Seu corpo pede mais recuperação. Veja o score de hoje.",
    },
    FOLLICULAR: {
      title: "Nova fase: Folicular 🟢",
      body: "Energia crescendo! Ótimo momento para treinos mais intensos.",
    },
    OVULATORY: {
      title: "Nova fase: Ovulatória ⚡",
      body: "Pico de performance! Aproveite para bater recordes.",
    },
    LUTEAL: {
      title: "Nova fase: Lútea 🟣",
      body: "Fase de manutenção. Foco em técnica e recuperação ativa.",
    },
  };

  const msg = PHASE_MESSAGES[phase];
  if (!msg) return;

  await sendPushNotification({ to: pushToken, ...msg, data: { phase } });
}

export async function sendDailyReminder(
  pushToken: string,
  phase: CyclePhase
): Promise<void> {
  const PHASE_REMINDERS: Record<CyclePhase, string> = {
    FOLLICULAR: "💪 Boa energia hoje — registre seu score e aproveite a fase!",
    OVULATORY: "🔥 Pico de performance! Não esqueça de registrar seu dia.",
    LUTEAL: "🌙 Fase de recuperação — registre como você está se sentindo.",
    MENSTRUAL: "❤️ Cuide de você hoje. Registre seu score para acompanhar.",
  };

  await sendPushNotification({
    to: pushToken,
    title: "Femme Performance 🌿",
    body: PHASE_REMINDERS[phase],
    data: { type: "daily_reminder" },
  });
}
