import { useState, useRef } from 'react';
import type { BackupData } from '../models/BackupData';
import {
  readBackupFile,
  mergeBackup,
  formatMergeResult,
  BackupError,
} from '../stores/backupManager';
import { useCarWorkStore } from '../stores/useCarWorkStore';
import { useReminderStore } from '../stores/useReminderStore';

interface ImportDialogProps {
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (title: string, message: string) => void;
}

export function ImportDialog({ onClose, onSuccess, onError }: ImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backupData, setBackupData] = useState<BackupData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const works = useCarWorkStore((s) => s.works);
  const reminders = useReminderStore((s) => s.reminders);
  const addWork = useCarWorkStore((s) => s.add);
  const addReminder = useReminderStore((s) => s.add);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setBackupData(null);

    try {
      const data = await readBackupFile(file);
      setBackupData(data);
    } catch (err) {
      const message =
        err instanceof BackupError
          ? err.message
          : 'Не удалось прочитать файл';
      onError('Ошибка чтения', message);
      setSelectedFile(null);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleMerge = async () => {
    if (!backupData) return;
    setIsProcessing(true);

    try {
      const merged = mergeBackup(backupData, works, reminders);

      // Импортируем работы по одной (в новой архитектуре)
      let worksAdded = 0;
      let remindersAdded = 0;

      // Работы: только новые (не дубликаты)
      const existingWorkIds = new Set(works.map((w) => w.id));
      const newWorks = merged.works.filter((w) => !existingWorkIds.has(w.id));

      for (const work of newWorks) {
        setProgress(`Импорт работ: ${worksAdded + 1} / ${newWorks.length}`);
        await addWork(work);
        worksAdded++;
      }

      // Напоминания: только новые
      const existingReminderIds = new Set(reminders.map((r) => r.id));
      const newReminders = merged.reminders.filter(
        (r) => !existingReminderIds.has(r.id),
      );

      for (const reminder of newReminders) {
        setProgress(
          `Импорт напоминаний: ${remindersAdded + 1} / ${newReminders.length}`,
        );
        await addReminder(reminder);
        remindersAdded++;
      }

      // Итоговое сообщение
      const resultMessage = formatMergeResult({
        addedWorks: worksAdded,
        skippedWorks: backupData.works.length - worksAdded,
        addedReminders: remindersAdded,
        skippedReminders: backupData.reminders.length - remindersAdded,
      });

      onSuccess(resultMessage);
      onClose();
    } catch (err) {
      onError(
        'Ошибка импорта',
        err instanceof Error ? err.message : 'Неизвестная ошибка',
      );
    } finally {
      setIsProcessing(false);
      setProgress('');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Шапка */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-semibold">Импорт бэкапа</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Загрузка файла */}
          {!backupData ? (
            <>
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <p className="text-4xl mb-2">📁</p>
                <p className="font-medium text-gray-700 mb-1">
                  Выберите JSON-файл
                </p>
                <p className="text-xs text-gray-400">
                  или перетащите файл сюда
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </>
          ) : (
            <>
              {/* Файл выбран — показываем информацию */}
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  📄 {selectedFile?.name}
                </p>
                <p className="text-xs text-blue-700">
                  Работ: <span className="font-semibold">{backupData.works.length}</span>
                  {' • '}
                  Напоминаний: <span className="font-semibold">{backupData.reminders.length}</span>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Создан: {new Date(backupData.exportedAt).toLocaleString('ru-RU')}
                </p>
              </div>

              {/* Что произойдёт */}
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-2">
                <p className="font-medium text-gray-900">Что произойдёт:</p>
                <p>• Новые записи добавятся к существующим в облаке</p>
                <p>• Дубликаты (по ID) будут пропущены</p>
                <p>• Существующие данные не удалятся</p>
              </div>

              {/* Прогресс */}
              {progress && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg p-3">
                  ⏳ {progress}
                </div>
              )}

              {/* Кнопки */}
              <div className="space-y-2">
                <button
                  onClick={handleMerge}
                  disabled={isProcessing}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {isProcessing ? 'Импортируем...' : '📥 Объединить с текущими'}
                </button>

                <button
                  onClick={() => {
                    setBackupData(null);
                    setSelectedFile(null);
                  }}
                  disabled={isProcessing}
                  className="w-full py-2.5 text-gray-600 text-sm hover:text-gray-900 disabled:text-gray-300"
                >
                  Выбрать другой файл
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}