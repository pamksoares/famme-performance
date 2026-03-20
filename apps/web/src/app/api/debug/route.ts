import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Endpoint temporário de diagnóstico — remover após resolver o bug
export async function GET() {
  const results: Record<string, unknown> = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    results.select1 = "ok";
  } catch (e) {
    results.select1 = String(e);
  }

  try {
    const count = await prisma.user.count();
    results.userCount = count;
  } catch (e) {
    results.userCount_error = String(e);
  }

  try {
    await prisma.user.findFirst({ select: { id: true } });
    results.userFindFirst = "ok";
  } catch (e) {
    results.userFindFirst_error = String(e);
  }

  try {
    const cols = await prisma.$queryRaw<{ column_name: string }[]>`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users' ORDER BY ordinal_position
    `;
    results.userColumns = cols.map((c) => c.column_name);
  } catch (e) {
    results.userColumns_error = String(e);
  }

  return NextResponse.json(results);
}
