---
title: Технологический стек
type: concept
tags: [architecture, nextjs, react, tailwind, typescript]
created: 2026-09-24
updated: 2026-09-24
sources: [package.json, next.config.ts, tsconfig.json, src/app/globals.css, src/instrumentation.ts]
---

# Технологический стек

Один Next.js-проект, внутри которого сосуществуют две разные по природе части:
аналитические дашборды на реальных данных и интерактивные прототипы техподдержки
на моках (см. [[mock-data-strategy]]).

## Каркас

- **Next.js 16.1.3, App Router.** Роутинг по файловой системе в `src/app`.
  Дев-сервер на Turbopack.
- **React 19.2.3 с включённым React Compiler** (`reactCompiler: true`,
  `babel-plugin-react-compiler`). Мемоизация делается компилятором — `useMemo`
  и `useCallback` руками не расставляются.
- **TypeScript 5, `strict: true`.** `any` в проекте не используется, алиас `@/*` на `src/*`.
- **ESLint 9**, flat-config, пресеты `eslint-config-next/core-web-vitals` и `/typescript`.

## Рендеринг

Server Components по умолчанию; `"use client"` стоит точечно — там, где есть состояние,
эффекты или обработчики. Разделение видно в сборке:

- **10 страниц статические** (`○`) — префрендерятся в HTML на этапе `next build`:
  `/`, `/dashboard`, `/demo`, `/demo-2`, `/demo-3`, `/v2`, все четыре страницы
  техподдержки. Данные для прототипов лежат в коде, поэтому серверу нечего считать
  на каждый запрос.
- **8 API-роутов динамические** (`ƒ`) — `export const dynamic = "force-dynamic"`,
  выполняются на каждый запрос, потому что ходят в базу и в CSV.

Из этого вытекает правило детерминированных моков: `Math.random()` и `new Date()`
в рендере запрещены, иначе префрендеренный HTML не совпадёт с тем, что React
посчитает в браузере (hydration mismatch).

Префиксы локалей (`/ru`, `/en`, `/kz`) срезаются через `redirects()` в `next.config.ts`
временным 307 — локализованных роутов в приложении нет.

## Оформление

- **Tailwind CSS v4** через `@tailwindcss/postcss`. Конфиг-файла нет: тема задаётся
  прямо в `globals.css` блоком `@theme inline`. Плюс `tw-animate-css`.
- **shadcn/ui** — компоненты лежат в репозитории (`src/components/ui`), а не в
  зависимостях. Под ними примитивы **Radix UI** (dialog, popover, select, tabs,
  scroll-area, separator, slot) и связка `class-variance-authority` + `clsx` +
  `tailwind-merge`.
- **lucide-react** — иконки. Эмодзи в интерфейсе не используются.
  Выгрузка в SVG-файлы — `public/icons`, см. [[support-chat-tree]].
- **next/font/google** самостоятельно хостит шрифты: Open Sans (основной),
  Unbounded и IBM Plex Mono (указатель), Geist Mono. Кириллический subset обязателен.
- Контейнерные запросы (`@container`) вместо медиа-запросов там, где ширина колонки
  не равна ширине экрана — конструктор чата.

## Данные

Два независимых источника:

1. **MongoDB через Mongoose 9** — модели `Shift` и `User`. Соединение кешируется
   в `global`, чтобы hot reload не плодил подключения.
2. **CSV через papaparse** — `src/lib/v2` читает выгрузки в память и строит
   `Map`-индексы для джойнов. Метрики считаются в чистых функциях.

**node-cron** запускается из `src/instrumentation.ts` в хуке `register()` под
проверкой `NEXT_RUNTIME === 'nodejs'` — ежедневная синхронизация в 00:00 Asia/Almaty.

**recharts 3** рисует графики, `react-day-picker` + `date-fns` — выбор периода,
`cmdk` — командное меню.

## Чего нет

Тестового фреймворка в проекте нет. Проверка — `npm run build`, `npm run lint`
и ручной проход по страницам. Drag-and-drop в конструкторе дерева сделан на нативном
HTML5 API без библиотеки.

## См. также

- [[demo-pages]] — что показывает каждая страница
- [[mock-data-strategy]] — граница между моками и продом
- [[support-chat-builder]] — где используются контейнерные запросы и DnD
