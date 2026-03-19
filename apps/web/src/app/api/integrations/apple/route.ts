import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/response";

// Payload enviado pelo SDK nativo do Expo (expo-health)
const schema = z.object({
  hrv: z.number().positive().optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  restingHeartRate: z.number().int().positive().optional(),
  date: z.string().date().optional(), // YYYY-MM-DD, padrão = hoje
});

// POST /api/integrations/apple
// Recebe dados do Apple HealthKit e atualiza o score do dia
export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id")!;

  try {
    const body = await req.json();
    const { hrv, sleepHours, restingHeartRate, date } = schema.parse(body);

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Atualiza ou cria registro parcial — score será calculado via POST /score/today
    await prisma.dailyScore.upsert({
      where: { userId_date: { userId, date: targetDate } },
      create: {
        userId,
        date: targetDate,
        score: 0, // placeholder até o cálculo completo
        phase: "FOLLICULAR", // será sobrescrito no cálculo
        cycleDay: 1,
        hrv: hrv ?? null,
        sleepHours: sleepHours ?? null,
        restingHeartRate: restingHeartRate ?? null,
      },
      update: {
        hrv: hrv ?? undefined,
        sleepHours: sleepHours ?? undefined,
        restingHeartRate: restingHeartRate ?? undefined,
      },
    });

    // Registra integração como ativa
    await prisma.integration.upsert({
      where: { userId_type: { userId, type: "APPLE_HEALTH" } },
      create: { userId, type: "APPLE_HEALTH", isActive: true, lastSyncedAt: new Date() },
      update: { isActive: true, lastSyncedAt: new Date() },
    });

    return ok({ synced: true, date: targetDate.toISOString().split("T")[0] });
  } catch (error) {
    return handleError(error);
  }
}
