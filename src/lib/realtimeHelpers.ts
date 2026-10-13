import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function subscribeToWorkChanges(
  userId: string,
  onChange: () => void,
): RealtimeChannel {
  const channel = supabase
    .channel(`works-changes-${userId}-${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'works',
        filter: `user_id=eq.${userId}`,
      },
      () => onChange(),
    )
    // sub_works убран — works-событие триггерит fetchAllWorks,
    // который подтянет и подработы
    .subscribe();

  return channel;
}

export function subscribeToReminderChanges(
  userId: string,
  onChange: () => void,
): RealtimeChannel {
  return supabase
    .channel(`reminders-changes-${userId}-${Date.now()}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'reminders',
      filter: `user_id=eq.${userId}`,
    }, () => onChange())
    .subscribe();
}

export function subscribeToVehicleChanges(
  userId: string,
  onChange: () => void,
): RealtimeChannel {
  return supabase
    .channel(`vehicles-changes-${userId}-${Date.now()}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'vehicles',
      filter: `user_id=eq.${userId}`,
    }, () => onChange())
    .subscribe();
}