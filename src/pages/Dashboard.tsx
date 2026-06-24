import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getYTDTrips, getTrips } from '@/lib/trips';
import { getProfile, isPro, FREE_TRIP_LIMIT, canLogTrip } from '@/lib/subscription';
import { getTripsCount } from '@/lib/trips';
import { IRS_BUSINESS_RATE, IRS_YEAR, CURRENCY_FORMAT, MILES_FORMAT } from '@/config/irs-rate';
import type { Trip } from '@/types';

export function Dashboard() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [monthTrips, setMonthTrips] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const year = new Date().getFullYear();
        const [ytdTrips, recent, prof, monthCount] = await Promise.all([
          getYTDTrips(user.id, year),
          getTrips(user.id, { limit: 5 }),
          getProfile(user.id),
          getTripsCount(user.id, new Date().toISOString().slice(0, 7)),
        ]);
        setTrips(ytdTrips);
        setRecentTrips(recent);
        setProfile(prof);
        setMonthTrips(monthCount);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [user]);

  // Sync subscription status after returning from Stripe checkout
  useEffect(() => {
    if (!user || searchParams.get('upgraded') !== 'true') return;
    fetch('/api/sync-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, email: user.email }),
    }).then(() => {
      // Reload profile to reflect updated status
      getProfile(user.id).then(p => setProfile(p));
      setSearchParams({});
    }).catch(() => setSearchParams({}));
  }, [user, searchParams]);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there';
  const businessMiles = trips.filter(t => t.category === 'business').reduce((sum, t) => sum + t.distance_miles, 0);
  const totalMiles = trips.reduce((sum, t) => sum + t.distance_miles, 0);
  const deduction = businessMiles * IRS_BUSINESS_RATE;

  // Monthly breakdown for current year
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = `${new Date().getFullYear()}-${String(i + 1).padStart(2, '0')}`;
    const monthTrips = trips.filter(t => t.started_at.startsWith(month));
    const businessMiles = monthTrips.filter(t => t.category === 'business').reduce((s, t) => s + t.distance_miles, 0);
    return { month, businessMiles, count: monthTrips.length };
  });

  const userIsPro = isPro(profile);
  const tripsLeft = userIsPro ? Infinity : Math.max(0, FREE_TRIP_LIMIT - monthTrips);

  if (loading) {
    return <div className="py-12 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">Hey, {displayName}</h1>
        <p className="text-gray-400 text-sm mt-1">
          {IRS_YEAR} IRS business rate: {CURRENCY_FORMAT.format(IRS_BUSINESS_RATE)}/mi
        </p>
      </div>

      {/* Free tier banner */}
      {!userIsPro && (
        <div className="bg-dark-800 rounded-xl p-3 border border-dark-700 flex items-center justify-between">
          <p className="text-xs text-gray-400">{tripsLeft} free trips left this month</p>
          <Link to="/settings" className="text-xs text-brand-500 hover:text-brand-400">Upgrade to Pro</Link>
        </div>
      )}

      {/* YTD Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Business Miles</p>
          <p className="text-2xl font-bold text-brand-400 mt-1">{MILES_FORMAT.format(businessMiles)}</p>
        </div>
        <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
          <p className="text-xs text-gray-400 uppercase tracking-wide">YTD Deduction</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{CURRENCY_FORMAT.format(deduction)}</p>
        </div>
      </div>

      {/* Start Trip Button */}
      <Link
        to="/trip/active"
        className="block w-full bg-brand-600 hover:bg-brand-700 text-white text-center font-semibold py-4 rounded-xl transition-colors text-lg"
      >
        Start Trip
      </Link>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/log-trip" className="bg-dark-800 rounded-xl p-4 border border-dark-700 text-center hover:border-brand-600/50 transition-colors">
          <p className="text-2xl mb-1">📝</p>
          <p className="text-sm text-gray-300">Log manual trip</p>
        </Link>
        <Link to="/reports" className="bg-dark-800 rounded-xl p-4 border border-dark-700 text-center hover:border-brand-600/50 transition-colors">
          <p className="text-2xl mb-1">📊</p>
          <p className="text-sm text-gray-300">Reports</p>
        </Link>
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Monthly Breakdown</h2>
        {monthlyData.some(m => m.count > 0) ? (
          <div className="space-y-2">
            {monthlyData.filter(m => m.count > 0).reverse().map(m => (
              <div key={m.month} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">
                  {new Date(`${m.month}-01`).toLocaleDateString('en-US', { month: 'short' })}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-gray-300">{MILES_FORMAT.format(m.businessMiles)} mi</span>
                  <span className="text-green-400 w-16 text-right">{CURRENCY_FORMAT.format(m.businessMiles * IRS_BUSINESS_RATE)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-4 text-gray-500 text-sm">No trips this year yet.</p>
        )}
      </div>

      {/* Recent Trips */}
      <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-300">Recent Trips</h2>
          <Link to="/trips" className="text-xs text-brand-500 hover:text-brand-400">View all</Link>
        </div>
        {recentTrips.length > 0 ? (
          <div className="space-y-3">
            {recentTrips.map(trip => (
              <div key={trip.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">
                    {new Date(trip.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {trip.purpose && <span className="text-gray-500 ml-2">· {trip.purpose}</span>}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-300">{MILES_FORMAT.format(trip.distance_miles)} mi</span>
                  <span className="text-xs text-gray-500 ml-2 capitalize">{trip.category}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 text-sm">No trips yet.</div>
        )}
      </div>
    </div>
  );
}
