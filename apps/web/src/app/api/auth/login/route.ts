import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signAccessToken, signRefreshToken, setAuthCookies } from "@/lib/auth";
import { ok, err, handleError } from "@/lib/response";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { allowed } = checkRateLimit(ip, {
      name: "login",
      limit: 10,
      windowMs: 15 * 60 * 1000, // 10 tentativas por 15 minutos
    });
    if (!allowed) {
      return err("Muitas tentativas. Aguarde alguns minutos e tente novamente.", 429);
    }

    const body = await req.json();
    const { email, password } = schema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });

    // Mesmo tempo de resposta para email inválido ou senha errada (evita enumeração)
    const passwordMatch = user
      ? await bcrypt.compare(password, user.passwordHash)
      : await bcrypt.hash(password, 12).then(() => false);

    if (!user || !passwordMatch) {
      return err("E-mail ou senha inválidos", 401);
    }

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken({ sub: user.id, email: user.email, plan: user.plan }),
      signRefreshToken(user.id),
    ]);

    setAuthCookies(accessToken, refreshToken);

    return ok({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        modality: user.modality,
        plan: user.plan,
      },
      accessToken,
    });
  } catch (error) {
    return handleError(error);
  }
}
