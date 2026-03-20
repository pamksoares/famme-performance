import { Platform } from "react-native";
import { syncAppleHealth } from "./api";

export interface HealthData {
  hrv?: number;
  sleepHours?: number;
  restingHeartRate?: number;
}

/**
 * Lê dados de saúde das últimas 24h.
 * iOS → Apple HealthKit (quando react-native-health estiver instalado)
 * Android → null por enquanto (Health Connect em breve)
 */
export async function requestAndReadHealth(): Promise<HealthData | null> {
  if (Platform.OS !== "ios") return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AppleHealthKit = require("react-native-health").default;

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

    const promisify = <T>(fn: Function, opts: object): Promise<T> =>
      new Promise((resolve, reject) => {
        fn(opts, (err: string, results: T) => {
          if (err) reject(new Error(err));
          else resolve(results);
        });
      });

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

/**
 * Sincroniza dados de saúde com o backend. Falha silenciosa.
 */
export async function syncHealthData(): Promise<HealthData | null> {
  const data = await requestAndReadHealth();
  if (!data) return null;
  await syncAppleHealth(data).catch(() => null);
  return data;
}
