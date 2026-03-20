import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, err, handleError } from "@/lib/response";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = schema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });

    // Sempre retorna sucesso para não vazar se email existe
    if (!user) {
      return ok({ sent: true });
    }

    // Invalida tokens anteriores
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    // Gera código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await prisma.passwordResetToken.create({
      data: { code, userId: user.id, expiresAt },
    });

    // Em produção: enviar por email. Por ora, loga no servidor.
    console.log(`[RESET CODE] ${email} → ${code} (válido 15 min)`);

    return ok({ sent: true });
  } catch (error) {
    return handleError(error);
  }
}
