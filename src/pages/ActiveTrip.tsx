import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentPosition, haversineDistance, isIOS, type GeoPosition } from '@/lib/geo';
import { addTrip } from '@/lib/trips';
import { getVehicles } from '@/lib/vehicles';
import { getProfile, canLogTrip, FREE_TRIP_LIMIT } from '@/lib/subscription';
import { getTripsCount } from '@/lib/trips';
import type { Vehicle } from '@/types';

type Phase = 'idle' | 'starting' | 'tracking' | 'ending' | 'saving' | 'done' | 'manual';

export function ActiveTrip() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [startPos, setStartPos] = useState<GeoPosition | null>(null);
  const [endPos, setEndPos] = useState<GeoPosition | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [tripLimitReached, setTripLimitReached] = useState(false);

  // Manual entry fields (fallback when GPS fails)
  const [manualStart, setManualStart] = useState('');
  const [manualEnd, setManualEnd] = useState('');
  const [manualMiles, setManualMiles] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      const v = await getVehicles(user.id);
      setVehicles(v);
      const defaultV = v.find(x => x.is_default);
      if (defaultV) setSelectedVehicle(defaultV.id);
      else if (v.length > 0) setSelectedVehicle(v[0].id);

      const profile = await getProfile(user.id);
      const month = new Date().toISOString().slice(0, 7);
      const count = await getTripsCount(user.id, month);
      if (!canLogTrip(profile, count)) setTripLimitReached(true);
    })();
  }, [user]);

  const startTrip = async () => {
    setError('');
    setPhase('starting');
    try {
      const pos = await getCurrentPosition({ enableHighAccuracy: true, timeout: 20000 });
      setStartPos(pos);
      setPhase('tracking');
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } catch (e: any) {
      setError(e.message);
      setPhase('idle');
    }
  };

  const endTrip = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('ending');
    try {
      const pos = await getCurrentPosition({ enableHighAccuracy: true, timeout: 20000 });
      setEndPos(pos);
      if (startPos) {
        const dist = haversineDistance(startPos.lat, startPos.lng, pos.lat, pos.lng);
        setDistance(dist);
      }
      setPhase('saving');
    } catch (e: any) {
      // GPS failed on end — offer manual distance entry
      setError(e.message + ' Enter your distance manually below.');
      setPhase('manual');
    }
  };

  const saveTrip = async (opts: { distance: number; startAddress?: string; endAddress?: string; autoDetected?: boolean }) => {
    if (!user || !selectedVehicle) return;
    setPhase('saving');
    try {
      await addTrip({
        user_id: user.id,
        vehicle_id: selectedVehicle,
        started_at: startPos ? new Date(Date.now() - elapsed * 1000).toISOString() : new Date().toISOString(),
        ended_at: new Date().toISOString(),
        start_lat: startPos?.lat ?? null,
        start_lng: startPos?.lng ?? null,
        end_lat: endPos?.lat ?? null,
        end_lng: endPos?.lng ?? null,
        start_address: opts.startAddress || null,
        end_address: opts.endAddress || null,
        distance_miles: opts.distance,
        category: 'business',
        auto_detected: opts.autoDetected ?? false,
        user_confirmed: !opts.autoDetected,
      });
      setDistance(opts.distance);
      setPhase('done');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (e: any) {
      setError(e.message);
      setPhase('tracking');
    }
  };

  const handleManualSave = () => {
    const miles = parseFloat(manualMiles);
    if (!miles || miles <= 0) return;
    saveTrip({ distance: miles, startAddress: manualStart || undefined, endAddress: manualEnd || undefined, autoDetected: false });
  };

  const cancelTrip = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('idle');
    setStartPos(null);
    setEndPos(null);
    setDistance(null);
    setElapsed(0);
    setError('');
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (vehicles.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Start Trip</h1>
        <div className="bg-dark-800 rounded-xl p-6 border border-dark-700 text-center">
          <p className="text-gray-400 mb-4">Add a vehicle first before starting a trip.</p>
          <button onClick={() => navigate('/settings/vehicles')} className="bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
            Add a vehicle
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Start Trip</h1>

      {tripLimitReached && phase === 'idle' && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm rounded-lg p-3">
          Free tier limit: {FREE_TRIP_LIMIT} trips/month. Upgrade to Pro for unlimited trips.
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">
          {error}
          {phase !== 'manual' && (
            <button onClick={() => { setError(''); setPhase('manual'); }} className="block mt-2 text-brand-400 underline text-xs">
              Log this trip manually instead
            </button>
          )}
        </div>
      )}

      {/* Vehicle selector */}
      {phase === 'idle' && (
        <div>
          <label className="block text-sm text-gray-400 mb-1">Vehicle</label>
          <select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100">
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
      )}

      {/* Manual entry mode */}
      {phase === 'manual' && (
        <div className="bg-dark-800 rounded-xl p-4 border border-dark-700 space-y-3">
          <p className="text-sm text-gray-300 font-medium">Log trip manually</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Start address</label>
              <input value={manualStart} onChange={e => setManualStart(e.target.value)} placeholder="123 Main St" className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-gray-100" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">End address</label>
              <input value={manualEnd} onChange={e => setManualEnd(e.target.value)} placeholder="456 Oak Ave" className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-gray-100" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Miles *</label>
            <input type="number" step="0.1" min="0.1" value={manualMiles} onChange={e => setManualMiles(e.target.value)} placeholder="0.0" className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 text-lg" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleManualSave} disabled={!manualMiles} className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors">
              Save Trip
            </button>
            <button onClick={cancelTrip} className="px-4 py-2.5 text-gray-400 hover:text-gray-200 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Big status card */}
      {(phase !== 'manual') && (
        <div className="bg-dark-800 rounded-2xl p-8 border border-dark-700 text-center">
          {phase === 'idle' && (
            <>
              <div className="text-6xl mb-4">🚗</div>
              <p className="text-gray-400 mb-6">Ready to start tracking</p>
              {isIOS() && (
                <p className="text-xs text-gray-500 mb-4">Your browser will ask for location permission. Tap "Allow".</p>
              )}
              <button onClick={startTrip} disabled={tripLimitReached || !selectedVehicle}
                className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-colors text-lg">
                Start Trip
              </button>
            </>
          )}

          {phase === 'starting' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Getting your location...</p>
              <p className="text-xs text-gray-500 mt-2">Accept the location prompt if you see one</p>
            </>
          )}

          {phase === 'tracking' && (
            <>
              <div className="text-6xl mb-2">📍</div>
              <p className="text-brand-400 font-mono text-3xl font-bold mb-2">{formatTime(elapsed)}</p>
              <p className="text-gray-400 mb-2">Trip in progress</p>
              <p className="text-xs text-gray-500 mb-6">
                Started at {startPos ? `${startPos.lat.toFixed(4)}, ${startPos.lng.toFixed(4)}` : '...'}
              </p>
              <div className="flex gap-3">
                <button onClick={endTrip} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-colors text-lg">
                  End Trip
                </button>
                <button onClick={cancelTrip} className="px-4 py-4 text-gray-400 hover:text-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </>
          )}

          {phase === 'ending' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Getting destination...</p>
            </>
          )}

          {(phase === 'saving' || phase === 'done') && distance !== null && (
            <>
              <div className="text-6xl mb-2">✅</div>
              <p className="text-4xl font-bold text-brand-400 mb-2">{distance} mi</p>
              <p className="text-gray-400 mb-2">
                {phase === 'done' ? 'Trip saved!' : 'Trip complete'}
              </p>
              {phase === 'saving' && (
                <button onClick={() => saveTrip({ distance, autoDetected: true })} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition-colors mt-4">
                  Save Trip
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* GPS info */}
      {(startPos || endPos) && (
        <div className="bg-dark-800 rounded-xl p-4 border border-dark-700 text-xs text-gray-500 space-y-1">
          {startPos && <p>Start: {startPos.lat.toFixed(6)}, {startPos.lng.toFixed(6)}</p>}
          {endPos && <p>End: {endPos.lat.toFixed(6)}, {endPos.lng.toFixed(6)}</p>}
        </div>
      )}
    </div>
  );
}
