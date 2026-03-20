import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { useAuthStore } from "@/lib/store";
import { registerPushToken } from "@/lib/api";
import { Colors } from "@/constants/theme";

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

async function registerForPushNotifications() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return;

    const token = await Notifications.getExpoPushTokenAsync();
    await registerPushToken(token.data).catch(() => null);
  } catch {
    // Silently fail — push is optional
  }
}

export default function RootLayout() {
  const { loadFromStorage, isLoading, user } = useAuthStore();

  useEffect(() => {
    loadFromStorage().finally(() => SplashScreen.hideAsync());
  }, [loadFromStorage]);

  useEffect(() => {
    if (user) {
      registerForPushNotifications();
    }
  }, [user]);

  if (isLoading) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" backgroundColor={Colors.bg} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </QueryClientProvider>
  );
}
