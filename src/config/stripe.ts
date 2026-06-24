// Stripe price IDs — set these after creating products in Stripe Dashboard
// Monthly: $5.00/mo, Yearly: $39.00/yr
export const STRIPE_PRICE_MONTHLY = import.meta.env.VITE_STRIPE_PRICE_MONTHLY || '';
export const STRIPE_PRICE_YEARLY = import.meta.env.VITE_STRIPE_PRICE_YEARLY || '';

export const PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$5',
    period: '/mo',
    priceId: STRIPE_PRICE_MONTHLY,
    yearly: false,
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '$39',
    period: '/yr',
    priceId: STRIPE_PRICE_YEARLY,
    yearly: true,
    badge: 'Save 35%',
  },
] as const;
