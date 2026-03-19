import * as SecureStore from "expo-secure-store";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync("access_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // Token expirou — tenta refresh automático uma vez
  if (res.status === 401 && token) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      return request<T>(path, options);
    }
    throw new ApiError(401, "Sessão expirada");
  }

  const json = await res.json();

  if (!res.ok) {
    throw new ApiError(res.status, json.error ?? "Erro desconhecido");
  }

  return json.data as T;
}

async function refreshTokens(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
    });
    if (!res.ok) return false;

    const { data } = await res.json();
    await SecureStore.setItemAsync("access_token", data.accessToken);
    return true;
  } catch {
    return false;
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  modality: "CROSSFIT" | "HYROX" | "RUNNING" | "WEIGHTLIFTING";
  plan: "FREE" | "PRO" | "ELITE";
}

export async function register(payload: {
  name: string;
  email: string;
  password: string;
  modality: string;
}): Promise<{ user: User; accessToken: string }> {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(payload: {
  email: string;
  password: string;
}): Promise<{ user: User; accessToken: string }> {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function logout(): Promise<void> {
  await request("/api/auth/logout", { method: "POST" });
}

// ─── Cycle ────────────────────────────────────────────────────────────────────

export interface CycleEntry {
  id: string;
  startDate: string;
  cycleLengthDays: number;
}

export async function saveCycle(payload: {
  startDate: string;
  cycleLengthDays: number;
}): Promise<CycleEntry> {
  return request("/api/cycle", { method: "POST", body: JSON.stringify(payload) });
}

export async function getCycle(): Promise<CycleEntry | null> {
  return request("/api/cycle");
}

// ─── Score ────────────────────────────────────────────────────────────────────

export type CyclePhase = "MENSTRUAL" | "FOLLICULAR" | "OVULATORY" | "LUTEAL";

export interface DailyScore {
  id: string;
  date: string;
  score: number;
  phase: CyclePhase;
  cycleDay: number;
  hrv: number | null;
  sleepHours: number | null;
  restingHeartRate: number | null;
  recommendation: string | null;
  hrvBaseline?: number | null;
}

export async function submitScore(payload: {
  hrv?: number;
  sleepHours?: number;
  restingHeartRate?: number;
}): Promise<DailyScore> {
  return request("/api/score/today", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getTodayScore(): Promise<DailyScore | null> {
  return request("/api/score/today");
}

export interface ScoreHistory {
  scores: DailyScore[];
  insights: Array<{ phase: string; avgScore: number; sampleSize: number }>;
}

export async function getScoreHistory(days = 14): Promise<ScoreHistory> {
  return request(`/api/score/history?days=${days}`);
}

// ─── Recommendation ────────────────────────────────────────────────────────────

export interface Recommendation {
  classification: "green" | "yellow" | "red";
  title: string;
  rationale: string;
  trainingType: string;
  exercises: string[];
  recovery: string;
  alert: string | null;
}

export async function getRecommendation(): Promise<Recommendation> {
  return request("/api/recommendation", { method: "POST" });
}

// ─── Integrations ─────────────────────────────────────────────────────────────

export async function syncAppleHealth(payload: {
  hrv?: number;
  sleepHours?: number;
  restingHeartRate?: number;
}): Promise<{ synced: boolean }> {
  return request("/api/integrations/apple", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── Stripe ───────────────────────────────────────────────────────────────────

export async function createCheckout(payload: {
  plan: "PRO" | "ELITE";
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string }> {
  return request("/api/stripe/create-checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
