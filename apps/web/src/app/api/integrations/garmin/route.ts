import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { ok, err, handleError } from "@/lib/response";

function verifyTerraSignature(body: string, signature: string | null): boolean {
  const secret = process.env.TERRA_WEBHOOK_SECRET;
  if (!secret) return true; // sem secret = dev mode
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * GET /api/integrations/garmin
 * Status da integração Garmin do usuário logado.
 * (middleware injeta x-user-id)
 */
export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id")!;

  try {
    const integration = await prisma.integration.findUnique({
      where: { userId_type: { userId, type: "GARMIN" } },
      select: { isActive: true, lastSyncedAt: true, createdAt: true },
    });

    return ok({
      connected: integration?.isActive ?? false,
      lastSyncedAt: integration?.lastSyncedAt ?? null,
      connectedAt: integration?.createdAt ?? null,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/integrations/garmin
 * Webhook do Terra — recebe dados de sono, HRV e FC do Garmin.
 * Rota pública (verificada por HMAC).
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("terra-signature");

  if (!verifyTerraSignature(rawBody, signature)) {
    return err("Assinatura inválida", 401);
  }

  try {
    const body = JSON.parse(rawBody);
    const { type, user, data: payloadData } = body;

    const relevantTypes = ["sleep", "daily", "body", "activity"];
    if (!relevantTypes.includes(type) || !user?.reference_id) {
      return ok({ received: true, processed: false });
    }

    const userId: string = user.reference_id;
    const terraUserId: string | undefined = user.user_id;

    let hrv: number | undefined;
    let sleepHours: number | undefined;
    let restingHeartRate: number | undefined;
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    if (type === "sleep" && Array.isArray(payloadData) && payloadData[0]) {
      const s = payloadData[0];
      const durSec =
        s.sleep_durations_data?.asleep?.duration_asleep_state_seconds;
      if (durSec) sleepHours = Math.round((durSec / 3600) * 10) / 10;

      const hrvSdnn = s.heart_rate_data?.summary?.avg_hrv_sdnn;
      if (hrvSdnn) hrv = Math.round(hrvSdnn);

      if (s.metadata?.start_time) {
        const d = new Date(s.metadata.start_time);
        date.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
      }
    }

    if (type === "daily" && Array.isArray(payloadData) && payloadData[0]) {
      const d = payloadData[0];
      const rhr = d.heart_rate_data?.summary?.resting_hr_bpm;
      if (rhr) restingHeartRate = Math.round(rhr);

      const hrvSdnn = d.heart_rate_data?.summary?.avg_hrv_sdnn;
      if (hrvSdnn) hrv = Math.round(hrvSdnn);

      if (d.metadata?.start_time) {
        const dt = new Date(d.metadata.start_time);
        date.setFullYear(dt.getFullYear(), dt.getMonth(), dt.getDate());
      }
    }

    if (type === "body" && Array.isArray(payloadData) && payloadData[0]) {
      const b = payloadData[0];
      const rhr = b.heart_rate_data?.summary?.resting_hr_bpm;
      if (rhr) restingHeartRate = Math.round(rhr);
    }

    // Upsert DailyScore
    const existing = await prisma.dailyScore.findUnique({
      where: { userId_date: { userId, date } },
    });

    if (existing) {
      await prisma.dailyScore.update({
        where: { userId_date: { userId, date } },
        data: {
          ...(hrv != null && { hrv }),
          ...(sleepHours != null && { sleepHours }),
          ...(restingHeartRate != null && { restingHeartRate }),
        },
      });
    } else {
      await prisma.dailyScore.create({
        data: {
          userId,
          date,
          score: 0,
          phase: "FOLLICULAR",
          cycleDay: 1,
          hrv: hrv ?? null,
          sleepHours: sleepHours ?? null,
          restingHeartRate: restingHeartRate ?? null,
        },
      });
    }

    // Marca integração como ativa
    await prisma.integration.upsert({
      where: { userId_type: { userId, type: "GARMIN" } },
      create: {
        userId,
        type: "GARMIN",
        isActive: true,
        lastSyncedAt: new Date(),
        accessToken: terraUserId ?? null,
      },
      update: {
        isActive: true,
        lastSyncedAt: new Date(),
        ...(terraUserId && { accessToken: terraUserId }),
      },
    });

    return ok({ received: true, processed: true });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/integrations/garmin
 * Desconecta Garmin e revoga no Terra.
 */
export async function DELETE(req: NextRequest) {
  const userId = req.headers.get("x-user-id")!;

  try {
    const integration = await prisma.integration.findUnique({
      where: { userId_type: { userId, type: "GARMIN" } },
    });

    if (!integration) return ok({ disconnected: true });

    // Revoga na Terra se possível
    if (
      integration.accessToken &&
      process.env.TERRA_API_KEY &&
      process.env.TERRA_DEV_ID
    ) {
      await fetch(
        `https://api.tryterra.co/v2/auth/user?user_id=${integration.accessToken}`,
        {
          method: "DELETE",
          headers: {
            "x-api-key": process.env.TERRA_API_KEY,
            "dev-id": process.env.TERRA_DEV_ID,
          },
        }
      ).catch(() => null);
    }

    await prisma.integration.update({
      where: { userId_type: { userId, type: "GARMIN" } },
      data: { isActive: false, accessToken: null },
    });

    return ok({ disconnected: true });
  } catch (error) {
    return handleError(error);
  }
}
