import Stripe from "stripe";
import { Plan } from "@prisma/client";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
  typescript: true,
});

export const STRIPE_PLANS: Record<
  Exclude<Plan, "FREE">,
  { priceId: string; name: string; amountBRL: number }
> = {
  PRO: {
    priceId: process.env.STRIPE_PRICE_PRO!,
    name: "Pro",
    amountBRL: 2900,
  },
  ELITE: {
    priceId: process.env.STRIPE_PRICE_ELITE!,
    name: "Elite",
    amountBRL: 5900,
  },
};
