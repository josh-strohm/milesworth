import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { IRS_BUSINESS_RATE, IRS_YEAR, CURRENCY_FORMAT, MILES_FORMAT } from '@/config/irs-rate';

export function Dashboard() {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hey, {displayName}</h1>
        <p className="text-gray-400 text-sm mt-1">{IRS_YEAR} IRS business rate: {CURRENCY_FORMAT.format(IRS_BUSINESS_RATE)}/mi</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Business Miles</p>
          <p className="text-2xl font-bold text-brand-400 mt-1">{MILES_FORMAT.format(0)}</p>
        </div>
        <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
          <p className="text-xs text-gray-400 uppercase tracking-wide">YTD Deduction</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{CURRENCY_FORMAT.format(0)}</p>
        </div>
      </div>
      <Link to="/trip/active" className="block w-full bg-brand-600 hover:bg-brand-700 text-white text-center font-semibold py-4 rounded-xl transition-colors text-lg">Start Trip</Link>
      <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Monthly Breakdown</h2>
        <div className="text-center py-8 text-gray-500"><p>No trips logged yet.</p><p className="text-sm mt-1">Start your first trip above to see your monthly breakdown here.</p></div>
      </div>
      <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-300">Recent Trips</h2>
          <Link to="/trips" className="text-xs text-brand-500 hover:text-brand-400">View all</Link>
        </div>
        <div className="text-center py-8 text-gray-500"><p>No trips yet.</p><p className="text-sm mt-1">Your logged trips will show up here.</p></div>
      </div>
    </div>
  );
}
