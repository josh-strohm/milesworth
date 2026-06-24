import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PLANS, STRIPE_PRICE_MONTHLY, STRIPE_PRICE_YEARLY } from '@/config/stripe';

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  reason?: string;
}

export function PaywallModal({ open, onClose, reason }: PaywallModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleUpgrade = async (priceId: string) => {
    if (!user) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId: user.id,
          email: user.email,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to start checkout');
      }
    } catch (e: any) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-dark-800 rounded-2xl border border-dark-700 p-6 max-w-sm w-full space-y-5">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-300">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
          <h2 className="text-xl font-bold mb-1">Upgrade to Pro</h2>
          {reason && <p className="text-amber-400 text-sm mb-2">{reason}</p>}
          <p className="text-gray-400 text-sm">Unlimited trips, GPS auto-detect, and all features.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">{error}</div>
        )}

        <div className="space-y-3">
          {PLANS.map(plan => (
            <button
              key={plan.id}
              onClick={() => handleUpgrade(plan.priceId)}
              disabled={loading || !plan.priceId}
              className={`w-full rounded-xl p-4 border transition-colors text-left ${
                plan.yearly
                  ? 'bg-brand-600/10 border-brand-600/50 hover:border-brand-500'
                  : 'bg-dark-700 border-dark-600 hover:border-dark-500'
              } ${loading ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-100">{plan.price}{plan.period}</span>
                    {plan.badge && (
                      <span className="text-xs bg-brand-600 text-white px-2 py-0.5 rounded-full">{plan.badge}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {plan.yearly ? '$3.25/mo billed annually' : '$5.00/mo billed monthly'}
                  </p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">7-day free trial · Cancel anytime · No commitment</p>
        </div>
      </div>
    </div>
  );
}
