import { supabase } from '@/lib/supabase-client';
import type { Vehicle } from '@/types';

export async function getVehicles(userId: string): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('user_id', userId)
    .eq('archived', false)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addVehicle(userId: string, name: string, licensePlate?: string, isDefault?: boolean): Promise<Vehicle> {
  // If this is the first vehicle or isDefault, unset other defaults
  if (isDefault) {
    await supabase.from('vehicles').update({ is_default: false }).eq('user_id', userId);
  }
  const { data, error } = await supabase
    .from('vehicles')
    .insert({ user_id: userId, name, license_plate: licensePlate || null, is_default: isDefault ?? false })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateVehicle(id: string, updates: Partial<Pick<Vehicle, 'name' | 'license_plate' | 'is_default' | 'archived'>>): Promise<void> {
  if (updates.is_default) {
    const vehicle = await getVehicle(id);
    await supabase.from('vehicles').update({ is_default: false }).eq('user_id', vehicle.user_id);
  }
  const { error } = await supabase.from('vehicles').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteVehicle(id: string): Promise<void> {
  const { error } = await supabase.from('vehicles').update({ archived: true }).eq('id', id);
  if (error) throw error;
}

async function getVehicle(id: string): Promise<Vehicle> {
  const { data, error } = await supabase.from('vehicles').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function getDefaultVehicle(userId: string): Promise<Vehicle | null> {
  const { data } = await supabase.from('vehicles').select('*').eq('user_id', userId).eq('is_default', true).single();
  return data;
}
