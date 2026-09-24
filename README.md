# CarTrackerWeb — веб-версия CarTracker

Веб-версия iOS-приложения **CarTracker** для учёта работ по автомобилю.
Работает как PWA, синхронизируется через облако, устанавливается на домашний экран iPhone.

## 🌐 Live URL

**https://car-tracker-web-pi.vercel.app**

## Статус (обновлено: 2026-09-24)

**Текущая версия: v3.0** ✅

### ✅ Реализовано

**🔐 Аутентификация**
- [x] Вход / регистрация по email + пароль (Supabase Auth)
- [x] Сохранение сессии в localStorage
- [x] Защита приложения (без входа — только экран Auth)
- [x] Кнопка «Выйти» в шапке
- [x] Русские сообщения об ошибках

**☁️ Облачная синхронизация (Supabase)**
- [x] Работы в Supabase (Postgres)
- [x] Подработы в Supabase
- [x] Напоминания в Supabase
- [x] Row Level Security — каждый видит только свои данные
- [x] Realtime-синхронизация между устройствами (WebSocket)
- [x] Миграция localStorage → облако при первом входе
- [x] Оптимистичные обновления с откатом при ошибке

**📋 Работы**
- [x] Модель `CarWork` с категориями
- [x] CRUD: добавление / редактирование / удаление
- [x] Поиск и фильтр по категориям
- [x] Сводка «Всего / За год / Записей»

**🔧 Подработки внутри работ**
- [x] Модель `SubItem` (работа / деталь)
- [x] Секции «🔧 Работы» и «🔩 Детали» в форме
- [x] Автопересчёт стоимости работы
- [x] Детальный экран работы с разбивкой
- [x] Отображение в списке (значки)

**📊 Статистика 2.0**
- [x] Разбивка расходов на работы и детали
- [x] Stacked bar по месяцам (синий + оранжевый)
- [x] Пунктирная линия среднего расхода
- [x] Donut с суммой в центре
- [x] Блок «Топ-5 затрат» с переключателем

**🔔 Напоминания**
- [x] Модель `Reminder`
- [x] Карточки с прогресс-баром и статусами (🟢🟡🔴⚪)
- [x] «Сделано сегодня», вкл/выкл, редактирование, удаление
- [x] Типовой набор из 4 напоминаний

**📤 Экспорт / импорт**
- [x] Экспорт бэкапа в JSON
- [x] Импорт с объединением (дубликаты по id пропускаются)
- [x] Совместимость с iOS-бэкапами (bidirectional)

**📱 PWA**
- [x] Манифест, иконки, Service Worker
- [x] Установка на домашний экран iOS
- [x] Работа офлайн
- [x] Автодеплой на Vercel

### ⚠️ Ограничения (по сравнению с iOS)
- Нет push-уведомлений
- Нет фоновой проверки напоминаний (у веба нет аналога `BGTaskScheduler`)

## Технологии

**Frontend:**
- React 18 + TypeScript
- Vite + vite-plugin-pwa
- Tailwind CSS v4
- Recharts (графики)
- Zustand (state)

**Backend (Supabase):**
- PostgreSQL (данные)
- Supabase Auth (аутентификация)
- Row Level Security (изоляция данных)
- Realtime (WebSocket-подписки)

**Хостинг:**
- Vercel (автодеплой при push)

## Локальная разработка

```bash
# 1. Установить зависимости
npm install

# 2. Создать .env.local с ключами Supabase
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
EOF

# 3. Запустить
npm run dev                 # http://localhost:5173
npm run build               # production-сборка
npm run preview -- --host   # preview с доступом по сети


src/
├── lib/
│   ├── supabase.ts          — клиент Supabase
│   ├── worksApi.ts          — API работ + подработ
│   ├── remindersApi.ts      — API напоминаний
│   └── realtimeHelpers.ts   — Realtime-подписки
├── models/
│   ├── CarWork.ts
│   ├── SubItem.ts
│   ├── Reminder.ts
│   └── BackupData.ts
├── hooks/
│   └── useAuth.ts           — хук аутентификации
├── stores/
│   ├── useCarWorkStore.ts   — Zustand + Supabase (работы)
│   ├── useReminderStore.ts  — Zustand + Supabase (напоминания)
│   ├── statsHelpers.ts
│   └── backupManager.ts
├── components/
│   ├── AuthScreen.tsx       — экран входа / регистрации
│   ├── works/               — компоненты работ
│   ├── stats/               — компоненты статистики
│   ├── reminders/           — компоненты напоминаний
│   ├── BackupMenu.tsx
│   └── ImportDialog.tsx
├── utils/
│   └── format.ts
└── App.tsx                  — TabView с тремя вкладками



**Замените `ВАШ_ЛОГИН`** на ваш GitHub-логин (в разделе «Связанные проекты»).

**Сохраните.**

---

## 📄 Шаг 2. Обновляем `CHANGELOG.md`

Откройте `~/Documents/Projects/CarTrackerWeb/CHANGELOG.md`. **Добавьте сверху** (после `# Changelog`):

```markdown
## [3.0] — 2026-09-24

Облачная синхронизация через Supabase. Аутентификация. Realtime.

### Added

**Аутентификация (Supabase Auth)**
- Экран входа / регистрации `AuthScreen`
- Хук `useAuth` — сессия, вход, выход
- Защита приложения (без входа — редирект на AuthScreen)
- Кнопка «Выйти» в шапке
- Русские сообщения об ошибках

**Backend (Supabase)**
- Проект Supabase с тремя таблицами: `works`, `sub_works`, `reminders`
- Row Level Security (RLS) — каждый видит только свои данные
- 12 политик доступа (4 на каждую таблицу)
- Realtime Replication для мгновенной синхронизации
- Триггеры `updated_at`

**Слой API (`src/lib/`)**
- `supabase.ts` — клиент Supabase
- `worksApi.ts` — CRUD работ + подработ, миграция
- `remindersApi.ts` — CRUD напоминаний, миграция
- `realtimeHelpers.ts` — подписки на изменения

**Синхронизация в сторах**
- `useCarWorkStore` переписан: Supabase вместо localStorage
- `useReminderStore` переписан: Supabase вместо localStorage
- Оптимистичные обновления с откатом при ошибке
- Realtime-подписки: изменения с других устройств приходят автоматически
- Методы `loadWorks`, `subscribeRealtime`, `clearWorks`
- Идемпотентная миграция из localStorage (пропуск дубликатов)

**Bootstrap в App.tsx**
- Загрузка данных при входе пользователя
- Миграция localStorage → Supabase
- Две Realtime-подписки (работы + напоминания)
- Очистка при выходе

### Fixed
- Правильный порядок хуков в `App.tsx` (Invalid hook call)
- TypeScript strict: `user` narrowing в `useEffect`
- Дубликаты при повторной миграции

### Changed
- Убраны `persist` middleware из Zustand (данные в облаке)
- `replaceAll` удалён из сторов (импорт через поштучное добавление)

### Notes
- Веб-версия полностью синхронизирована с облаком
- Работает между всеми устройствами в реальном времени
- Формат JSON-бэкапа совместим с iOS

## [2.0] — 2026-09-24

Подработки внутри работ и статистика 2.0. Полная совместимость с iOS.

### Added
- Модель `SubItem` (работа / деталь)
- Секции «🔧 Работы» и «🔩 Детали» в форме
- Автопересчёт стоимости
- Детальный экран работы
- Статистика 2.0: разбивка, stacked bar, топ-5
- Утилита `format.ts`

### Fixed
- Тап по строке работы открывает детальный экран
- Уникальный key в топ-5

## [1.0] — 2026-09-23

Первый релиз веб-версии: работы, статистика, напоминания, PWA.