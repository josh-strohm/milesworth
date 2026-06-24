import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Landing } from '@/pages/Landing';
import { Login } from '@/pages/Login';
import { SignUp } from '@/pages/SignUp';
import { Dashboard } from '@/pages/Dashboard';
import { ActiveTrip } from '@/pages/ActiveTrip';
import { LogTrip } from '@/pages/LogTrip';
import { TripReview } from '@/pages/TripReview';
import { Trips } from '@/pages/Trips';
import { Reports } from '@/pages/Reports';
import { Settings } from '@/pages/Settings';
import { Vehicles } from '@/pages/Vehicles';
import { Privacy } from '@/pages/Privacy';
import { Terms } from '@/pages/Terms';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/trip/active" element={<ActiveTrip />} />
            <Route path="/trip/:id/review" element={<TripReview />} />
            <Route path="/log-trip" element={<LogTrip />} />
            <Route path="/trips" element={<Trips />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/vehicles" element={<Vehicles />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
