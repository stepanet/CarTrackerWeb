# CarTrackerWeb — веб-версия CarTracker

Веб-версия iOS-приложения CarTracker для учёта работ по автомобилю.
Работает как PWA, устанавливается на домашний экран iPhone.

## 🌐 Live URL

**https://car-tracker-web-pi.vercel.app**

## Статус (обновлено: 2026-09-23)

**Текущая версия: v1.0** ✅

### ✅ Реализовано
- [x] Работы: список, добавление, редактирование, удаление
- [x] Поиск и фильтр по категориям
- [x] Сводка «Всего / За год / Средних в месяц»
- [x] Графики: расходы по месяцам (Recharts) и по категориям (donut)
- [x] Напоминания о ТО с прогресс-баром и статусами (🟢🟡🔴⚪)
- [x] Типовой набор из 4 напоминаний
- [x] Экспорт бэкапа в JSON
- [x] Импорт JSON с объединением (совместимо с iOS-бэкапами)
- [x] PWA: манифест, Service Worker, установка на iOS
- [x] Работа офлайн
- [x] Деплой на Vercel с автодеплоем

### ⚠️ Ограничения (по сравнению с iOS)
- Нет push-уведомлений
- Нет фоновой проверки напоминаний (у веба нет аналога BGTaskScheduler)
- Данные хранятся локально (localStorage), синхронизация — через экспорт/импорт

## Технологии
- React 18 + TypeScript
- Vite + vite-plugin-pwa
- Tailwind CSS v4
- Recharts (графики)
- Zustand (состояние + persist)
- localStorage (хранение)
- Vercel (деплой)

## Локальная разработка

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production-сборка
npm run preview -- --host   # preview с доступом по сети



src/
├── models/             — CarWork, Reminder, BackupData (TypeScript)
├── stores/             — Zustand: useCarWorkStore, useReminderStore,
│                         backupManager, statsHelpers, useReminderStore
├── components/
│   ├── works/          — WorksList, WorkRow, WorkForm
│   ├── stats/          — StatsView, MonthlyChart, CategoryChart
│   ├── reminders/      — RemindersList, ReminderCard, ReminderForm
│   ├── BackupMenu.tsx
│   └── ImportDialog.tsx
└── App.tsx             — TabView с тремя вкладками



**Замените `ВАШ_ЛОГИН`** на ваш GitHub-логин.

### Шаг 1.2. Создаём `CHANGELOG.md` в `CarTrackerWeb/`

```markdown
# Changelog

## [1.0] — 2026-09-23

Первый релиз веб-версии CarTracker.

### Added
- **Работы:**
  - Модели CarWork, WorkCategory на TypeScript
  - Zustand-хранилище с persist в localStorage
  - Список, добавление, редактирование, удаление
  - Поиск и фильтр по категориям
  - Сводка «Всего / За год / Записей»
- **Статистика:**
  - Recharts: BarChart по месяцам, PieChart по категориям
  - Переключатель периода 3/6/12 месяцев
  - Кастомные тултипы, легенда с процентами
- **Напоминания:**
  - Модель Reminder + логика статусов
  - Карточки с прогресс-баром и цветовой индикацией
  - «Сделано сегодня», вкл/выкл, редактирование, удаление
  - Типовой набор из 4 напоминаний
- **Экспорт/импорт:**
  - Скачивание JSON-бэкапа
  - Импорт с объединением (дубликаты по id пропускаются)
  - Показ статистики импорта
  - Совместимость с iOS-бэкапами
- **PWA:**
  - Манифест, иконки, Service Worker
  - Установка на домашний экран iOS
  - Работа офлайн
- **Инфраструктура:**
  - Деплой на Vercel
  - Автодеплой при push в main
  - Production URL: https://car-tracker-web-pi.vercel.app



  