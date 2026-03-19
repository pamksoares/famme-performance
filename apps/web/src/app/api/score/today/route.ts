import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  calculateDailyScore,
  getCyclePhase,
  computeHrvBaseline,
} from "@/lib/score";
import { ok, err, handleError } from "@/lib/response";

const schema = z.object({
  hrv: z.number().int().positive().optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  restingHeartRate: z.number().int().positive().optional(),
});

// GET /api/score/today — retorna ou calcula o score do dia
export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id")!;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const existing = await prisma.dailyScore.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    if (existing) return ok(existing);

    // Não há score hoje — tenta calcular com os últimos dados de wearable
    // (dados serão submetidos via POST)
    return ok(null);
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/score/today — recebe métricas e persiste o score calculado
export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id")!;

  try {
    const body = await req.json();
    const { hrv, sleepHours, restingHeartRate } = schema.parse(body);

    // Ciclo mais recente
    const cycle = await prisma.cycleEntry.findFirst({
      where: { userId },
      orderBy: { startDate: "desc" },
    });

    if (!cycle) {
      return err("Configure seu ciclo menstrual antes de gerar o score", 422);
    }

    // HRV baseline: média dos últimos 30 scores com HRV disponível
    const recentScores = await prisma.dailyScore.findMany({
      where: { userId, hrv: { not: null } },
      orderBy: { date: "desc" },
      take: 30,
      select: { hrv: true },
    });

    const hrvBaseline = computeHrvBaseline(recentScores);
    const { phase, cycleDay } = getCyclePhase(cycle.startDate, cycle.cycleLengthDays);

    const score = calculateDailyScore({
      hrv: hrv ?? null,
      hrvBaseline,
      sleepHours: sleepHours ?? null,
      phase,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyScore = await prisma.dailyScore.upsert({
      where: { userId_date: { userId, date: today } },
      create: {
        userId,
        date: today,
        score,
        phase,
        cycleDay,
        hrv: hrv ?? null,
        sleepHours: sleepHours ?? null,
        restingHeartRate: restingHeartRate ?? null,
      },
      update: {
        score,
        phase,
        cycleDay,
        hrv: hrv ?? null,
        sleepHours: sleepHours ?? null,
        restingHeartRate: restingHeartRate ?? null,
      },
    });

    return ok({ ...dailyScore, hrvBaseline });
  } catch (error) {
    return handleError(error);
  }
}
