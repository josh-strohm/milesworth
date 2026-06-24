import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getTrips, deleteTrip } from '@/lib/trips';
import type { Trip, TripCategory } from '@/types';
import { IRS_BUSINESS_RATE, CURRENCY_FORMAT, MILES_FORMAT } from '@/config/irs-rate';

export function Trips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<TripCategory | ''>('');
  const [filterMonth, setFilterMonth] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const opts: any = { limit: 200 };
      if (filterCategory) opts.category = filterCategory as TripCategory;
      if (filterMonth) {
        opts.startDate = `${filterMonth}-01T00:00:00`;
        const end = new Date(new Date(`${filterMonth}-01`).setMonth(new Date(`${filterMonth}-01`).getMonth() + 1));
        opts.endDate = end.toISOString();
      }
      const data = await getTrips(user.id, opts);
      setTrips(data);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user, filterCategory, filterMonth]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this trip?')) return;
    try { await deleteTrip(id); await load(); } catch (e: any) { setError(e.message); }
  };

  const totalBusinessMiles = trips.filter(t => t.category === 'business').reduce((sum, t) => sum + t.distance_miles, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trips</h1>
        <Link to="/log-trip" className="text-sm text-brand-500 hover:text-brand-400">+ Log trip</Link>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">{error}</div>}

      {/* Filters */}
      <div className="flex gap-2">
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value as TripCategory | '')}
          className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-gray-100">
          <option value="">All categories</option>
          <option value="business">Business</option>
          <option value="personal">Personal</option>
          <option value="medical">Medical</option>
          <option value="charity">Charity</option>
        </select>
        <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
          className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-gray-100" />
      </div>

      {/* Summary */}
      {trips.length > 0 && (
        <div className="bg-dark-800 rounded-xl p-4 border border-dark-700 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">{trips.length} trips</p>
            <p className="text-sm text-gray-300">{MILES_FORMAT.format(totalBusinessMiles)} business miles</p>
          </div>
          <p className="text-lg font-bold text-green-400">{CURRENCY_FORMAT.format(totalBusinessMiles * IRS_BUSINESS_RATE)}</p>
        </div>
      )}

      {/* Trip list */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading trips...</div>
      ) : trips.length === 0 ? (
        <div className="bg-dark-800 rounded-xl p-8 border border-dark-700 text-center">
          <p className="text-gray-400 mb-4">No trips found.</p>
          <Link to="/log-trip" className="bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-block">
            Log your first trip
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {trips.map(trip => (
            <div key={trip.id} className="bg-dark-800 rounded-xl p-4 border border-dark-700">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                      trip.category === 'business' ? 'bg-brand-600/20 text-brand-400' :
                      trip.category === 'medical' ? 'bg-blue-600/20 text-blue-400' :
                      trip.category === 'charity' ? 'bg-purple-600/20 text-purple-400' :
                      'bg-gray-600/20 text-gray-400'
                    }`}>{trip.category}</span>
                    {trip.auto_detected && <span className="text-xs text-gray-500">GPS</span>}
                  </div>
                  <p className="text-sm text-gray-300">
                    {new Date(trip.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  {trip.purpose && <p className="text-xs text-gray-500 mt-1 truncate">{trip.purpose}</p>}
                  {trip.start_address && trip.end_address && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{trip.start_address} → {trip.end_address}</p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <p className="font-bold text-gray-100">{MILES_FORMAT.format(trip.distance_miles)} mi</p>
                  <p className="text-xs text-green-400">{CURRENCY_FORMAT.format(trip.distance_miles * IRS_BUSINESS_RATE)}</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <Link to={`/trip/${trip.id}/review`} className="text-xs text-gray-400 hover:text-brand-400 transition-colors">Edit</Link>
                <button onClick={() => handleDelete(trip.id)} className="text-xs text-gray-400 hover:text-red-400 transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
