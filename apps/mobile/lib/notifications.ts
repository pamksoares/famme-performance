import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("famme", {
      name: "Femme Performance",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Agenda notificação diária para o score às 7h.
 * Cancela qualquer agendamento anterior com o mesmo identificador.
 */
export async function scheduleDailyScoreNotification(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync("daily-score").catch(
    () => null
  );

  await Notifications.scheduleNotificationAsync({
    identifier: "daily-score",
    content: {
      title: "Femme Performance",
      body: "Seu score do dia está pronto. Veja como seu corpo está hoje.",
      data: { screen: "/(tabs)/" },
    },
    trigger: {
      hour: 7,
      minute: 0,
      repeats: true,
    },
  });
}

export async function cancelDailyScoreNotification(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync("daily-score").catch(
    () => null
  );
}
