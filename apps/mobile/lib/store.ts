import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { User } from "./api";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User, accessToken: string) => Promise<void>;
  clearUser: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: async (user, accessToken) => {
    await SecureStore.setItemAsync("access_token", accessToken);
    await SecureStore.setItemAsync("user", JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  clearUser: async () => {
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("user");
    set({ user: null, isAuthenticated: false });
  },

  loadFromStorage: async () => {
    try {
      const stored = await SecureStore.getItemAsync("user");
      const token = await SecureStore.getItemAsync("access_token");
      if (stored && token) {
        set({ user: JSON.parse(stored), isAuthenticated: true });
      }
    } catch {
      // storage corrompido — reseta
      await SecureStore.deleteItemAsync("access_token");
      await SecureStore.deleteItemAsync("user");
    } finally {
      set({ isLoading: false });
    }
  },
}));
