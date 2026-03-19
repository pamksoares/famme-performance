import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { stripe, STRIPE_PLANS } from "@/lib/stripe";
import { ok, err, handleError } from "@/lib/response";

const schema = z.object({
  plan: z.enum(["PRO", "ELITE"]),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

// POST /api/stripe/create-checkout
export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id")!;

  try {
    const body = await req.json();
    const { plan, successUrl, cancelUrl } = schema.parse(body);

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, email: true, name: true, subscription: true },
    });

    if (user.subscription?.plan === plan) {
      return err("Você já está neste plano");
    }

    // Cria ou reutiliza customer Stripe
    let customerId = user.subscription?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: STRIPE_PLANS[plan].priceId,
          quantity: 1,
        },
      ],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: { userId, plan },
      subscription_data: {
        metadata: { userId, plan },
      },
    });

    return ok({ url: session.url, sessionId: session.id });
  } catch (error) {
    return handleError(error);
  }
}
