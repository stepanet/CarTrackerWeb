import type { CarWork } from './CarWork';
import type { Reminder } from './Reminder';

/**
 * Обёртка для бэкапа.
 * Точно совпадает с BackupData в Swift.
 * Используется для экспорта/импорта в JSON.
 */
export interface BackupData {
  version: number;         // 1
  exportedAt: string;      // ISO 8601
  works: CarWork[];
  reminders: Reminder[];
}

/** Текущая версия формата бэкапа */
export const CURRENT_BACKUP_VERSION = 1;

/** Создать бэкап из текущих данных */
export function createBackup(
  works: CarWork[],
  reminders: Reminder[],
): BackupData {
  return {
    version: CURRENT_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    works,
    reminders,
  };
}