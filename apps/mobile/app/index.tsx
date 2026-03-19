import { Redirect } from "expo-router";
import { useAuthStore } from "@/lib/store";

// Ponto de entrada — redireciona baseado no estado de auth
export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return null;

  return <Redirect href={isAuthenticated ? "/(tabs)/" : "/(auth)/onboarding/"} />;
}
