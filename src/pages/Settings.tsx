import { useAuth } from '@/contexts/AuthContext';

export function Settings() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Profile</h2>
        <div className="space-y-3">
          <div><p className="text-xs text-gray-500">Name</p><p className="text-gray-200">{user?.user_metadata?.full_name || 'Not set'}</p></div>
          <div><p className="text-xs text-gray-500">Email</p><p className="text-gray-200">{user?.email}</p></div>
        </div>
      </div>
      <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Vehicles</h2>
        <p className="text-gray-500 text-sm">Vehicle management coming in Week 1.</p>
      </div>
      <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Billing</h2>
        <p className="text-gray-500 text-sm">Subscription management coming in Week 3.</p>
      </div>
      <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Privacy</h2>
        <p className="text-gray-400 text-sm">Your data is yours. We never see your trips in a human-readable way. No bank linking. No ads. No upsells. Cancel anytime.</p>
      </div>
    </div>
  );
}
