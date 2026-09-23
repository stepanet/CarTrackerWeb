import { useCarWorkStore } from './stores/useCarWorkStore';
import { createCarWork } from './models/CarWork';

function App() {
  const works = useCarWorkStore((s) => s.works);
  const add = useCarWorkStore((s) => s.add);
  const remove = useCarWorkStore((s) => s.remove);

  const handleAdd = () => {
    const work = createCarWork(
      'Тестовая работа',
      'ТО',
      new Date(),
      50000,
      5000,
      'Проверка',
    );
    add(work);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-4">Тест хранилища</h1>

      <div className="flex gap-2 mb-4">
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Добавить работу
        </button>
        <button
          onClick={() => useCarWorkStore.getState().replaceAll([])}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Очистить всё
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-gray-600">
          Всего работ: <span className="font-bold">{works.length}</span>
        </p>

        {works.map((w) => (
          <div
            key={w.id}
            className="bg-white p-3 rounded shadow flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{w.title}</p>
              <p className="text-sm text-gray-500">
                {w.category} • {w.cost.toLocaleString('ru-RU')} ₽ • {w.mileage.toLocaleString('ru-RU')} км
              </p>
            </div>
            <button
              onClick={() => remove(w.id)}
              className="text-red-500 text-sm"
            >
              Удалить
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;