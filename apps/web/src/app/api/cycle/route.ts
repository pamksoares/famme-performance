import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError } from "@/lib/response";

const schema = z.object({
  startDate: z.string().datetime({ offset: true }).or(z.string().date()),
  cycleLengthDays: z.number().int().min(21).max(35).default(28),
});

// GET /api/cycle — retorna o ciclo mais recente
export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id")!;

  try {
    const cycle = await prisma.cycleEntry.findFirst({
      where: { userId },
      orderBy: { startDate: "desc" },
    });

    return ok(cycle);
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/cycle — registra ou atualiza o ciclo atual
export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id")!;

  try {
    const body = await req.json();
    const { startDate, cycleLengthDays } = schema.parse(body);

    const cycle = await prisma.cycleEntry.create({
      data: {
        userId,
        startDate: new Date(startDate),
        cycleLengthDays,
      },
    });

    return created(cycle);
  } catch (error) {
    return handleError(error);
  }
}
