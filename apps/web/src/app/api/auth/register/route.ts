import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signAccessToken, signRefreshToken, setAuthCookies } from "@/lib/auth";
import { created, err, handleError } from "@/lib/response";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  modality: z
    .enum(["CROSSFIT", "HYROX", "RUNNING", "WEIGHTLIFTING"])
    .default("CROSSFIT"),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { allowed } = checkRateLimit(ip, {
      name: "register",
      limit: 5,
      windowMs: 60 * 60 * 1000, // 5 tentativas por hora
    });
    if (!allowed) {
      return err("Muitas tentativas de cadastro. Tente novamente mais tarde.", 429);
    }

    const body = await req.json();
    const { name, email, password, modality } = schema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return err("E-mail já cadastrado", 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, passwordHash, modality },
      select: { id: true, name: true, email: true, modality: true, plan: true },
    });

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken({ sub: user.id, email: user.email, plan: user.plan }),
      signRefreshToken(user.id),
    ]);

    setAuthCookies(accessToken, refreshToken);

    return created({ user, accessToken });
  } catch (error) {
    return handleError(error);
  }
}
