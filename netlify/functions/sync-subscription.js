import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 });
    }

    // Look up the customer by user ID
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single();

    if (!profile?.stripe_customer_id) {
      // No customer ID yet — check if there's a subscription via metadata
      const customers = await stripe.customers.list({
        limit: 100,
      });

      const customer = customers.data.find(
        (c) => c.metadata?.supabase_user_id === userId
      );

      if (!customer) {
        return new Response(JSON.stringify({ status: "none", message: "No Stripe customer found" }), { status: 200 });
      }

      // Found customer — save it and check subscription
      await supabase.from("profiles").update({
        stripe_customer_id: customer.id,
      }).eq("id", userId);

      const subs = await stripe.subscriptions.list({
        customer: customer.id,
        status: "active",
        limit: 1,
      });

      if (subs.data.length > 0) {
        const sub = subs.data[0];
        let status = "none";
        switch (sub.status) {
          case "active": status = "active"; break;
          case "trialing": status = "trialing"; break;
          case "past_due": status = "past_due"; break;
          case "canceled":
          case "unpaid": status = "canceled"; break;
        }

        await supabase.from("profiles").update({
          subscription_status: status,
          subscription_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        }).eq("id", userId);

        return new Response(JSON.stringify({ status, period_end: sub.current_period_end }), { status: 200 });
      }

      return new Response(JSON.stringify({ status: "none", message: "No active subscription" }), { status: 200 });
    }

    // Customer ID exists — check subscription directly
    const subs = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      limit: 10,
    });

    // Find the most recent active/trialing/past_due subscription
    const sub = subs.data.find(s =>
      ["active", "trialing", "past_due"].includes(s.status)
    ) || subs.data[0];

    if (sub) {
      let status = "none";
      switch (sub.status) {
        case "active": status = "active"; break;
        case "trialing": status = "trialing"; break;
        case "past_due": status = "past_due"; break;
        case "canceled":
        case "unpaid": status = "canceled"; break;
      }

      await supabase.from("profiles").update({
        subscription_status: status,
        subscription_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      }).eq("id", userId);

      return new Response(JSON.stringify({ status, period_end: sub.current_period_end }), { status: 200 });
    }

    return new Response(JSON.stringify({ status: "none" }), { status: 200 });
  } catch (error) {
    console.error("Sync subscription error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const config = {
  path: "/api/sync-subscription",
  method: "POST",
};
