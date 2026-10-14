# CarTracker — PROJECT CONTEXT

> Единый контекст для iOS-приложения и веб-версии. Обе платформы
> работают с одной базой Supabase и синхронизируются через Realtime.

## 🎯 Что это
Учёт работ, расходов и напоминаний о ТО для одного или нескольких
транспортных средств. Две клиентские платформы: **iOS (SwiftUI)** и
**Web (React + PWA + Capacitor для Android)**, общая база и Realtime.

---

## 📍 Текущий статус

### iOS: версия 3.3 (2026-10-12)
- Экспорт статистики в PDF
- Design Tokens, анимации, haptics
- Сравнение по годам, виджет, гараж

### Web: версия 0.4 (2026-10-14)
- Полный паритет с iOS v3.3 по функционалу
- Все 4 вкладки, PDF/CSV/JSON-экспорт, сравнение по годам
- Design Tokens 1:1 с iOS
- **Опережает iOS:** бэкап включает `vehicles`

### Фазы разработки
- ✅ **Фаза 1** — синхронизация (Realtime, bootstrap, RLS)
- ✅ **Фаза 2** — догон фич iOS (сравнение по годам, PDF, CSV, бэкап)
- ✅ **Фаза 3** — дизайн-полировка (токены, SectionHeader, ScreenHeader)
- ⏸ Анимации (spring) — сознательно не делаем в вебе

---

## 🏗 Стек

### iOS
- Swift 5.9+, SwiftUI, Swift Charts
- iOS 16.0+
- Supabase (Auth + Realtime + Postgres) через `supabase-swift` 2.x
- WidgetKit (Widget Extension `CarTrackerWidget`)
- App Group: `group.com.stepanet.CarTracker`
- Background Tasks (`BGAppRefreshTask`)
- UserNotifications
- Хранение: Supabase (основное) + UserDefaults (App Group для виджета)

### Web
- React 19 + TypeScript 6 + Vite 8
- Tailwind CSS 4 (CSS-first, через `@tailwindcss/vite`)
- Zustand 5 (persist для `activeVehicleId`)
- Recharts 3 (графики)
- `@supabase/supabase-js` 2.x
- `pdf-lib` + `@pdf-lib/fontkit` (PDF-экспорт)
- `lucide-react` (иконки)
- `vite-plugin-pwa` (PWA)
- `@capacitor/*` 8.x (сборка Android)
- `oxlint` (линтер)
- Деплой: Vercel — https://car-tracker-web-pi.vercel.app

---

## 🗂 Архитектура

### Общая модель данных (Supabase)
Таблицы: `works`, `sub_works`, `reminders`, `vehicles`
- `REPLICA IDENTITY FULL` на всех 4 (для Realtime DELETE)
- Realtime-публикация `supabase_realtime` — все 4 таблицы
- RLS: `auth.uid() = user_id` для works / reminders / vehicles;
  для sub_works — через EXISTS по `works.user_id`
- Триггеры `handle_updated_at()` — BEFORE UPDATE на works / reminders / vehicles

### iOS — MVVM
- **Models:** `CarWork`, `SubItem`, `Reminder`, `Vehicle`, `BackupData`,
  `MonthComparison`, `YearlyComparisonResult`
- **Stores / Repositories:** `CarWorkStore`, `ReminderStore`, `VehicleStore`
  (singleton, async CRUD, фильтр по `activeVehicleId`),
  `AuthManager` (Keychain), `SupabaseService`, `WorksRepository`,
  `RemindersRepository`, `VehiclesRepository`, `RealtimeManager`,
  `BackgroundTaskManager`, `BackupManager`, `StatsPDFExporter`,
  `WidgetDataService`
- **Views (4 вкладки TabView):**
  1. **Работы** (`WorksListView`) — поиск, фильтр, переключатель ТС,
     `+` и `⋯`
  2. **Статистика** (`StatsView`) — сводка, MonthlyChart, CategoryChart,
     YearComparisonChart, TopItemsChart, экспорт PDF
  3. **Напоминания** (`RemindersView`) — статусы 🟢🟡🔴⚪, прогресс-бар
  4. **Гараж** (`GarageView`) — карточки ТС, свайп-редактирование
- **Компоненты UI:** `CardStyle`, `ScreenHeader`, `SectionHeader`,
  `YearComparisonChart`, `VehicleCardView`, `VehicleFormView`,
  `VehicleSwitcherView`, `WorkDetailView`, `SubItemFormView`, `AuthView`,
  `ShareSheet`
- **Виджет:** `systemSmall` (ТС + ближайшее напоминание),
  `systemMedium` (топ-3 + расходы за месяц)
  ⚠️ После переустановки виджет нужно пересоздать

### Web — Feature-based
```
src/
├── main.tsx, App.tsx          — точка входа, роутинг по 4 табам
├── models/                    — модели 1:1 с iOS
│   ├── CarWork.ts, SubItem.ts, Reminder.ts, Vehicle.ts, BackupData.ts
├── lib/                       — API-слой
│   ├── supabase.ts            — клиент Supabase
│   ├── worksApi.ts, remindersApi.ts, vehiclesApi.ts — CRUD
│   └── realtimeHelpers.ts     — Realtime-подписки
│   └── statsPdfExporter.ts    — PDF через pdf-lib
├── stores/                    — Zustand
│   ├── useCarWorkStore.ts
│   ├── useReminderStore.ts
│   ├── useVehicleStore.ts     — persist activeVehicleId
│   ├── backupManager.ts       — JSON/CSV экспорт-импорт
│   └── statsHelpers.ts        — сравнение по годам, топ-N, месяцы
├── hooks/
│   └── useAuth.ts             — Supabase Auth
├── components/
│   ├── ScreenHeader.tsx, SectionHeader.tsx, BottomNav.tsx
│   ├── VehicleSwitcher.tsx
│   ├── AuthScreen.tsx
│   ├── BackupMenu.tsx, ImportDialog.tsx
│   ├── works/                 — WorksList, WorkRow, WorkForm, WorkDetail,
│   │                            SubItemForm, SubItemRow
│   ├── stats/                 — StatsView, MonthlyChart, CategoryChart,
│   │                            YearComparisonChart, TopItemsChart,
│   │                            ExportPDFButton
│   ├── reminders/             — RemindersList, ReminderCard, ReminderForm
│   └── vehicles/              — GarageView, VehicleCard, VehicleForm
├── styles/
│   └── tokens.ts              — Spacing, Radius, CARD_STYLE,
│                                SCREEN_HEADER_*, SECTION_HEADER_*
└── public/fonts/              — Roboto-Regular.ttf, Roboto-Bold.ttf
```

---

## 🔗 Общие точки между платформами

- **База:** Supabase, общая для iOS и Web
- **Формат JSON-бэкапа:** совместим
  - iOS v1: `{version, exportedAt, works, reminders}`
  - Web v1+: `{version, exportedAt, works, reminders, vehicles?}`
  - `version` остаётся `1`, чтобы iOS мог читать веб-бэкапы
    (Swift Codable игнорирует неизвестные поля)
- **Realtime:** обе платформы подписаны на `works`, `reminders`, `vehicles`
  с фильтром по `user_id`. `sub_works` **не** подписывается отдельно —
  изменения приходят через `works` + `fetchAllWorks` (тянет подработы)
- **`vehicle_id`:** nullable в `works` и `reminders`, мигрируется через
  `migrateOrphans` при bootstrap
- **Напоминания и статусы:** идентичная логика (`ok` / `soon` / `overdue` /
  `disabled`, пороги: 30 дней, 1000 км)
- **Категории и типы:** русские строки для категорий, латиница для
  `SubItemType` / `ReminderStatus` / `VehicleType` — идентичны на обеих
  платформах

---

## ✅ Ключевые решения

### Общие
- **Supabase** вместо локального хранилища (с iOS v2.0) — единая база
- **RLS-политики** — все таблицы привязаны к `auth.uid()`
- **Realtime DELETE** — через `REPLICA IDENTITY FULL`

### iOS
- Singleton-сторы (`CarWorkStore`, `ReminderStore`, `VehicleStore`)
- Фильтрация по `activeVehicleId` в сторах
- Кастомные `init(from:)` в моделях — совместимость со старыми бэкапами
- `.sheet(item:)` с enum `ActiveSheet` — вместо конфликтующих `.sheet(isPresented:)`
- Design Tokens (`Spacing`, `Radius`)
- Spring-анимации + haptics
- `Text(verbatim:)` для годов без разделителя тысяч

### Web
- **Zustand + persist** для `activeVehicleId` (localStorage)
- **Optimistic updates** с откатом при ошибке (`add` / `update` / `remove`)
- **Realtime до load** — подписки создаются **до** `loadWorks`, чтобы
  не терять события в окне загрузки
- **Уникальные имена каналов** — `${table}-${userId}-${Date.now()}`,
  защита от коллизий при 2 вкладках / Capacitor
- **Bootstrap-защита** от двойного запуска в React StrictMode
  (флаг `cancelled` в `useEffect`)
- **Подписка только на `works`** (не `sub_works`) — `works`-событие
  триггерит `fetchAllWorks`, который тянет и подработы. Экономит
  Realtime-трафик и убирает утечку (у `sub_works` нет `user_id`)
- **pdf-lib вместо pdfmake** — pdfmake несовместим с Vite/ESM
  (UMD-обёртки, `vfs_fonts`, `optimizeDeps`), pdf-lib — чистый ESM,
  шрифты подгружаются через `fetch` + `fontkit`
- **Шрифты Roboto** (`public/fonts/Roboto-*.ttf`) — для кириллицы в PDF
- **Web Share API** с fallback на скачивание — аналог `ShareSheet` в iOS
- **CSV-формат** — разделитель `;`, BOM для Excel, `dd.MM.yyyy`,
  пробел как разделитель тысяч (`3 500`)

---

## ⚠️ Известные ограничения

### iOS
- Фоновые задачи не гарантируют точное время (раз в день или реже)
- Полностью закрытое свайпом приложение не получает фоновые задачи
- iCloud-синхронизация отложена до платного Apple Developer Program
- После переустановки приложения виджет нужно пересоздать

### Web
- **Анимации (spring) не делаем** — сознательное решение. Ховер-эффекты
  и базовые transitions — по желанию
- **PWA / Capacitor Android** — настроено, но в релиз не выводилось
- **Пуш-уведомления** — не реализованы (в iOS — `UserNotifications`)
- **PDF-шрифты** — `Roboto-Regular.ttf` и `Roboto-Bold.ttf`
  в `public/fonts/`, обязательны для кириллицы

### Асимметрия между платформами
- **iOS не бэкапит `vehicles`**. Web — бэкапит.
  - Web экспортирует `version: 1` с опциональным `vehicles` —
    iOS читает и игнорирует это поле (Swift Codable)
  - Web читает бэкапы без `vehicles` — подставляет `[]`
  - **При импорте iOS теряет ТС из бэкапа** — надо обновлять iOS

---

## 🚧 Открытые вопросы / TODO

### Критично
- [ ] **iOS: бэкап с vehicles** — добавить `vehicles: [Vehicle]?`
  в `BackupData.swift`, обновить `merge()`, UI экспорта/импорта.
  После этого — поднять `version = 2` в обеих платформах, в iOS
  изменить `guard backup.version <= 2`

### Возможное развитие
- [ ] **Android через Capacitor** — уже в `package.json`, надо
  собрать и проверить
- [ ] **PWA-уведомления** — аналог iOS `UserNotifications`
- [ ] **Экспорт Excel (xlsx)** — сейчас только CSV
- [ ] **История расходов с фильтрами по датам** — в iOS нет, идея
- [ ] **График динамики пробега** — в iOS нет, идея
- [ ] **Тесты** — `statsHelpers`, `backupManager`, `ReminderCalculator`
  (iOS) — не покрыты

### Технический долг
- [ ] **`normalizeCost` / `recalculateCost`** в `useCarWorkStore.ts` —
  дублируют друг друга, объединить
- [ ] **`AlertDialog` / `ImportDialog`** в web — не порталы
  (`createPortal`), могут обрезаться родителем с `overflow: hidden`
- [ ] **`useAuth` без контекста** — пока хук, при росте дерева
  лучше вынести в React Context

---

## 📝 Соглашения

- **Русский язык** для дат, сообщений об ошибках, документации
- **Комментарии и docstring** — на русском
- **Changelog** — по версиям с датами, как в iOS
- **Категории работ** — русские строки (`'ТО'`, `'Ремонт'`, ...),
  совпадают с iOS `WorkCategory.rawValue`
- **`SubItemType` / `ReminderStatus` / `VehicleType`** — латиница,
  совпадают с iOS
- **Формат дат** — ISO 8601 в БД, `dd.MM.yyyy` в CSV, `d MMM yyyy`
  в UI
- **Формат денег** — `3 500 ₽` (пробел как разделитель, ru-RU)
- **Имя файла бэкапа** — `cartracker_backup_YYYY-MM-DD.json`
- **Имя файла CSV** — `cartracker_works_YYYY-MM-DD.csv`
- **Имя файла PDF** — `cartracker_stats_<vehicle>_YYYY-MM-DD.pdf`

---

## 🔄 Как работать с новым чатом

1. **Скинуть этот файл** (`PROJECT_CONTEXT.md`) + указать текущую задачу
2. **Скинуть конкретные файлы** для задачи (по 3–5 за раз)
3. **Одна фича = один чат** (или одна фаза)
4. **В конце** — коммит, обновление `PROJECT_CONTEXT.md` при
   необходимости

**Формат стартового сообщения:**
> Продолжаем разработку CarTracker (iOS + Web).
> Контекст: [PROJECT_CONTEXT.md]
> Платформа: [iOS / Web / обе]
> Задача: [что делаем]
> Ограничения: [если есть]

---

## 📚 История версий

### iOS
- **3.3** (2026-10-12) — PDF-экспорт статистики, полировка UI
- **3.2** — сравнение расходов по годам
- **3.1** — виджет iOS, переработка тулбаров
- **3.0** — Гараж (несколько ТС)
- **2.0** — Supabase, Auth, Realtime
- **1.3** — подработки, расширенная статистика
- **1.2** — фоновые задачи
- **1.1** — экспорт/импорт JSON, CSV
- **1.0** — первый релиз

### Web
- **0.4** (2026-10-14) — паритет с iOS v3.3
  - Сравнение по годам, PDF, CSV, бэкап с vehicles
  - Design Tokens 1:1 с iOS, `SectionHeader`, `ScreenHeader`
  - **Фиксы синхронизации:**
    - Realtime: убран `sub_works`, уникальные каналы
    - Bootstrap: StrictMode-защита, подписки до load
    - `useVehicleStore.remove`: откат `activeVehicleId`
  - **Технические решения:**
    - `pdf-lib` вместо `pdfmake` (несовместим с Vite/ESM)
    - Шрифты Roboto в `public/fonts/`
    - `backupManager`: JSON, CSV, merge, поддержка vehicles
- **0.3** — промежуточные состояния (модели, сторы, API-слой,
  базовая синхронизация с Supabase, гараж, напоминания, статистика)
