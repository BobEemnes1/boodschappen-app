import { supabase } from './supabase';

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

/**
 * Aanroepen na signUp: maakt een nieuw huishouden aan of voegt gebruiker
 * toe aan een bestaand huishouden via een join-code (household UUID).
 *
 * Vereist de volgende RPC-functie in Supabase SQL Editor:
 *
 * create or replace function public.create_household_and_profile(
 *   p_household_name text,
 *   p_join_household_id uuid default null
 * )
 * returns void language plpgsql security definer as $$
 * declare v_household_id uuid;
 * begin
 *   if p_join_household_id is not null then
 *     select id into v_household_id from public.households where id = p_join_household_id;
 *     if v_household_id is null then
 *       raise exception 'Huishouden niet gevonden';
 *     end if;
 *   else
 *     insert into public.households (name) values (p_household_name) returning id into v_household_id;
 *   end if;
 *   insert into public.profiles (id, household_id) values (auth.uid(), v_household_id);
 * end;
 * $$;
 */
export async function createProfile(householdName, joinCode = null) {
  const { error } = await supabase.rpc('create_household_and_profile', {
    p_household_name: householdName || 'Mijn huishouden',
    p_join_household_id: joinCode || null,
  });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
