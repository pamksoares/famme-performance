import { NextRequest } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, err, handleError } from "@/lib/response";

// Payload normalizado do Garmin Connect webhook
const activitySchema = z.object({
  userId: z.string(),
  timestamp: z.string().datetime({ offset: true }),
  hrv: z.number().positive().optional(),
  restingHeartRate: z.number().int().positive().optional(),
  sleepSeconds: z.number().nonnegative().optional(),
});

function verifyGarminSignature(
  body: string,
  signature: string | null
): boolean {
  const secret = process.env.GARMIN_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(signature.replace("sha256=", ""), "hex")
  );
}

// POST /api/integrations/garmin — webhook do Garmin Connect
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-garmin-signature");

  if (!verifyGarminSignature(rawBody, signature)) {
    return err("Assinatura inválida", 401);
  }

  try {
    const body = JSON.parse(rawBody);
    const { userId, timestamp, hrv, restingHeartRate, sleepSeconds } =
      activitySchema.parse(body);

    const date = new Date(timestamp);
    date.setHours(0, 0, 0, 0);

    const sleepHours = sleepSeconds != null ? sleepSeconds / 3600 : undefined;

    await prisma.dailyScore.upsert({
      where: { userId_date: { userId, date } },
      create: {
        userId,
        date,
        score: 0,
        phase: "FOLLICULAR",
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

    await prisma.integration.upsert({
      where: { userId_type: { userId, type: "GARMIN" } },
      create: { userId, type: "GARMIN", isActive: true, lastSyncedAt: new Date() },
      update: { isActive: true, lastSyncedAt: new Date() },
    });

    return ok({ received: true });
  } catch (error) {
    return handleError(error);
  }
}
