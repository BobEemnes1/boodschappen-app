import { supabase } from './supabase';

let cachedHouseholdId = null;

export function clearHouseholdCache() {
  cachedHouseholdId = null;
}

async function getHouseholdId() {
  if (cachedHouseholdId) return cachedHouseholdId;
  const { data, error } = await supabase
    .from('profiles')
    .select('household_id')
    .single();
  if (error) throw error;
  cachedHouseholdId = data.household_id;
  return cachedHouseholdId;
}

export async function loadList() {
  const { data, error } = await supabase
    .from('groceries')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addItem(text) {
  const householdId = await getHouseholdId();
  const { data, error } = await supabase
    .from('groceries')
    .insert({ text, household_id: householdId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateItem(id, changes) {
  const { data, error } = await supabase
    .from('groceries')
    .update(changes)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteItem(id) {
  const { error } = await supabase.from('groceries').delete().eq('id', id);
  if (error) throw error;
}

export { getHouseholdId };
