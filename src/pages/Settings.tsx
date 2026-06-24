import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getProfile, updateProfile, isPro } from '@/lib/subscription';
import type { Profile } from '@/types';

export function Settings() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const p = await getProfile(user.id);
      setProfile(p);
      setFullName(p?.full_name || '');
      setBusinessName(p?.business_name || '');
    })();
  }, [user]);

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

  const userIsPro = isPro(profile);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

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
          <p className="text-green-400 text-sm">Pro plan active</p>
        ) : (
          <div>
            <p className="text-gray-400 text-sm mb-2">Free tier · 5 trips/month</p>
            <div className="bg-dark-700 rounded-lg p-3 border border-dark-600">
              <p className="text-sm text-gray-200 font-medium">Upgrade to Pro</p>
              <p className="text-xs text-gray-400 mt-1">$5/mo or $39/yr · Unlimited trips + GPS</p>
              <button disabled className="w-full mt-2 bg-dark-600 text-gray-500 font-medium py-2 rounded-lg cursor-not-allowed text-sm">
                Coming in Week 3
              </button>
            </div>
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
