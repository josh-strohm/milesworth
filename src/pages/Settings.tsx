import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getProfile, updateProfile, isPro, openCustomerPortal } from '@/lib/subscription';
import { PLANS } from '@/config/stripe';
import type { Profile } from '@/types';

export function Settings() {
  const { user, signOut } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [upgraded, setUpgraded] = useState(searchParams.get('upgraded') === 'true');
  const sessionId = searchParams.get('session_id');
  const [checkoutLoading, setCheckoutLoading] = useState('');
  const [checkoutError, setCheckoutError] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      const p = await getProfile(user.id);
      setProfile(p);
      setFullName(p?.full_name || '');
      setBusinessName(p?.business_name || '');

      // Auto-sync subscription status from Stripe
      try {
        const res = await fetch('/api/sync-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, email: user.email, sessionId: sessionId || undefined }),
        });
        const data = await res.json();
        if (data.status && data.status !== 'none') {
          const updated = await getProfile(user.id);
          setProfile(updated);
        }
      } catch (e) { /* ignore sync errors */ }
    })();
  }, [user]);

  useEffect(() => {
    const sid = searchParams.get('session_id');
    if ((upgraded || sid) && user) {
      fetch('/api/sync-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email, sessionId: sid || undefined }),
      }).then(async () => {
        const updated = await getProfile(user.id);
        setProfile(updated);
      }).catch(() => {});
      const timer = setTimeout(() => { setUpgraded(false); setSearchParams({}); }, 8000);
      return () => clearTimeout(timer);
    }
  }, [upgraded, user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user.id, { full_name: fullName || null, business_name: businessName || null });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handlePortal = async () => {
    if (!profile?.stripe_customer_id) return;
    const url = await openCustomerPortal(profile.stripe_customer_id);
    if (url) window.location.href = url;
  };

  const handleUpgrade = async (priceId: string, planId: string) => {
    if (!user || !priceId) return;
    setCheckoutLoading(planId); setCheckoutError('');
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, userId: user.id, email: user.email }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError(data.error || 'Failed to start checkout');
      }
    } catch (e) {
      setCheckoutError('Network error. Please try again.');
    }
    setCheckoutLoading('');
  };

  const userIsPro = isPro(profile);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Upgrade success banner */}
      {upgraded && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg p-3">
          Welcome to Pro! Your account has been upgraded.
        </div>
      )}

      {/* Profile */}
      <div className="bg-dark-800 rounded-xl p-4 border border-dark-700 space-y-3">
        <h2 className="text-sm font-semibold text-gray-300">Profile</h2>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Name</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name"
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Business name (optional)</label>
          <input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Your business"
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100" />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSave} disabled={saving}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
            {saving ? 'Saving...' : 'Save'}
          </button>
          {saved && <span className="text-sm text-green-400">Saved!</span>}
        </div>
      </div>

      {/* Vehicles */}
      <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-300">Vehicles</h2>
          <Link to="/settings/vehicles" className="text-xs text-brand-500 hover:text-brand-400">Manage</Link>
        </div>
        <p className="text-gray-500 text-sm">Add and manage your tracked vehicles.</p>
      </div>

      {/* Billing */}
      <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
        <h2 className="text-sm font-semibold text-gray-300 mb-2">Billing</h2>
        {userIsPro ? (
          <div>
            <p className="text-green-400 text-sm mb-2">
              Pro plan · {profile?.subscription_status === 'trialing' ? 'Free trial active' : 'Active'}
            </p>
            {profile?.subscription_period_end && (
              <p className="text-xs text-gray-500 mb-3">
                {profile.subscription_status === 'trialing' ? 'Trial ends' : 'Renews'}{' '}
                {new Date(profile.subscription_period_end).toLocaleDateString()}
              </p>
            )}
            <button onClick={handlePortal}
              className="w-full bg-dark-700 hover:bg-dark-600 border border-dark-600 text-gray-200 font-medium py-2 rounded-lg transition-colors text-sm">
              Manage subscription
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-gray-400 text-sm">Free tier · 5 trips/month</p>

            {checkoutError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">{checkoutError}</div>
            )}

            {PLANS.map(plan => (
              <button
                key={plan.id}
                onClick={() => handleUpgrade(plan.priceId, plan.id)}
                disabled={!plan.priceId || checkoutLoading !== ''}
                className={`w-full bg-dark-700 rounded-lg p-4 border transition-colors text-left ${
                  plan.yearly ? 'border-brand-600/50 hover:border-brand-500' : 'border-dark-600 hover:border-dark-500'
                } ${checkoutLoading === plan.id ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-200">{plan.price}{plan.period}</span>
                      {plan.badge && (
                        <span className="text-xs bg-brand-600 text-white px-2 py-0.5 rounded-full">{plan.badge}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {plan.yearly ? '$3.25/mo billed annually' : '7-day free trial'}
                    </p>
                  </div>
                  <div className="text-right">
                    {checkoutLoading === plan.id ? (
                      <span className="text-xs text-brand-400">Redirecting...</span>
                    ) : (
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            ))}

            <p className="text-xs text-gray-500 text-center">All plans include: Unlimited trips, GPS auto-detect, IRS reports</p>
          </div>
        )}
      </div>

      {/* Privacy */}
      <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
        <h2 className="text-sm font-semibold text-gray-300 mb-2">Privacy</h2>
        <p className="text-gray-400 text-sm">
          Your data is yours. We never see your trips in a human-readable way. No bank linking. No ads. No upsells. Cancel anytime.
        </p>
      </div>

      {/* Sign out */}
      <button onClick={signOut} className="w-full text-center text-gray-400 hover:text-gray-200 text-sm py-3 transition-colors">
        Sign out
      </button>
    </div>
  );
}
