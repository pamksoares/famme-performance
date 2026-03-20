import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/response";
import { sendDailyReminder } from "@/lib/push";

// GET /api/user/notify-daily
// Chamado pelo cron às 8h — dispara push para usuárias sem score hoje
export async function GET(req: NextRequest) {
  // Autorização simples por header secreto
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Usuárias com push token que não registraram score hoje
    const usersWithoutScore = await prisma.user.findMany({
      where: {
        pushToken: { not: null },
        NOT: {
          dailyScores: {
            some: { date: today },
          },
        },
      },
      select: {
        id: true,
        pushToken: true,
        dailyScores: {
          orderBy: { date: "desc" },
          take: 1,
          select: { phase: true },
        },
      },
    });

    const results = await Promise.allSettled(
      usersWithoutScore.map((u) => {
        const phase = u.dailyScores[0]?.phase ?? "FOLLICULAR";
        return sendDailyReminder(u.pushToken!, phase);
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    return ok({ sent, total: usersWithoutScore.length });
  } catch (error) {
    return handleError(error);
  }
}
