import { Platform } from "react-native";
import { syncAppleHealth } from "./api";

export interface HealthData {
  hrv?: number;
  sleepHours?: number;
  restingHeartRate?: number;
}

// ─── iOS: Apple HealthKit ──────────────────────────────────────────────────────

async function requestAndReadAppleHealth(): Promise<HealthData | null> {
  try {
    // Import dinâmico — nunca bundled no Android
    const AppleHealthKit = (await import("react-native-health")).default;

    const PERMISSIONS = {
      permissions: {
        read: [
          AppleHealthKit.Constants.Permissions.HeartRateVariability,
          AppleHealthKit.Constants.Permissions.SleepAnalysis,
          AppleHealthKit.Constants.Permissions.RestingHeartRate,
        ],
        write: [] as string[],
      },
    };

    await new Promise<void>((resolve, reject) => {
      AppleHealthKit.initHealthKit(PERMISSIONS, (err: string) => {
        if (err) reject(new Error(err));
        else resolve();
      });
    });

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const options = {
      startDate: yesterday.toISOString(),
      endDate: now.toISOString(),
      limit: 20,
      ascending: false,
    };

    function promisify<T>(fn: Function, opts: object): Promise<T> {
      return new Promise((resolve, reject) => {
        fn(opts, (err: string, results: T) => {
          if (err) reject(new Error(err));
          else resolve(results);
        });
      });
    }

    const [hrvResults, sleepResults, hrResults] = await Promise.allSettled([
      promisify<any[]>(
        AppleHealthKit.getHeartRateVariabilitySamples.bind(AppleHealthKit),
        options
      ),
      promisify<any[]>(
        AppleHealthKit.getSleepSamples.bind(AppleHealthKit),
        options
      ),
      promisify<any[]>(AppleHealthKit.getRestingHeartRate.bind(AppleHealthKit), {
        ...options,
        limit: 5,
      }),
    ]);

    const data: HealthData = {};

    if (hrvResults.status === "fulfilled" && hrvResults.value.length > 0) {
      const values = hrvResults.value.map((r: any) => r.value);
      data.hrv = Math.round(
        values.reduce((a: number, b: number) => a + b, 0) / values.length
      );
    }

    if (sleepResults.status === "fulfilled" && sleepResults.value.length > 0) {
      const totalMs = sleepResults.value.reduce((acc: number, r: any) => {
        const end = new Date(r.endDate).getTime();
        const start = new Date(r.startDate).getTime();
        return acc + Math.max(0, end - start);
      }, 0);
      data.sleepHours = Math.round((totalMs / 3_600_000) * 10) / 10;
    }

    if (hrResults.status === "fulfilled" && hrResults.value.length > 0) {
      data.restingHeartRate = Math.round(hrResults.value[0].value);
    }

    return Object.keys(data).length > 0 ? data : null;
  } catch {
    return null;
  }
}

// ─── Android: Health Connect ──────────────────────────────────────────────────

async function requestAndReadHealthConnect(): Promise<HealthData | null> {
  try {
    const {
      initialize,
      requestPermission,
      readRecords,
      getSdkStatus,
      SdkAvailabilityStatus,
    } = await import("react-native-health-connect");

    // Verifica se Health Connect está disponível no dispositivo
    const status = await getSdkStatus();
    if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) {
      return null;
    }

    const initialized = await initialize();
    if (!initialized) return null;

    const granted = await requestPermission([
      { accessType: "read", recordType: "SleepSession" },
      { accessType: "read", recordType: "HeartRate" },
      { accessType: "read", recordType: "HeartRateVariabilitySdnn" },
    ]);

    if (!granted || granted.length === 0) return null;

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const timeRangeFilter = {
      operator: "between" as const,
      startTime: yesterday.toISOString(),
      endTime: now.toISOString(),
    };

    const data: HealthData = {};

    // HRV
    try {
      const { records: hrvRecords } = await readRecords("HeartRateVariabilitySdnn", {
        timeRangeFilter,
      });
      if (hrvRecords.length > 0) {
        const avg =
          hrvRecords.reduce((sum: number, r: any) => sum + r.heartRateVariabilityMillis, 0) /
          hrvRecords.length;
        data.hrv = Math.round(avg);
      }
    } catch {}

    // Sleep
    try {
      const { records: sleepRecords } = await readRecords("SleepSession", {
        timeRangeFilter,
      });
      if (sleepRecords.length > 0) {
        const totalMs = sleepRecords.reduce((sum: number, r: any) => {
          const end = new Date(r.endTime).getTime();
          const start = new Date(r.startTime).getTime();
          return sum + Math.max(0, end - start);
        }, 0);
        data.sleepHours = Math.round((totalMs / 3_600_000) * 10) / 10;
      }
    } catch {}

    // Heart Rate (resting = min value over 24h approximation)
    try {
      const { records: hrRecords } = await readRecords("HeartRate", {
        timeRangeFilter,
      });
      if (hrRecords.length > 0) {
        const allSamples = hrRecords.flatMap((r: any) => r.samples ?? []);
        if (allSamples.length > 0) {
          const sorted = allSamples
            .map((s: any) => s.beatsPerMinute)
            .sort((a: number, b: number) => a - b);
          // Mediana dos valores mais baixos (proxy para FC de repouso)
          const low = sorted.slice(0, Math.max(1, Math.floor(sorted.length * 0.1)));
          data.restingHeartRate = Math.round(
            low.reduce((a: number, b: number) => a + b, 0) / low.length
          );
        }
      }
    } catch {}

    return Object.keys(data).length > 0 ? data : null;
  } catch {
    return null;
  }
}

// ─── Unified API ──────────────────────────────────────────────────────────────

/**
 * Solicita permissões de saúde e lê dados das últimas 24h.
 * iOS → Apple HealthKit | Android → Health Connect (funciona com Garmin, Samsung Health, etc.)
 */
export async function requestAndReadHealth(): Promise<HealthData | null> {
  if (Platform.OS === "ios") {
    return requestAndReadAppleHealth();
  }
  if (Platform.OS === "android") {
    return requestAndReadHealthConnect();
  }
  return null;
}

/**
 * Sincroniza dados de saúde com o backend.
 * Falha silenciosa — nunca bloqueia a UI.
 */
export async function syncHealthData(): Promise<HealthData | null> {
  const data = await requestAndReadHealth();
  if (!data) return null;
  await syncAppleHealth(data).catch(() => null);
  return data;
}
