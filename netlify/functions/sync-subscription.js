import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findCustomer(userId, email) {
  // 1. Try by metadata
  const byMeta = await stripe.customers.search({
    query: `metadata["supabase_user_id"]:"${userId}"`,
    limit: 1,
  });
  if (byMeta.data.length > 0) return byMeta.data[0];

  // 2. Try by email
  if (email) {
    const byEmail = await stripe.customers.list({ email, limit: 1 });
    if (byEmail.data.length > 0) return byEmail.data[0];
  }

  return null;
}

async function updateProfileFromSub(userId, sub) {
  let status = "none";
  switch (sub.status) {
    case "active": status = "active"; break;
    case "trialing": status = "trialing"; break;
    case "past_due": status = "past_due"; break;
    case "canceled":
    case "unpaid": status = "canceled"; break;
  }

  await supabase.from("profiles").update({
    stripe_customer_id: sub.customer,
    subscription_status: status,
    subscription_period_end: new Date(sub.current_period_end * 1000).toISOString(),
  }).eq("id", userId);

  return { status, period_end: sub.current_period_end };
}

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const { userId, email } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 });
    }

    // Get current profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single();

    // Find the Stripe customer
    let customer;
    if (profile?.stripe_customer_id) {
      try {
        customer = await stripe.customers.retrieve(profile.stripe_customer_id);
      } catch (e) {
        // Customer ID was invalid, search fresh
        customer = await findCustomer(userId, email);
      }
    } else {
      customer = await findCustomer(userId, email);
    }

    if (!customer) {
      return new Response(JSON.stringify({ status: "none", message: "No Stripe customer found" }), { status: 200 });
    }

    // Save customer ID if not already saved
    if (!profile?.stripe_customer_id || profile.stripe_customer_id !== customer.id) {
      await supabase.from("profiles").update({
        stripe_customer_id: customer.id,
      }).eq("id", userId);
    }

    // Find active subscription
    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      limit: 10,
    });

    const sub = subs.data.find(s =>
      ["active", "trialing", "past_due"].includes(s.status)
    ) || subs.data.find(s => s.status === "canceled") || subs.data[0];

    if (sub) {
      const result = await updateProfileFromSub(userId, sub);
      return new Response(JSON.stringify(result), { status: 200 });
    }

    return new Response(JSON.stringify({ status: "none", message: "No subscriptions found" }), { status: 200 });
  } catch (error) {
    console.error("Sync subscription error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const config = {
  path: "/api/sync-subscription",
  method: "POST",
};
