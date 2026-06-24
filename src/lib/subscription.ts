import { supabase } from '@/lib/supabase-client';
import type { Profile } from '@/types';

export const FREE_TRIP_LIMIT = 5;

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) return null;
  return data;
}

export async function updateProfile(userId: string, updates: Partial<Pick<Profile, 'full_name' | 'business_name'>>): Promise<void> {
  const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
  if (error) throw error;
}

export function isPro(profile: Profile | null): boolean {
  return profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing';
}

export function canLogTrip(profile: Profile | null, currentMonthTrips: number): boolean {
  if (isPro(profile)) return true;
  return currentMonthTrips < FREE_TRIP_LIMIT;
}
