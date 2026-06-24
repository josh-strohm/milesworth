import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function supabaseUpdate(table, match, body) {
  const params = Object.entries(match).map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`).join("&");
  const url = `${SUPABASE_URL}/rest/v1/${table}?${params}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return res.json();
}

async function supabaseQuery(table, query) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return res.json();
}

async function syncUserSubscription(userId, email) {
  // Strategy 1: Look up via Stripe customer by email, find subscription
  let customer;
  if (email) {
    const byEmail = await stripe.customers.list({ email, limit: 1 });
    if (byEmail.data.length > 0) customer = byEmail.data[0];
  }

  // Strategy 2: Look up via profile's stored customer ID
  if (!customer) {
    const profiles = await supabaseQuery("profiles", `id=eq.${userId}&select=stripe_customer_id`);
    if (profiles[0]?.stripe_customer_id) {
      try {
        customer = await stripe.customers.retrieve(profiles[0].stripe_customer_id);
      } catch (e) { /* customer deleted */ }
    }
  }

  if (!customer) return { status: "none", message: "No Stripe customer found" };

  // Find all subscriptions for this customer
  const subs = await stripe.subscriptions.list({ customer: customer.id, limit: 10 });

  // Prefer active > trialing > past_due > canceled
  const sub = subs.data.find(s => s.status === "active")
    || subs.data.find(s => s.status === "trialing")
    || subs.data.find(s => s.status === "past_due")
    || subs.data[0];

  if (!sub) return { status: "none", message: "No subscriptions found" };

  let status = "none";
  switch (sub.status) {
    case "active": status = "active"; break;
    case "trialing": status = "trialing"; break;
    case "past_due": status = "past_due"; break;
    case "canceled":
    case "unpaid": status = "canceled"; break;
  }

  await supabaseUpdate("profiles", { id: userId }, {
    stripe_customer_id: customer.id,
    subscription_status: status,
    subscription_period_end: new Date(sub.current_period_end * 1000).toISOString(),
  });

  return { status, period_end: sub.current_period_end };
}

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const { userId, email, sessionId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 });
    }

    // If we have a session ID from checkout, use it directly
    if (sessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const subscriptionId = session.subscription;
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          let status = "none";
          switch (sub.status) {
            case "active": status = "active"; break;
            case "trialing": status = "trialing"; break;
            case "past_due": status = "past_due"; break;
            case "canceled":
            case "unpaid": status = "canceled"; break;
          }

          await supabaseUpdate("profiles", { id: userId }, {
            stripe_customer_id: session.customer,
            subscription_status: status,
            subscription_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          });

          return new Response(JSON.stringify({ status, period_end: sub.current_period_end }), { status: 200 });
        }
      } catch (e) {
        console.error("Session lookup failed, falling back to customer search:", e.message);
      }
    }

    // Fallback: search by customer email/ID
    const result = await syncUserSubscription(userId, email);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error("Sync subscription error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const config = {
  path: "/api/sync-subscription",
  method: "POST",
};
