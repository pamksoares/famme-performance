import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
} from "@/lib/auth";
import { ok, err, handleError } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const token =
      cookieStore.get("refresh_token")?.value ??
      (await req.json().catch(() => ({}))).refreshToken;

    if (!token) {
      return err("Refresh token ausente", 401);
    }

    const stored = await verifyRefreshToken(token);
    if (!stored) {
      return err("Refresh token inválido ou expirado", 401);
    }

    // Rotate: invalida o token atual e emite um novo (prevenção de replay)
    await prisma.refreshToken.delete({ where: { id: stored.id } });

    const { user } = stored;
    const [accessToken, newRefreshToken] = await Promise.all([
      signAccessToken({ sub: user.id, email: user.email, plan: user.plan }),
      signRefreshToken(user.id),
    ]);

    setAuthCookies(accessToken, newRefreshToken);

    return ok({ accessToken });
  } catch (error) {
    return handleError(error);
  }
}
