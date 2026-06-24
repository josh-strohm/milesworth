export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string | null; business_name: string | null; default_vehicle_id: string | null; stripe_customer_id: string | null; subscription_status: 'none' | 'trialing' | 'active' | 'past_due' | 'canceled'; subscription_period_end: string | null; created_at: string };
        Insert: { id: string; full_name?: string | null; business_name?: string | null; default_vehicle_id?: string | null; stripe_customer_id?: string | null; subscription_status?: 'none' | 'trialing' | 'active' | 'past_due' | 'canceled'; subscription_period_end?: string | null; created_at?: string };
        Update: { id?: string; full_name?: string | null; business_name?: string | null; default_vehicle_id?: string | null; stripe_customer_id?: string | null; subscription_status?: 'none' | 'trialing' | 'active' | 'past_due' | 'canceled'; subscription_period_end?: string | null; created_at?: string };
      };
      vehicles: {
        Row: { id: string; user_id: string; name: string; license_plate: string | null; starting_odometer: number | null; is_default: boolean; archived: boolean; created_at: string };
        Insert: { id?: string; user_id: string; name: string; license_plate?: string | null; starting_odometer?: number | null; is_default?: boolean; archived?: boolean; created_at?: string };
        Update: { id?: string; user_id?: string; name?: string; license_plate?: string | null; starting_odometer?: number | null; is_default?: boolean; archived?: boolean; created_at?: string };
      };
      trips: {
        Row: { id: string; user_id: string; vehicle_id: string; started_at: string; ended_at: string | null; start_address: string | null; end_address: string | null; start_lat: number | null; start_lng: number | null; end_lat: number | null; end_lng: number | null; distance_miles: number; category: 'business' | 'personal' | 'medical' | 'charity'; purpose: string | null; notes: string | null; auto_detected: boolean; user_confirmed: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; vehicle_id: string; started_at: string; ended_at?: string | null; start_address?: string | null; end_address?: string | null; start_lat?: number | null; start_lng?: number | null; end_lat?: number | null; end_lng?: number | null; distance_miles?: number; category?: 'business' | 'personal' | 'medical' | 'charity'; purpose?: string | null; notes?: string | null; auto_detected?: boolean; user_confirmed?: boolean; created_at?: string; updated_at?: string };
        Update: { id?: string; user_id?: string; vehicle_id?: string; started_at?: string; ended_at?: string | null; start_address?: string | null; end_address?: string | null; start_lat?: number | null; start_lng?: number | null; end_lat?: number | null; end_lng?: number | null; distance_miles?: number; category?: 'business' | 'personal' | 'medical' | 'charity'; purpose?: string | null; notes?: string | null; auto_detected?: boolean; user_confirmed?: boolean; created_at?: string; updated_at?: string };
      };
    };
  };
}
