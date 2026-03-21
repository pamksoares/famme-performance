import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function err(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function unauthorized(message = "Não autenticado") {
  return err(message, 401);
}

export function forbidden(message = "Sem permissão") {
  return err(message, 403);
}

export function notFound(message = "Não encontrado") {
  return err(message, 404);
}

export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    return err(
      error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
      422
    );
  }

  console.error("[API Error]", error);
  const msg = error instanceof Error ? error.message : String(error);
  return err(`Erro interno do servidor: ${msg}`, 500);
}
