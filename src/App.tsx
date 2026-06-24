import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
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
