import * as Health from "expo-health";
import { syncAppleHealth } from "./api";

export interface HealthData {
  hrv?: number;
  sleepHours?: number;
  restingHeartRate?: number;
}

/**
 * Solicita permissões do HealthKit e lê os dados do dia.
 * Retorna null se o usuário recusar ou se não for iOS.
 */
export async function requestAndReadHealth(): Promise<HealthData | null> {
  try {
    const available = await Health.isAvailableAsync();
    if (!available) return null;

    const granted = await Health.requestPermissionsAsync([
      Health.HealthDataType.HeartRateVariabilitySDNN,
      Health.HealthDataType.SleepAnalysis,
      Health.HealthDataType.RestingHeartRate,
    ]);

    if (!granted) return null;

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [hrvRecords, sleepRecords, hrRecords] = await Promise.allSettled([
      Health.getHealthRecordsAsync({
        type: Health.HealthDataType.HeartRateVariabilitySDNN,
        startDate: yesterday,
        endDate: now,
        limit: 10,
      }),
      Health.getHealthRecordsAsync({
        type: Health.HealthDataType.SleepAnalysis,
        startDate: yesterday,
        endDate: now,
        limit: 20,
      }),
      Health.getHealthRecordsAsync({
        type: Health.HealthDataType.RestingHeartRate,
        startDate: yesterday,
        endDate: now,
        limit: 5,
      }),
    ]);

    const data: HealthData = {};

    if (hrvRecords.status === "fulfilled" && hrvRecords.value.length > 0) {
      const values = hrvRecords.value.map((r) => r.value as number);
      data.hrv = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    }

    if (sleepRecords.status === "fulfilled" && sleepRecords.value.length > 0) {
      // Soma duração de todos os estágios de sono
      const totalMs = sleepRecords.value.reduce((acc, r) => {
        const end = new Date(r.endDate).getTime();
        const start = new Date(r.startDate).getTime();
        return acc + (end - start);
      }, 0);
      data.sleepHours = Math.round((totalMs / 3600000) * 10) / 10;
    }

    if (hrRecords.status === "fulfilled" && hrRecords.value.length > 0) {
      const latest = hrRecords.value[hrRecords.value.length - 1];
      data.restingHeartRate = Math.round(latest.value as number);
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Sincroniza dados do HealthKit com o backend.
 */
export async function syncHealthData(): Promise<HealthData | null> {
  const data = await requestAndReadHealth();
  if (!data || Object.keys(data).length === 0) return null;

  await syncAppleHealth(data).catch(() => null); // falha silenciosa
  return data;
}
