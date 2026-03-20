import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, notFound, handleError } from "@/lib/response";

const patchSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  modality: z
    .enum(["CROSSFIT", "HYROX", "RUNNING", "WEIGHTLIFTING"])
    .optional(),
});

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  modality: true,
  plan: true,
  createdAt: true,
} as const;

// GET /api/user
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: USER_SELECT,
    });

    if (!user) return notFound("Usuário não encontrado");

    return ok(user);
  } catch (error) {
    return handleError(error);
  }
}

// PATCH /api/user
export async function PATCH(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const body = await req.json();
    const data = patchSchema.parse(body);

    if (Object.keys(data).length === 0) {
      return ok(
        await prisma.user.findUniqueOrThrow({
          where: { id: userId },
          select: USER_SELECT,
        })
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: USER_SELECT,
    });

    return ok(user);
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/user — exclui conta permanentemente (LGPD)
export async function DELETE(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return unauthorized();

    await prisma.user.delete({ where: { id: userId } });

    return ok({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
