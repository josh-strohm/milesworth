import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { addVehicle } from '@/lib/vehicles';

export function AddVehicle({ onAdded }: { onAdded?: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setSaving(true); setError('');
    try {
      await addVehicle(user.id, name.trim(), plate.trim() || undefined, true);
      if (onAdded) onAdded();
      else navigate('/dashboard');
    } catch (e: any) { setError(e.message); }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Add a vehicle</h1>
      <p className="text-gray-400 text-sm">You need at least one vehicle before logging trips.</p>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Vehicle name *</label>
          <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Work Truck" className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-brand-500" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">License plate (optional)</label>
          <input value={plate} onChange={e => setPlate(e.target.value)} placeholder="ABC-1234" className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-brand-500" />
        </div>
        <button type="submit" disabled={saving} className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors">
          {saving ? 'Saving...' : 'Save vehicle'}
        </button>
      </form>
    </div>
  );
}
