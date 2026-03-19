import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRecommendation } from "@/lib/claude";
import { computeHrvBaseline } from "@/lib/score";
import { ok, err, forbidden, handleError } from "@/lib/response";

// POST /api/recommendation — gera recomendação via Claude para o score do dia
export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id")!;
  const plan = req.headers.get("x-user-plan") ?? "FREE";

  // Recomendações de IA são recurso PRO+
  if (plan === "FREE") {
    return forbidden("Recomendações personalizadas estão disponíveis no plano Pro ou Elite");
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [user, dailyScore] = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { name: true, modality: true },
      }),
      prisma.dailyScore.findUnique({
        where: { userId_date: { userId, date: today } },
      }),
    ]);

    if (!dailyScore) {
      return err("Registre os dados do dia antes de gerar a recomendação", 422);
    }

    // Retorna do cache se já gerou hoje
    if (dailyScore.recommendation) {
      return ok(JSON.parse(dailyScore.recommendation));
    }

    const recentScores = await prisma.dailyScore.findMany({
      where: { userId, hrv: { not: null } },
      orderBy: { date: "desc" },
      take: 30,
      select: { hrv: true },
    });

    const hrvBaseline = computeHrvBaseline(recentScores);

    const recommendation = await generateRecommendation({
      name: user.name,
      modality: user.modality,
      phase: dailyScore.phase,
      cycleDay: dailyScore.cycleDay,
      score: dailyScore.score,
      hrv: dailyScore.hrv,
      hrvBaseline,
      sleepHours: dailyScore.sleepHours,
      restingHeartRate: dailyScore.restingHeartRate,
    });

    // Persiste para não chamar a API novamente
    await prisma.dailyScore.update({
      where: { id: dailyScore.id },
      data: { recommendation: JSON.stringify(recommendation) },
    });

    return ok(recommendation);
  } catch (error) {
    return handleError(error);
  }
}
