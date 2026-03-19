import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/response";

// GET /api/score/history?days=14
export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id")!;
  const plan = req.headers.get("x-user-plan") ?? "FREE";

  const rawDays = req.nextUrl.searchParams.get("days");
  const requestedDays = rawDays ? parseInt(rawDays, 10) : 14;

  // Limite por plano: FREE = 14 dias, PRO/ELITE = sem limite
  const maxDays = plan === "FREE" ? 14 : 365;
  const days = Math.min(requestedDays, maxDays);

  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  try {
    const scores = await prisma.dailyScore.findMany({
      where: { userId, date: { gte: since } },
      orderBy: { date: "asc" },
      select: {
        date: true,
        score: true,
        phase: true,
        cycleDay: true,
        hrv: true,
        sleepHours: true,
        restingHeartRate: true,
      },
    });

    // Insights simples: fase com melhor média
    const phaseAverages = scores.reduce<Record<string, number[]>>((acc, s) => {
      const key = s.phase;
      acc[key] = acc[key] ?? [];
      acc[key].push(s.score);
      return acc;
    }, {});

    const insights = Object.entries(phaseAverages).map(([phase, values]) => ({
      phase,
      avgScore: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      sampleSize: values.length,
    }));

    return ok({ scores, insights, days });
  } catch (error) {
    return handleError(error);
  }
}
