export type TripCategory = 'business' | 'personal' | 'medical' | 'charity';

export interface Trip {
  id: string; user_id: string; vehicle_id: string; started_at: string; ended_at: string | null;
  start_address: string | null; end_address: string | null;
  start_lat: number | null; start_lng: number | null; end_lat: number | null; end_lng: number | null;
  distance_miles: number; category: TripCategory; purpose: string | null; notes: string | null;
  auto_detected: boolean; user_confirmed: boolean; created_at: string; updated_at: string;
  vehicle?: Vehicle;
}

export interface Vehicle {
  id: string; user_id: string; name: string; license_plate: string | null;
  starting_odometer: number | null; is_default: boolean; archived: boolean; created_at: string;
}

export interface Profile {
  id: string; full_name: string | null; business_name: string | null; default_vehicle_id: string | null;
  stripe_customer_id: string | null; subscription_status: 'none' | 'trialing' | 'active' | 'past_due' | 'canceled';
  subscription_period_end: string | null; created_at: string;
}

export interface MonthlyStats { month: string; business_miles: number; total_miles: number; deduction: number; trip_count: number; }
export interface YearlyStats { year: number; total_business_miles: number; total_miles: number; total_deduction: number; monthly_breakdown: MonthlyStats[]; }
