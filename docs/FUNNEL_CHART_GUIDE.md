# Воронка смен: гайд по реализации

Компонента графика «Взяли смену / Вышли на объект / Штраф / Отменил» с двумя осями Y.

Демо доступно по адресу `/demo` (см. файлы в `src/app/demo/`).

---

## 1. Стек

| Библиотека | Версия | Где используется |
|---|---|---|
| **recharts** | `^3.6.0` | `ComposedChart`, `Bar`, `Line`, `YAxis`, `Tooltip`, `Legend`, `ResponsiveContainer` |
| **date-fns** | `^4.1.0` | `format`, `parseISO`, локаль `ru` — для подписей `01.01` и `1 января 2026` |
| **tailwindcss** | `^4` | разметка KPI-ряда и контейнеров |
| **lucide-react** | `^0.562.0` | иконки (`FlaskConical`, `ExternalLink`) — опционально |

Никаких новых зависимостей ставить не надо, всё уже в `package.json`.

---

## 2. Контракт бэкенда

Эндпоинт должен принимать диапазон дат и возвращать массив, **одна точка на день**, отсортированный по `date` ASC.

### Запрос

```http
GET /api/funnel?from=2026-01-01&to=2026-01-30
```

### Ответ

```ts
type FunnelDayPoint = {
    date: string;       // YYYY-MM-DD
    taken: number;      // Взяли смену
    attended: number;   // Вышли на объект
    fines: number;      // Штраф (количество событий)
    cancelled: number;  // Отменил
};

type Response = FunnelDayPoint[];
```

### Пример

```json
[
  { "date": "2026-01-01", "taken": 952, "attended": 891, "fines": 47, "cancelled": 18 },
  { "date": "2026-01-02", "taken": 1014, "attended": 980, "fines": 62, "cancelled": 33 },
  { "date": "2026-01-03", "taken": 887, "attended": 902, "fines": 21, "cancelled": 8  }
]
```

### Правила

- **Пропуски в датах допустимы** — фронт не дорисует за бэк, бары будут только в те дни, что пришли. Если в дне ничего не было — лучше отдать запись с нулями, чтобы график не «прыгал».
- **Все 4 поля обязательны и числовые** (0 если ничего не было).
- **`attended` может быть больше `taken`** — это нормально (исполнитель пришёл без записи). Бывает в ~5–10% дней.
- Сортировка по `date` ASC обязательна — иначе бары на оси X пойдут вразнобой.

### Откуда брать данные (пример для TEOS)

| Метрика | Источник |
|---|---|
| `taken` | Кол-во `shift_users` с `created_at` в этом дне, где `completion_status` ≠ `null` (т.е. юзер записался на смену) |
| `attended` | Кол-во `shift_users` с `completion_status` ∈ `success` ∪ `fine` ∪ `zero_production` за день |
| `fines` | Кол-во записей в `user_balance_log` за день где `fine_id IS NOT NULL` (или comment содержит «штраф/Опоздание/Срыв смены»). Можно фильтровать по `created_at::date`. |
| `cancelled` | Кол-во `shift_users` с `completion_status = 'reject'` за день |

Если нужны разрезы (по партнёру/городу/компании) — добавь дополнительные query-параметры, как сделано в V2 (`?partner=…&city=…&status=…`).

---

## 3. Фронт: 3 файла

```
src/app/demo/
├── mockData.ts         ← типы + генератор мока (заменить на fetch в проде)
├── FunnelMockChart.tsx ← сам график + KPI-ряд (готов к использованию)
└── page.tsx            ← демо-страница с инструкциями (для прода не нужна)
```

### `mockData.ts` — типы

```ts
export interface FunnelDayPoint {
    date: string;
    taken: number;
    attended: number;
    fines: number;
    cancelled: number;
}
```

В проде вместо `generateMockFunnel()` пишешь:

```ts
async function loadFunnel(from: string, to: string): Promise<FunnelDayPoint[]> {
    const res = await fetch(`/api/funnel?from=${from}&to=${to}`);
    return res.json();
}
```

### `FunnelMockChart.tsx` — использование

```tsx
import { FunnelMockChart } from "./FunnelMockChart";

export default function Page() {
    const [data, setData] = useState<FunnelDayPoint[]>([]);
    useEffect(() => {
        loadFunnel("2026-01-01", "2026-01-30").then(setData);
    }, []);
    return <FunnelMockChart data={data} />;
}
```

Компонента сама считает KPI-totals из массива в одном проходе через `useMemo`. Дополнительные props не нужны.

---

## 4. Визуальная логика (одна ось Y)

Все 4 серии живут на **одной оси Y**, чтобы пропорции были честными:
- `taken` / `attended` ≈ сотни-тысячи (типично 850–1100)
- `fines` / `cancelled` ≈ десятки (типично 5–150)

Линии штрафов и отмен идут низко — это правильно: их **действительно мало** относительно общего числа смен. На двух осях такая разница искусственно "выпрямлялась", и штраф в 137 визуально оказывался выше столбика смен в 900, что вводило в заблуждение.

- Бары — `taken` (синий `#118DFF`) и `attended` (бирюзовый `#2FACAD`), сгруппированы
- Линии — `fines` (красный `#D64550`) и `cancelled` (оранжевый `#E66C37`), поверх баров

В recharts — никаких `yAxisId`, одна ось по умолчанию:

```tsx
<YAxis />
<Bar dataKey="taken" />
<Bar dataKey="attended" />
<Line dataKey="fines" />
<Line dataKey="cancelled" />
```

---

## 5. KPI-ряд сверху

4 карточки с итогами по выбранному периоду:

| Карточка | Что показывает | Цвет акцента |
|---|---|---|
| Взяли смену | `Σ taken` | `#118DFF` |
| Вышли на объект | `Σ attended`, подпись «% явки» | `#2FACAD` |
| Штрафы | `Σ fines` | `#D64550` |
| Отменили | `Σ cancelled` | `#E66C37` |

% явки = `attended / taken × 100`. Считается в одном проходе через `useMemo`.

---

## 6. Адаптация под прод — 5 шагов

1. **Создать эндпоинт** `/api/funnel` на бэке, возвращающий `FunnelDayPoint[]`.
2. **Удалить мок** — убрать `mockData.ts.generateMockFunnel()` (или оставить только тип `FunnelDayPoint` и перенести в `types.ts`).
3. **Загружать через fetch** в клиентском компоненте:
   ```tsx
   const [data, setData] = useState<FunnelDayPoint[]>([]);
   useEffect(() => { fetch(`/api/funnel?from=${from}&to=${to}`).then(r => r.json()).then(setData); }, [from, to]);
   ```
4. **Добавить фильтры** (даты, партнёр, статус, …) — передавай их в query-параметры fetch'а.
5. **Если периодов > 30 дней** — на клиенте сагрегируй по неделям/месяцам тем же утильным `aggregateByPeriod()` из `src/app/v2/components/period.ts`. График автоматически отрендерит вместо 30 баров — 4 (по месяцам).

---

## 7. Кастомизация

| Хочу | Где менять |
|---|---|
| Сменить палитру | Константы `COLOR_TAKEN`, `COLOR_ATTEND`, `COLOR_FINE`, `COLOR_CANCEL` в `FunnelMockChart.tsx` |
| Сменить формат дат на оси | `tickFormatter` (по умолчанию `dd.MM`) |
| Сменить формат даты в тултипе | `tooltipLabelFormatter` (по умолчанию `d MMMM yyyy`) |
| Сделать все серии барами | Заменить `<Line>` на `<Bar>` для `fines`/`cancelled`, добавить им `stackId="small"` (или оставить grouped) |
| Добавить 5-ю серию | Добавить поле в `FunnelDayPoint`, добавить `<Bar>` или `<Line>` в графе, добавить KPI-блок |
| Изменить высоту | `h-[420px]` на родительском div'е |
| Сделать responsive | Уже responsive — `ResponsiveContainer` тянется по ширине родителя |

---

## 8. Гарантии

- **SSR-safe**: генератор мока детерминированный (`mulberry32` с фиксированным seed). При замене на fetch — оборачивай в `useEffect`, чтобы не падал hydration.
- **Без побочных эффектов**: компонента pure — те же `data` дают тот же рендер.
- **Без новых зависимостей**: всё уже в `package.json`.

---

## 9. Файлы для копирования в другой проект

Минимум:
- `src/app/demo/FunnelMockChart.tsx` (~180 строк)
- Интерфейс `FunnelDayPoint` из `mockData.ts` (~15 строк)

Внешние зависимости (должны быть в проекте):
- `recharts`, `date-fns`, `tailwindcss`, `lucide-react` (опционально)

Если в проекте нет tailwind — стили в компоненте можно заменить на inline styles или CSS-модули, логика recharts при этом не меняется.
