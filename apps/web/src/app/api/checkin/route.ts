import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, err, handleError } from "@/lib/response";

const schema = z.object({
  energy: z.number().int().min(1).max(5),
  mood: z.number().int().min(1).max(5),
  pain: z.boolean(),
  sleepQuality: z.number().int().min(1).max(5),
  notes: z.string().max(500).optional(),
});

// GET /api/checkin — check-in de hoje
export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id")!;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const checkin = await prisma.dailyCheckIn.findUnique({
      where: { userId_date: { userId, date: today } },
    });
    return ok(checkin);
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/checkin — salva check-in
export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id")!;

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkin = await prisma.dailyCheckIn.upsert({
      where: { userId_date: { userId, date: today } },
      create: { userId, date: today, ...data },
      update: { ...data },
    });

    return ok(checkin);
  } catch (error) {
    return handleError(error);
  }
}
