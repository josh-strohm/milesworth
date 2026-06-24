import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Direct REST calls — avoids Supabase JS client WebSocket issue on Node 20
async function supabaseQuery(table, query = "") {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return res.json();
}

async function supabaseUpdate(table, match, body) {
  const params = Object.entries(match).map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`).join("&");
  const url = `${SUPABASE_URL}/rest/v1/${table}?${params}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return res.json();
}

async function findCustomer(userId, email) {
  // 1. Try by metadata
  try {
    const byMeta = await stripe.customers.search({
      query: `metadata["supabase_user_id"]:"${userId}"`,
      limit: 1,
    });
    if (byMeta.data.length > 0) return byMeta.data[0];
  } catch (e) {
    // Search API might not be available on all plans
  }

  // 2. Try by email
  if (email) {
    const byEmail = await stripe.customers.list({ email, limit: 1 });
    if (byEmail.data.length > 0) return byEmail.data[0];
  }

  return null;
}

async function updateProfile(userId, customerId, sub) {
  let status = "none";
  switch (sub.status) {
    case "active": status = "active"; break;
    case "trialing": status = "trialing"; break;
    case "past_due": status = "past_due"; break;
    case "canceled":
    case "unpaid": status = "canceled"; break;
  }

  const updateData = {
    subscription_status: status,
    subscription_period_end: new Date(sub.current_period_end * 1000).toISOString(),
  };
  if (customerId) updateData.stripe_customer_id = customerId;

  await supabaseUpdate("profiles", { id: userId }, updateData);
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
    const profiles = await supabaseQuery("profiles", `id=eq.${userId}&select=stripe_customer_id`);
    const profile = profiles[0];

    // Find the Stripe customer
    let customer;
    if (profile?.stripe_customer_id) {
      try {
        customer = await stripe.customers.retrieve(profile.stripe_customer_id);
      } catch (e) {
        customer = await findCustomer(userId, email);
      }
    } else {
      customer = await findCustomer(userId, email);
    }

    if (!customer) {
      return new Response(JSON.stringify({ status: "none", message: "No Stripe customer found" }), { status: 200 });
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
      const needsCustomerId = !profile?.stripe_customer_id || profile.stripe_customer_id !== customer.id;
      const result = await updateProfile(userId, needsCustomerId ? customer.id : null, sub);
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
