import { useState, useEffect } from 'react';
import { WorksList } from './components/works/WorksList';
import { StatsView } from './components/stats/StatsView';
import { RemindersList } from './components/reminders/RemindersList';
import { BackupMenu } from './components/BackupMenu';
import { ImportDialog } from './components/ImportDialog';
import { AuthScreen } from './components/AuthScreen';
import { useAuth } from './hooks/useAuth';
import { useCarWorkStore } from './stores/useCarWorkStore';
import { useReminderStore } from './stores/useReminderStore';
import { ListTodo, BarChart3, Bell } from 'lucide-react';

type Tab = 'works' | 'stats' | 'reminders';

interface AlertMessage {
  title: string;
  message: string;
}

function App() {
  const { user, loading, signOut } = useAuth();

  const loadWorks = useCarWorkStore((s) => s.loadWorks);
  const subscribeWorksRealtime = useCarWorkStore((s) => s.subscribeRealtime);
  const clearWorks = useCarWorkStore((s) => s.clearWorks);
  const migrateWorksFromLocalStorage = useCarWorkStore(
    (s) => s.migrateFromLocalStorage,
  );

  const loadReminders = useReminderStore((s) => s.loadReminders);
  const subscribeRemindersRealtime = useReminderStore(
    (s) => s.subscribeRealtime,
  );
  const clearReminders = useReminderStore((s) => s.clearReminders);
  const migrateRemindersFromLocalStorage = useReminderStore(
    (s) => s.migrateFromLocalStorage,
  );

  const [activeTab, setActiveTab] = useState<Tab>('works');
  const [showingImport, setShowingImport] = useState(false);
  const [alert, setAlert] = useState<AlertMessage | null>(null);

  useEffect(() => {
    if (!user) {
      clearWorks();
      clearReminders();
      return;
    }

    const currentUser = user;

    async function bootstrap() {
      try {
        const worksMigrated = await migrateWorksFromLocalStorage(currentUser.id);
        if (worksMigrated > 0) {
          console.log(`✅ Мигрировано работ: ${worksMigrated}`);
        }

        const remindersMigrated = await migrateRemindersFromLocalStorage(
          currentUser.id,
        );
        if (remindersMigrated > 0) {
          console.log(`✅ Мигрировано напоминаний: ${remindersMigrated}`);
        }

        await loadWorks(currentUser.id);
        await loadReminders(currentUser.id);

        subscribeWorksRealtime(currentUser.id);
        subscribeRemindersRealtime(currentUser.id);
      } catch (err) {
        console.error('Ошибка инициализации:', err);
      }
    }

    bootstrap();
  }, [
    user,
    loadWorks,
    loadReminders,
    subscribeWorksRealtime,
    subscribeRemindersRealtime,
    clearWorks,
    clearReminders,
    migrateWorksFromLocalStorage,
    migrateRemindersFromLocalStorage,
  ]);

  const showAlert = (title: string, message: string) => {
    setAlert({ title, message });
  };

  const handleSignOut = async () => {
    if (confirm('Выйти из аккаунта?')) {
      try {
        clearWorks();
        clearReminders();
        await signOut();
      } catch (err) {
        showAlert(
          'Ошибка',
          err instanceof Error ? err.message : 'Не удалось выйти',
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-blue-600 flex items-center justify-center text-3xl animate-pulse">
            🚗
          </div>
          <p className="text-sm text-gray-500">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">CarTracker</h1>
          <div className="flex items-center gap-2">
            <BackupMenu
              onImportClick={() => setShowingImport(true)}
              onShowAlert={showAlert}
            />
            <button
              onClick={handleSignOut}
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Выйти"
              title="Выйти"
            >
              🚪
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        {activeTab === 'works' && <WorksList />}
        {activeTab === 'stats' && <StatsView />}
        {activeTab === 'reminders' && <RemindersList />}
      </main>

      <nav className="bg-white border-t border-gray-200 flex sticky bottom-0 z-20">
        <TabButton
          active={activeTab === 'works'}
          onClick={() => setActiveTab('works')}
          icon={<ListTodo />}
          label="Работы"
        />
        <TabButton
          active={activeTab === 'stats'}
          onClick={() => setActiveTab('stats')}
          icon={<BarChart3 />}
          label="Статистика"
        />
        <TabButton
          active={activeTab === 'reminders'}
          onClick={() => setActiveTab('reminders')}
          icon={<Bell />}
          label="Напоминания"
        />
      </nav>

      {showingImport && (
        <ImportDialog
          onClose={() => setShowingImport(false)}
          onSuccess={(msg) => showAlert('Импорт завершён', msg)}
          onError={showAlert}
        />
      )}

      {alert && (
        <AlertDialog
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center py-3 transition-colors ${
        active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      <span className="mb-1">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

interface AlertDialogProps {
  title: string;
  message: string;
  onClose: () => void;
}

function AlertDialog({ title, message, onClose }: AlertDialogProps) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 text-center">
          <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="w-full py-3 border-t border-gray-200 font-medium text-blue-600 hover:bg-gray-50"
        >
          OK
        </button>
      </div>
    </div>
  );
}

export default App;