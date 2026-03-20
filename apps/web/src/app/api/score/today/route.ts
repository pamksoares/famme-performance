import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  calculateDailyScore,
  getCyclePhase,
  computeHrvBaseline,
} from "@/lib/score";
import { ok, err, handleError } from "@/lib/response";
import { sendPhaseChangeNotification } from "@/lib/push";

const schema = z.object({
  hrv: z.number().int().positive().optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  restingHeartRate: z.number().int().positive().optional(),
});

// GET /api/score/today
export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id")!;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const existing = await prisma.dailyScore.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    if (existing) return ok(existing);
    return ok(null);
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/score/today
export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id")!;

  try {
    const body = await req.json();
    const { hrv, sleepHours, restingHeartRate } = schema.parse(body);

    const cycle = await prisma.cycleEntry.findFirst({
      where: { userId },
      orderBy: { startDate: "desc" },
    });

    if (!cycle) {
      return err("Configure seu ciclo menstrual antes de gerar o score", 422);
    }

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

    // Verifica se a fase mudou em relação ao dia anterior
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayScore = await prisma.dailyScore.findUnique({
      where: { userId_date: { userId, date: yesterday } },
      select: { phase: true },
    });

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

    // Envia push notification se a fase mudou
    const phaseChanged = yesterdayScore && yesterdayScore.phase !== phase;
    if (phaseChanged) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { pushToken: true },
      });

      if (user?.pushToken) {
        sendPhaseChangeNotification(user.pushToken, phase).catch(() => null);
      }
    }

    return ok({ ...dailyScore, hrvBaseline });
  } catch (error) {
    return handleError(error);
  }
}
