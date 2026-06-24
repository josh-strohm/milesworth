export const IRS_BUSINESS_RATE = 0.725;
export const IRS_YEAR = 2026;
export const IRS_RATES = { business: 0.725, medical: 0.22, charity: 0.14 } as const;
export const CURRENCY_FORMAT = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const MILES_FORMAT = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
