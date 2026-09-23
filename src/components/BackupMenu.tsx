import { useState, useRef, useEffect } from 'react';
import { useCarWorkStore } from '../stores/useCarWorkStore';
import { useReminderStore } from '../stores/useReminderStore';
import { downloadBackupFile } from '../stores/backupManager';

interface BackupMenuProps {
  onImportClick: () => void;
  onShowAlert: (title: string, message: string) => void;
}

export function BackupMenu({ onImportClick, onShowAlert }: BackupMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const works = useCarWorkStore((s) => s.works);
  const reminders = useReminderStore((s) => s.reminders);

  // Закрываем меню по клику вне
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleExport = () => {
    try {
      if (works.length === 0 && reminders.length === 0) {
        onShowAlert('Нечего экспортировать', 'Сначала добавьте хотя бы одну запись.');
        setIsOpen(false);
        return;
      }

      downloadBackupFile(works, reminders);
      setIsOpen(false);
    } catch (err) {
      onShowAlert(
        'Ошибка экспорта',
        err instanceof Error ? err.message : 'Неизвестная ошибка',
      );
      setIsOpen(false);
    }
  };

  const handleImportClick = () => {
    onImportClick();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Меню"
      >
        <span className="text-2xl leading-none">⋯</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 py-1 min-w-[220px] z-50">
          <button
            onClick={handleExport}
            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-sm"
          >
            <span className="text-lg">📤</span>
            <div>
              <p className="font-medium text-gray-900">Экспорт бэкапа</p>
              <p className="text-xs text-gray-500">Скачать JSON-файл</p>
            </div>
          </button>

          <div className="h-px bg-gray-100 mx-2 my-1" />

          <button
            onClick={handleImportClick}
            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-sm"
          >
            <span className="text-lg">📥</span>
            <div>
              <p className="font-medium text-gray-900">Импорт из файла</p>
              <p className="text-xs text-gray-500">
                Объединить с текущими данными
              </p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}