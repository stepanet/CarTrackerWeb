import type { CarWork } from '../models/CarWork';
import type { Reminder } from '../models/Reminder';
import type { BackupData } from '../models/BackupData';
import { CURRENT_BACKUP_VERSION } from '../models/BackupData';

// ═══════════════════════════════════════════════
// Экспорт
// ═══════════════════════════════════════════════

/**
 * Создать BackupData из текущих данных.
 * Формат точно совпадает с iOS-версией (ISO 8601 для дат).
 */
export function createBackupData(
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

/**
 * Скачать бэкап как JSON-файл.
 * Использует Blob + URL.createObjectURL — стандартный браузерный способ.
 */
export function downloadBackupFile(
  works: CarWork[],
  reminders: Reminder[],
): void {
  const backup = createBackupData(works, reminders);

  // Форматируем JSON как в Swift: с отступами для читаемости
  const jsonString = JSON.stringify(backup, null, 2);

  // Создаём файл
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // Имя файла: cartracker_backup_2026-09-23.json
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `cartracker_backup_${dateStr}.json`;

  // Скачиваем
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Освобождаем память
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════
// Импорт
// ═══════════════════════════════════════════════

/** Ошибка импорта */
export class BackupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackupError';
  }
}

/**
 * Прочитать бэкап из файла.
 * Бросает BackupError при любой проблеме.
 */
export async function readBackupFile(file: File): Promise<BackupData> {
  let text: string;
  try {
    text = await file.text();
  } catch (err) {
    throw new BackupError(
      `Не удалось прочитать файл: ${err instanceof Error ? err.message : 'ошибка'}`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new BackupError(
      'Файл повреждён или не является JSON-бэкапом CarTracker.',
    );
  }

  // Проверяем структуру
  if (!isBackupData(parsed)) {
    throw new BackupError(
      'Файл не является бэкапом CarTracker (отсутствуют нужные поля).',
    );
  }

  // Проверяем версию
  if (parsed.version > CURRENT_BACKUP_VERSION) {
    throw new BackupError(
      `Версия бэкапа (${parsed.version}) новее, чем поддерживает приложение (${CURRENT_BACKUP_VERSION}).`,
    );
  }

  return parsed;
}

/** Проверка, что объект похож на BackupData */
function isBackupData(obj: unknown): obj is BackupData {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;

  return (
    typeof o.version === 'number' &&
    typeof o.exportedAt === 'string' &&
    Array.isArray(o.works) &&
    Array.isArray(o.reminders)
  );
}

// ═══════════════════════════════════════════════
// Объединение данных
// ═══════════════════════════════════════════════

export interface MergeResult {
  addedWorks: number;
  skippedWorks: number;
  addedReminders: number;
  skippedReminders: number;
}

/**
 * Объединить бэкап с текущими данными.
 * Дубликаты определяются по `id` — они пропускаются.
 * Возвращает новые массивы + статистику.
 */
export function mergeBackup(
  backup: BackupData,
  currentWorks: CarWork[],
  currentReminders: Reminder[],
): {
  works: CarWork[];
  reminders: Reminder[];
  result: MergeResult;
} {
  // ─── Работы ───
  const existingWorkIds = new Set(currentWorks.map((w) => w.id));
  const newWorks = backup.works.filter((w) => !existingWorkIds.has(w.id));
  const skippedWorks = backup.works.length - newWorks.length;

  // ─── Напоминания ───
  const existingReminderIds = new Set(currentReminders.map((r) => r.id));
  const newReminders = backup.reminders.filter(
    (r) => !existingReminderIds.has(r.id),
  );
  const skippedReminders = backup.reminders.length - newReminders.length;

  return {
    works: [...currentWorks, ...newWorks],
    reminders: [...currentReminders, ...newReminders],
    result: {
      addedWorks: newWorks.length,
      skippedWorks,
      addedReminders: newReminders.length,
      skippedReminders,
    },
  };
}

// ═══════════════════════════════════════════════
// Форматирование результата
// ═══════════════════════════════════════════════

/** Сформировать читаемый текст результата импорта */
export function formatMergeResult(result: MergeResult): string {
  const parts: string[] = [];

  if (result.addedWorks > 0) {
    parts.push(`добавлено работ: ${result.addedWorks}`);
  }
  if (result.skippedWorks > 0) {
    parts.push(`пропущено работ (дубликаты): ${result.skippedWorks}`);
  }
  if (result.addedReminders > 0) {
    parts.push(`добавлено напоминаний: ${result.addedReminders}`);
  }
  if (result.skippedReminders > 0) {
    parts.push(`пропущено напоминаний (дубликаты): ${result.skippedReminders}`);
  }

  return parts.length === 0 ? 'Изменений нет' : parts.join(', ');
}