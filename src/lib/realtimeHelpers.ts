import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Подписка на изменения таблиц works и sub_works.
 * При любом изменении вызывается onChange.
 */
export function subscribeToWorkChanges(
  userId: string,
  onChange: () => void,
): RealtimeChannel {
  const channel = supabase
    .channel('works-changes')
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
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sub_works',
      },
      () => onChange(),
    )
    .subscribe();

  return channel;
}

/**
 * Подписка на изменения таблицы reminders.
 */
export function subscribeToReminderChanges(
  userId: string,
  onChange: () => void,
): RealtimeChannel {
  return supabase
    .channel('reminders-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reminders',
        filter: `user_id=eq.${userId}`,
      },
      () => onChange(),
    )
    .subscribe();
}