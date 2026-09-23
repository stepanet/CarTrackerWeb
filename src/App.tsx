import { useState } from 'react';
import { WorksList } from './components/works/WorksList';
import { StatsView } from './components/stats/StatsView';
import { RemindersList } from './components/reminders/RemindersList';

type Tab = 'works' | 'stats' | 'reminders';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('works');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-20">
        <h1 className="text-xl font-semibold text-gray-900">CarTracker</h1>
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
          icon="📋"
          label="Работы"
        />
        <TabButton
          active={activeTab === 'stats'}
          onClick={() => setActiveTab('stats')}
          icon="📊"
          label="Статистика"
        />
        <TabButton
          active={activeTab === 'reminders'}
          onClick={() => setActiveTab('reminders')}
          icon="🔔"
          label="Напоминания"
        />
      </nav>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: string;
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
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

export default App;