import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "./lib/auth";

const PUBLIC_ROUTES = new Set([
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/health",
]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permite rotas públicas, stripe webhook e garmin webhook (usam assinaturas próprias)
  if (
    PUBLIC_ROUTES.has(pathname) ||
    pathname === "/api/stripe/webhook" ||
    pathname === "/api/integrations/garmin"
  ) {
    return NextResponse.next();
  }

  // Apenas protege rotas /api/*
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("Authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  const cookieToken = request.cookies.get("access_token")?.value;

  const token = bearerToken ?? cookieToken;
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Não autenticado" },
      { status: 401 }
    );
  }

  const payload = await verifyAccessToken(token);
  if (!payload) {
    return NextResponse.json(
      { ok: false, error: "Token inválido ou expirado" },
      { status: 401 }
    );
  }

  // Injeta userId no header para os handlers downstream
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", payload.sub);
  requestHeaders.set("x-user-plan", payload.plan);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/api/:path*"],
};
