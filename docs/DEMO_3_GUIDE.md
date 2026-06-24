# Demo-3: «Аналитика выплат»

Два графика по выплатам (ГПХ + Prosper Pay) с разбивкой по 5 партнёрам, общий KPI-ряд сверху, описание справа от каждого графика. Демо живёт на роуте `/demo-3`. Источник - `src/app/demo-3/`.

> **ВАЖНО.** Дата на оси X - это **дата проведения выплаты** (когда деньги начислены/выплачены), а **не дата заказа/смены**. В TEOS-смыслах это `user_balance_log.created_at::date` при `type = 1`.

---

## 1. Стек

| Библиотека | Версия | Где используется |
|---|---|---|
| **recharts** | `^3.6.0` | `LineChart` с N линиями (одна на партнёра) |
| **date-fns** | `^4.1.0` | `format`, `parseISO`, локаль `ru` |
| **tailwindcss** | `^4` | grid-12, KPI-ряд, сайдбар |
| **lucide-react** | `^0.562.0` | иконки в KPI-карточках |

Никаких новых зависимостей - всё уже в `package.json`.

---

## 2. Контракт бэкенда

### 2.1. События выплат

```http
GET /api/payments?from=2026-01-01&to=2026-01-30
```

```ts
type PaymentChannel = "gph" | "prosper";

type PaymentEvent = {
    paymentDate: string;       // YYYY-MM-DD - ДАТА ПРОВЕДЕНИЯ ВЫПЛАТЫ
    partnerId: number;         // id партнёра
    amount: number;            // тенге
    channel: PaymentChannel;   // "gph" | "prosper"
    shiftId: number;           // связанная смена
};

type Response = PaymentEvent[];
```

**Пример:**

```json
[
  { "paymentDate": "2026-01-01", "partnerId": 1, "amount": 47830, "channel": "gph",     "shiftId": 1042 },
  { "paymentDate": "2026-01-01", "partnerId": 1, "amount":  9120, "channel": "prosper", "shiftId": 1043 },
  { "paymentDate": "2026-01-01", "partnerId": 3, "amount": 86500, "channel": "gph",     "shiftId": 1044 }
]
```

### 2.2. Откуда брать (псевдо-SQL для TEOS)

```sql
-- /api/payments
SELECT
    DATE(bl.created_at)              AS "paymentDate",
    resolve_partner(s.vacancy_id)    AS "partnerId",
    ABS(bl.change_amount)            AS "amount",
    CASE
        WHEN u.contract_type = 'GPH'      THEN 'gph'
        WHEN u.contract_type = 'SMZ'      THEN 'prosper'
    END                              AS "channel",
    bl.shift_id                      AS "shiftId"
FROM user_balance_log bl
JOIN shifts s ON s.id = bl.shift_id
JOIN users u ON u.id = bl.user_id
WHERE bl.type = 1
  AND bl.created_at BETWEEN $from AND $to + interval '1 day';
```

Где `resolve_partner()` - твоя функция-резолвер партнёра по вакансии смены (см. `src/lib/v2/joins.ts:resolvePartnerForVacancy()`).

Один эндпоинт - все 3 верхних KPI и оба графика считаются на клиенте из одного массива `PaymentEvent[]`.

---

## 3. Расчёт KPI

### Верхний ряд (3 карточки на всю страницу)

| Метрика | Формула |
|---|---|
| Общая сумма выплат | `Σ amount` (по всем событиям) |
| Всего выплат | `events.length` |
| Среднее значение выплаты | `Σ amount / events.length` |

### На каждом графике (правый сайдбар)

#### ГПХ
| Метрика | Формула |
|---|---|
| Общая сумма | `Σ amount WHERE channel="gph"` |
| Среднее выплаты | `gphSum / gphCount` |
| Количество выплат | `gphCount` |

#### Prosper Pay
| Метрика | Формула |
|---|---|
| Общая сумма | `Σ amount WHERE channel="prosper"` |
| **Комиссия** | `prosperSum × 0.05` (5%) |
| Среднее выплаты | `prosperSum / prosperCount` |
| Количество выплат | `prosperCount` |

#### Per-partner (под общими KPI справа)
Для каждого из 5 партнёров: `Σ amount` и `count` среди отфильтрованных событий канала. Клик по партнёру скрывает/показывает его линию на графике.

---

## 4. Графики

### Структура

```tsx
<PaymentsChart
    title="Оплата по ГПХ"
    subtitle="..."
    events={gphEvents}
/>
<PaymentsChart
    title="Оплата через Prosper Pay (СМЗ)"
    subtitle="..."
    events={prosperEvents}
    commissionPct={5}
/>
```

Один компонент, два инстанса - фильтрация по каналу делается на странице через `events.filter(e => e.channel === ...)`.

### Логика отображения

- **LineChart** (не Bar - линии лучше показывают тренд по партнёрам)
- **5 линий** (по числу партнёров), каждая на одной общей оси Y
- **Без точек** (`dot={false}`) - при 30 точках чёртиков становится много
- **Цвета партнёров** захардкожены в `PARTNERS` массиве в `mockData3.ts`
- **Toggle hide/show**: локальный `useState<Set<number>>`, передаётся в `hide` пропс `<Line>`
- **Tooltip** показывает «1 января 2026» + суммы по всем видимым партнёрам через `formatter={(v) => fmtMoney(v)}`

### Партнёры (мок)

```ts
PARTNERS = [
  { id: 1, name: "UniGroup Lab", color: "#118DFF" },
  { id: 2, name: "UG Тұмар",     color: "#E66C37" },
  { id: 3, name: "UniGroupkz",   color: "#3AA76D" },
  { id: 4, name: "UG Куат",      color: "#6B007B" },
  { id: 5, name: "UniGroup Юг",  color: "#D64550" },
];
```

В прод-коде замени на динамику - например, top-5 по выручке из `/api/v2/partners`.

---

## 5. Layout страницы

```
┌─────────────────────────────────────────────────────────────┐
│  Header                                                      │
├─────────────────────────────────────────────────────────────┤
│  [Всего заказов]  [Всего выплат]  [Ср. стоимость заказа]   │  ← 3 KPI на всю ширину
├─────────────────────────────────────────────────────────────┤
│  Оплата по ГПХ                                               │
│  ┌───────────────────────────────┬─────────────────────┐    │
│  │ LineChart (5 партнёров)       │ Общая сумма          │    │
│  │                               │ Среднее выплаты      │    │
│  │                               │ Количество           │    │
│  │                               │ ─── Партнёры ─────   │    │
│  │                               │ • UniGroup Lab        │    │
│  │                               │ • UG Тұмар            │    │
│  │                               │ ...                   │    │
│  └───────────────────────────────┴─────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│  Оплата через Prosper Pay                                    │
│  ┌───────────────────────────────┬─────────────────────┐    │
│  │ LineChart (5 партнёров)       │ Общая сумма          │    │
│  │                               │ Комиссия (5%)        │    │
│  │                               │ Среднее выплаты      │    │
│  │                               │ Количество           │    │
│  │                               │ ─── Партнёры ─────   │    │
│  └───────────────────────────────┴─────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│  Инструкции: формат, KPI-формулы, фронт-стек, партнёры,     │
│  скачивание, адаптация под прод                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Файлы для копирования

```
src/app/demo-3/
├── PaymentsChart.tsx   ← переиспользуемый график (1 инстанс на канал)
├── mockData3.ts        ← типы PaymentEvent, PaymentChannel, Partner + мок
└── page.tsx            ← демо-страница (для прода не нужна, оставь только агрегации)
```

В прод-коде:
1. Перенеси типы (`PaymentEvent`, `PaymentChannel`, `Partner`) в `types.ts`.
2. Удали мок-генератор. Делай fetch:
   ```tsx
   const [events, setEvents] = useState<PaymentEvent[]>([]);
   useEffect(() => {
       fetch(`/api/payments?from=${from}&to=${to}`)
           .then((r) => r.json())
           .then(setEvents);
   }, [from, to]);
   ```
3. Группировка по каналу - на клиенте: `events.filter(e => e.channel === 'gph')`.

---

## 7. Чеклист интеграции

- [ ] Эндпоинт `/api/payments` отдаёт `PaymentEvent[]` по контракту
- [ ] `paymentDate` = дата проведения выплаты, **не** дата заказа
- [ ] `channel` правильно вычисляется из типа договора юзера (ГПХ / СМЗ)
- [ ] `PARTNERS` - динамические top-5 (не захардкожены)
- [ ] Цвета `PARTNERS` подогнаны под брендбук
- [ ] Комиссия 5% подогнана под реальную ставку Prosper (если она другая - поправь `commissionPct`)
- [ ] Длинные периоды (> 30 дней) клиент агрегирует через `aggregateByPeriod()` из `src/app/v2/components/period.ts`

---

## 8. Гарантии

- **SSR-safe**: генератор детерминированный (`mulberry32`, фикс. seed).
- **Pure component**: `PaymentsChart` не делает сетевые вызовы - только рендерит переданные `events`.
- **Без новых зависимостей**.
- **Toggle серий** изолирован в локальном `useState`.
