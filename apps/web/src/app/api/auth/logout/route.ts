import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { clearAuthCookies } from "@/lib/auth";
import { ok } from "@/lib/response";

export async function POST() {
  const cookieStore = cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (refreshToken) {
    // Remove do banco silenciosamente — não expõe erro se já expirou
    await prisma.refreshToken
      .delete({ where: { token: refreshToken } })
      .catch(() => null);
  }

  clearAuthCookies();

  return ok({ message: "Logout realizado com sucesso" });
}
