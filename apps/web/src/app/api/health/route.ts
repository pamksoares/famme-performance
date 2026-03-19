import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/response";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return ok({ status: "ok", db: "connected", ts: new Date().toISOString() });
  } catch {
    return err("Database unreachable", 503);
  }
}
