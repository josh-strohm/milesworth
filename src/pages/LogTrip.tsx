import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { addTrip, getTripsCount } from '@/lib/trips';
import { getVehicles } from '@/lib/vehicles';
import { canLogTrip, getProfile, FREE_TRIP_LIMIT } from '@/lib/subscription';
import type { Vehicle, TripCategory } from '@/types';

export function LogTrip() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [miles, setMiles] = useState('');
  const [category, setCategory] = useState<TripCategory>('business');
  const [purpose, setPurpose] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [tripLimitReached, setTripLimitReached] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const v = await getVehicles(user.id);
      setVehicles(v);
      const defaultV = v.find(x => x.is_default);
      if (defaultV) setSelectedVehicle(defaultV.id);
      else if (v.length > 0) setSelectedVehicle(v[0].id);

      // Check free tier
      const profile = await getProfile(user.id);
      const month = new Date().toISOString().slice(0, 7);
      const count = await getTripsCount(user.id, month);
      if (!canLogTrip(profile, count)) setTripLimitReached(true);
    })();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedVehicle || !miles) return;
    setSaving(true); setError('');
    try {
      await addTrip({
        user_id: user.id,
        vehicle_id: selectedVehicle,
        started_at: new Date(`${date}T12:00:00`).toISOString(),
        start_address: startAddress || null,
        end_address: endAddress || null,
        distance_miles: parseFloat(miles),
        category,
        purpose: purpose || null,
        auto_detected: false,
        user_confirmed: true,
      });
      navigate('/trips');
    } catch (e: any) { setError(e.message); }
    setSaving(false);
  };

  if (vehicles.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Log a Trip</h1>
        <div className="bg-dark-800 rounded-xl p-6 border border-dark-700 text-center">
          <p className="text-gray-400 mb-4">Add a vehicle first before logging trips.</p>
          <button onClick={() => navigate('/settings/vehicles')} className="bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
            Add a vehicle
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Log a Trip</h1>

      {tripLimitReached && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm rounded-lg p-3">
          Free tier limit: {FREE_TRIP_LIMIT} trips/month. Upgrade to Pro for unlimited trips.
        </div>
      )}

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Vehicle</label>
          <select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-brand-500">
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}{v.is_default ? ' (default)' : ''}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-brand-500" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Start address</label>
            <input value={startAddress} onChange={e => setStartAddress(e.target.value)} placeholder="123 Main St" className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">End address</label>
            <input value={endAddress} onChange={e => setEndAddress(e.target.value)} placeholder="456 Oak Ave" className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-brand-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Miles *</label>
          <input type="number" step="0.1" min="0.1" value={miles} onChange={e => setMiles(e.target.value)} required placeholder="0.0" className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-brand-500 text-lg" />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Category</label>
          <div className="grid grid-cols-4 gap-2">
            {(['business', 'personal', 'medical', 'charity'] as TripCategory[]).map(cat => (
              <button key={cat} type="button" onClick={() => setCategory(cat)}
                className={`py-2 rounded-lg text-sm font-medium transition-colors capitalize ${category === cat ? 'bg-brand-600 text-white' : 'bg-dark-700 text-gray-400 border border-dark-600 hover:border-dark-500'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Purpose (optional)</label>
          <input value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="Client meeting, job site, etc." className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-brand-500" />
        </div>

        <button type="submit" disabled={saving || tripLimitReached} className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors text-lg">
          {saving ? 'Saving...' : 'Log Trip'}
        </button>
      </form>
    </div>
  );
}
