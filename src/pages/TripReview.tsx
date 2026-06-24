import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { updateTrip } from '@/lib/trips';
import { getVehicles } from '@/lib/vehicles';
import type { Vehicle, TripCategory } from '@/types';
import { supabase } from '@/lib/supabase-client';

export function TripReview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [category, setCategory] = useState<TripCategory>('business');
  const [purpose, setPurpose] = useState('');
  const [miles, setMiles] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from('trips').select('*').eq('id', id).single();
      if (data) {
        setCategory(data.category);
        setPurpose(data.purpose || '');
        setMiles(data.distance_miles.toString());
      }
    })();
  }, [id]);

  const handleSave = async () => {
    if (!id || !miles) return;
    setSaving(true); setError('');
    try {
      await updateTrip(id, {
        category,
        purpose: purpose || null,
        distance_miles: parseFloat(miles),
        user_confirmed: true,
      });
      navigate('/trips');
    } catch (e: any) { setError(e.message); }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Review Trip</h1>
      <p className="text-gray-400 text-sm">Confirm or edit the details of your GPS-detected trip.</p>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">{error}</div>}

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Miles</label>
          <input type="number" step="0.1" min="0.1" value={miles} onChange={e => setMiles(e.target.value)} className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 text-lg" />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Category</label>
          <div className="grid grid-cols-4 gap-2">
            {(['business', 'personal', 'medical', 'charity'] as TripCategory[]).map(cat => (
              <button key={cat} type="button" onClick={() => setCategory(cat)}
                className={`py-2 rounded-lg text-sm font-medium transition-colors capitalize ${category === cat ? 'bg-brand-600 text-white' : 'bg-dark-700 text-gray-400 border border-dark-600'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Purpose</label>
          <input value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="Client meeting, job site, etc." className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100" />
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving} className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors">
          {saving ? 'Saving...' : 'Confirm Trip'}
        </button>
        <button onClick={() => navigate(-1)} className="px-4 py-3 text-gray-400 hover:text-gray-200 transition-colors">Cancel</button>
      </div>
    </div>
  );
}
