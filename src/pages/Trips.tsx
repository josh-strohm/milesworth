import { Link } from 'react-router-dom';

export function Trips() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trips</h1>
        <Link to="/" className="text-sm text-brand-500 hover:text-brand-400">+ Add trip</Link>
      </div>
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
        <div className="text-center py-8 text-gray-500">
          <p>No trips yet.</p>
          <p className="text-sm mt-2">Your trip log will appear here once you start logging drives.</p>
        </div>
      </div>
    </div>
  );
}
