import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, handleError } from "@/lib/response";

const schema = z.object({
  token: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const body = await req.json();
    const { token } = schema.parse(body);

    await prisma.user.update({
      where: { id: userId },
      data: { pushToken: token },
    });

    return ok({ registered: true });
  } catch (error) {
    return handleError(error);
  }
}
