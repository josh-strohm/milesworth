import { supabase } from '@/lib/supabase-client';
import type { Trip, TripCategory } from '@/types';

export async function getTrips(
  userId: string,
  opts?: { startDate?: string; endDate?: string; category?: TripCategory; vehicleId?: string; limit?: number; offset?: number }
): Promise<Trip[]> {
  let query = supabase
    .from('trips')
    .select('*, vehicle:vehicles(*)')
    .eq('user_id', userId)
    .order('started_at', { ascending: false });

  if (opts?.startDate) query = query.gte('started_at', opts.startDate);
  if (opts?.endDate) query = query.lte('started_at', opts.endDate);
  if (opts?.category) query = query.eq('category', opts.category);
  if (opts?.vehicleId) query = query.eq('vehicle_id', opts.vehicleId);
  if (opts?.limit) query = query.limit(opts.limit);
  if (opts?.offset) query = query.range(opts.offset, opts.offset + (opts.limit || 50) - 1);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function addTrip(trip: {
  user_id: string;
  vehicle_id: string;
  started_at: string;
  ended_at?: string;
  start_address?: string;
  end_address?: string;
  start_lat?: number;
  start_lng?: number;
  end_lat?: number;
  end_lng?: number;
  distance_miles: number;
  category: TripCategory;
  purpose?: string;
  notes?: string;
  auto_detected?: boolean;
  user_confirmed?: boolean;
}): Promise<Trip> {
  const { data, error } = await supabase.from('trips').insert(trip).select('*, vehicle:vehicles(*)').single();
  if (error) throw error;
  return data;
}

export async function updateTrip(id: string, updates: Partial<Pick<Trip, 'category' | 'purpose' | 'notes' | 'distance_miles' | 'start_address' | 'end_address' | 'ended_at' | 'user_confirmed'>>): Promise<void> {
  updates.updated_at = new Date().toISOString();
  const { error } = await supabase.from('trips').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteTrip(id: string): Promise<void> {
  const { error } = await supabase.from('trips').delete().eq('id', id);
  if (error) throw error;
}

export async function getTripsCount(userId: string, month?: string): Promise<number> {
  let query = supabase.from('trips').select('id', { count: 'exact', head: true }).eq('user_id', userId);
  if (month) {
    const start = `${month}-01`;
    const end = new Date(new Date(start).setMonth(new Date(start).getMonth() + 1)).toISOString().slice(0, 10);
    query = query.gte('started_at', start).lt('started_at', end);
  }
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

export async function getYTDTrips(userId: string, year: number): Promise<Trip[]> {
  const startDate = `${year}-01-01T00:00:00`;
  const endDate = `${year}-12-31T23:59:59`;
  return getTrips(userId, { startDate, endDate, limit: 1000 });
}
