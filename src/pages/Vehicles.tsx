import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getVehicles, addVehicle, updateVehicle, deleteVehicle } from '@/lib/vehicles';
import type { Vehicle } from '@/types';

export function Vehicles() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    try {
      const v = await getVehicles(user.id);
      setVehicles(v);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setSaving(true); setError('');
    try {
      await addVehicle(user.id, name.trim(), plate.trim() || undefined, isDefault || vehicles.length === 0);
      setName(''); setPlate(''); setIsDefault(false); setShowForm(false);
      await load();
    } catch (e: any) { setError(e.message); }
    setSaving(false);
  };

  const handleSetDefault = async (id: string) => {
    try {
      await updateVehicle(id, { is_default: true });
      await load();
    } catch (e: any) { setError(e.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Archive this vehicle?')) return;
    try {
      await deleteVehicle(id);
      await load();
    } catch (e: any) { setError(e.message); }
  };

  if (loading) return <div className="py-12 text-center text-gray-500">Loading vehicles...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vehicles</h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="text-sm text-brand-500 hover:text-brand-400">+ Add vehicle</button>
        )}
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">{error}</div>}

      {showForm && (
        <form onSubmit={handleAdd} className="bg-dark-800 rounded-xl p-4 border border-dark-700 space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Vehicle name *</label>
            <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Work Truck" className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">License plate (optional)</label>
            <input value={plate} onChange={e => setPlate(e.target.value)} placeholder="ABC-1234" className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-brand-500" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} className="rounded border-dark-600" />
            Set as default vehicle
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors">
              {saving ? 'Saving...' : 'Save vehicle'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors">Cancel</button>
          </div>
        </form>
      )}

      {vehicles.length === 0 && !showForm && (
        <div className="bg-dark-800 rounded-xl p-8 border border-dark-700 text-center">
          <p className="text-gray-400 mb-4">No vehicles yet.</p>
          <button onClick={() => setShowForm(true)} className="bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
            Add your first vehicle
          </button>
        </div>
      )}

      {vehicles.map(v => (
        <div key={v.id} className="bg-dark-800 rounded-xl p-4 border border-dark-700 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-100">{v.name}</p>
              {v.is_default && <span className="text-xs bg-brand-600/20 text-brand-400 px-2 py-0.5 rounded-full">Default</span>}
            </div>
            {v.license_plate && <p className="text-sm text-gray-500 mt-1">{v.license_plate}</p>}
          </div>
          <div className="flex gap-2">
            {!v.is_default && (
              <button onClick={() => handleSetDefault(v.id)} className="text-xs text-gray-400 hover:text-brand-400 transition-colors">Set default</button>
            )}
            <button onClick={() => handleDelete(v.id)} className="text-xs text-gray-400 hover:text-red-400 transition-colors">Remove</button>
          </div>
        </div>
      ))}
    </div>
  );
}
