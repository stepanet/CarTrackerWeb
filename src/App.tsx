import { useState } from 'react';

type Tab = 'works' | 'stats' | 'reminders';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('works');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Шапка */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-xl font-semibold text-gray-900">
          CarTracker
        </h1>
      </header>

      {/* Контент */}
      <main className="flex-1 overflow-y-auto p-4">
        {activeTab === 'works' && (
          <div className="text-gray-500 text-center py-12">
            📋 Здесь будет список работ
          </div>
        )}
        {activeTab === 'stats' && (
          <div className="text-gray-500 text-center py-12">
            📊 Здесь будет статистика
          </div>
        )}
        {activeTab === 'reminders' && (
          <div className="text-gray-500 text-center py-12">
            🔔 Здесь будут напоминания
          </div>
        )}
      </main>

      {/* Нижняя навигация (как в iOS) */}
      <nav className="bg-white border-t border-gray-200 flex">
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
        active
          ? 'text-blue-600'
          : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

export default App;