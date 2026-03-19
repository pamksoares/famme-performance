import { NextRequest } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { Plan, SubscriptionStatus } from "@prisma/client";
import { ok, err } from "@/lib/response";

// Deve usar o raw body — NÃO pode ter bodyParser
export const runtime = "nodejs";

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  const map: Record<string, SubscriptionStatus> = {
    active: "ACTIVE",
    canceled: "CANCELED",
    past_due: "PAST_DUE",
    trialing: "TRIALING",
    unpaid: "PAST_DUE",
    incomplete: "PAST_DUE",
    incomplete_expired: "CANCELED",
    paused: "PAST_DUE",
  };
  return map[status] ?? "PAST_DUE";
}

async function handleSubscriptionUpsert(sub: Stripe.Subscription) {
  const userId = sub.metadata.userId;
  const plan = (sub.metadata.plan as Plan) ?? "PRO";
  const status = mapStripeStatus(sub.status);

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { stripeSubscriptionId: sub.id },
      create: {
        userId,
        stripeCustomerId: sub.customer as string,
        stripeSubscriptionId: sub.id,
        plan,
        status,
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
      update: {
        plan,
        status,
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
    }),
    // Sincroniza o plano no User para o middleware poder ler no JWT
    prisma.user.update({
      where: { id: userId },
      data: { plan: status === "ACTIVE" || status === "TRIALING" ? plan : "FREE" },
    }),
  ]);
}

// POST /api/stripe/webhook
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) return err("Assinatura ausente", 400);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return err("Assinatura inválida", 400);
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpsert(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata.userId;
        await prisma.$transaction([
          prisma.subscription.update({
            where: { stripeSubscriptionId: sub.id },
            data: { status: "CANCELED" },
          }),
          prisma.user.update({
            where: { id: userId },
            data: { plan: "FREE" },
          }),
        ]);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          await prisma.subscription.update({
            where: { stripeSubscriptionId: invoice.subscription as string },
            data: { status: "PAST_DUE" },
          });
        }
        break;
      }

      default:
        // Eventos não tratados são ignorados (não retornar erro para o Stripe)
        break;
    }

    return ok({ received: true });
  } catch (error) {
    console.error("[Stripe webhook error]", error);
    return err("Erro ao processar evento", 500);
  }
}
