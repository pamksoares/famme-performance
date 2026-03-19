import { NextRequest } from "next/server";
import { ok, err, handleError } from "@/lib/response";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/integrations/garmin/connect
 * Cria sessão no Terra Widget e retorna URL para o app abrir.
 */
export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id")!;

  const terraApiKey = process.env.TERRA_API_KEY;
  const terraDevId = process.env.TERRA_DEV_ID;

  if (!terraApiKey || !terraDevId) {
    return err("Integração Garmin não configurada no servidor", 503);
  }

  try {
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "https://api-production-8227.up.railway.app";

    const res = await fetch("https://api.tryterra.co/v2/auth/user", {
      method: "POST",
      headers: {
        "x-api-key": terraApiKey,
        "dev-id": terraDevId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        resource: "GARMIN",
        language: "pt",
        reference_id: userId,
        auth_success_redirect_url: `${appUrl}/api/integrations/garmin/callback`,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[Terra] widget session error:", text);
      return err("Erro ao iniciar conexão com Garmin", 502);
    }

    const { widget_session_id } = await res.json();
    const widgetUrl = `https://widget.tryterra.co/session/${widget_session_id}`;

    return ok({ url: widgetUrl });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/integrations/garmin/connect
 * Verifica status da integração Garmin do usuário.
 */
export async function POST(req: NextRequest) {
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
