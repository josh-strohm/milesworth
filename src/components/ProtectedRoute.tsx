import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
    </div>
  );

  if (!configured) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-brand-500 mb-4">Setup Required</h1>
        <p className="text-gray-400 mb-2">Supabase environment variables are not configured.</p>
        <p className="text-gray-500 text-sm">
          Add <code className="bg-dark-700 px-1 rounded">VITE_SUPABASE_URL</code> and{' '}
          <code className="bg-dark-700 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> to your{' '}
          <code className="bg-dark-700 px-1 rounded">.env.local</code> file.
        </p>
      </div>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
