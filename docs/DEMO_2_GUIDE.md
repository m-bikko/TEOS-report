# Demo-2: «Заказы по статусам» + «Записи на заказ»

Два графика с легендой справа. Демо живёт на роуте `/demo-2`. Источник — `src/app/demo-2/`.

---

## 1. Стек

| Библиотека | Версия | Где используется |
|---|---|---|
| **recharts** | `^3.6.0` | `BarChart` (Chart 1), `ComposedChart` (Chart 2 — бары + линия) |
| **date-fns** | `^4.1.0` | `format`, `parseISO`, локаль `ru` |
| **tailwindcss** | `^4` | разметка `grid grid-cols-12`, легенда справа, hover-эффекты |
| **lucide-react** | `^0.562.0` | иконки `Download`, `FlaskConical`, `ExternalLink` |

Никаких новых зависимостей ставить не нужно — всё уже в `package.json`.

---

## 2. Chart 1 — «Заказы по дням и статусам»

### Что показывает

6 статусов заказов, стек-бары по дням:
- В наборе
- В работе
- В согласовании
- В оплате
- В архиве
- Отменённые

Одна ось Y. Каждый столбик дня — сумма всех 6 статусов на этот день.

### Контракт бэкенда

```http
GET /api/orders-by-status?from=2026-01-01&to=2026-01-30
```

```ts
type OrderDayPoint = {
    date: string;          // YYYY-MM-DD
    inRecruiting: number;  // В наборе
    inWork: number;        // В работе
    inApproval: number;    // В согласовании
    inPayment: number;     // В оплате
    archived: number;      // В архиве
    cancelled: number;     // Отменённые
};

type Response = OrderDayPoint[];
```

### Пример ответа

```json
[
  {
    "date": "2026-01-01",
    "inRecruiting": 2, "inWork": 1, "inApproval": 4,
    "inPayment": 0, "archived": 178, "cancelled": 56
  },
  {
    "date": "2026-01-02",
    "inRecruiting": 0, "inWork": 2, "inApproval": 6,
    "inPayment": 1, "archived": 203, "cancelled": 48
  }
]
```

### Откуда брать (пример для TEOS)

SQL-ишный псевдокод:

```sql
SELECT
  date,
  COUNT(*) FILTER (WHERE status = 2) AS "inRecruiting",
  COUNT(*) FILTER (WHERE status = 1) AS "inWork",
  COUNT(*) FILTER (WHERE status = 3) AS "inApproval",
  COUNT(*) FILTER (WHERE status = 4) AS "inPayment",
  COUNT(*) FILTER (WHERE status = 5) AS "archived",
  COUNT(*) FILTER (WHERE status = 6) AS "cancelled"
FROM shifts
WHERE date BETWEEN $from AND $to
GROUP BY date
ORDER BY date;
```

### Цвета и значения

| Серия | Цвет (hex) | Что значит |
|---|---|---|
| В наборе | `#F4B942` (жёлтый) | ещё ищем исполнителей |
| В работе | `#118DFF` (синий) | исполнители на объекте |
| В согласовании | `#2FACAD` (бирюзовый) | ждём подтверждения заказчика |
| В оплате | `#3AA76D` (зелёный) | ждём перечисления денег |
| В архиве | `#12239E` (тёмно-синий) | выполнено и оплачено |
| Отменённые | `#D64550` (красный) | отменено заказчиком/системой |

Цвета лежат в массиве `SERIES` внутри `OrdersByStatusChart.tsx` — меняй там.

---

## 3. Chart 2 — «Записи на заказ»

### Что показывает

Сколько исполнителей было записано на заказ в каждый день, **с разбиением на источник записи** + сопроводительная линия подписанных АВР.

### Контракт бэкенда

```http
GET /api/intake?from=2026-01-01&to=2026-01-30
```

```ts
type IntakeDayPoint = {
    date: string;            // YYYY-MM-DD
    organicIntake: number;   // записались сами через приложение
    operatorIntake: number;  // записаны операторами вручную
    signedAvr: number;       // подписанные АВР за день
};

type Response = IntakeDayPoint[];
```

### Пример ответа

```json
[
  { "date": "2026-01-01", "organicIntake": 543, "operatorIntake": 198, "signedAvr": 612 },
  { "date": "2026-01-02", "organicIntake": 487, "operatorIntake": 224, "signedAvr": 587 }
]
```

### Откуда брать

- `organicIntake` — количество `shift_users` за день, у которых `source = 'app'` (или аналогичный признак самозаписи)
- `operatorIntake` — количество `shift_users` за день, где `source = 'operator'` / `created_by_user_id IS NOT NULL`
- `signedAvr` — количество `shift_users` за день, где `avr_user_sign IS NOT NULL AND avr_partner_sign IS NOT NULL`

### Логика отображения

- `organicIntake` + `operatorIntake` — **стекаются в один бар** (показывают общую интейку за день и её разрез по источникам)
- `signedAvr` — **отдельная линия** поверх (не стек, не накладывается на столбец). Это сопроводительный показатель: сколько из них дошли до подписания.
- Всё на **одной оси Y**: если линия идёт ниже верха бара — значит не все записанные подписали АВР; если выше — кто-то подписал доп. документы.

### Цвета и значения

| Серия | Тип | Цвет (hex) | Что значит |
|---|---|---|---|
| Organic intake | бар (стек) | `#3AA76D` (зелёный) | самозапись через приложение |
| Operator intake | бар (стек) | `#E66C37` (оранжевый) | запись оператором |
| Подписано АВР | линия | `#12239E` (тёмно-синий) | сопроводительный показатель покрытия |

---

## 4. Легенда справа (общая логика для обоих графов)

В отличие от стандартной recharts-легенды снизу, здесь — **сайдбар справа**:

```tsx
<div className="grid grid-cols-12 gap-4">
    <div className="col-span-9">{/* chart */}</div>
    <aside className="col-span-3 flex flex-col gap-2">
        {SERIES.map((s) => (
            <button onClick={() => toggle(s.key)}>
                <span color={s.color} /> {s.label}
                <div>{s.desc}</div>
                <div>{totals[s.key]}</div>
            </button>
        ))}
    </aside>
</div>
```

### Зачем

- **Описание** каждой серии (что значит, откуда данные) лежит рядом с цветом, а не пропадает в подписи легенды
- **Totals** за период видны без наведения на бар
- Клик по серии = **скрыть/показать** (через `hide` пропс у `<Bar>` / `<Line>`)

Встроенная recharts-легенда подавлена через `<Legend wrapperStyle={{ display: "none" }} />`.

---

## 5. Файлы для копирования

В минимальном виде нужно 2 файла на графа + общий тип:

```
src/app/demo-2/
├── OrdersByStatusChart.tsx   ← Chart 1 + правая легенда
├── IntakeChart.tsx           ← Chart 2 + правая легенда
├── mockData2.ts              ← OrderDayPoint, IntakeDayPoint + мок
└── page.tsx                  ← демо-страница (для прода не нужна)
```

В прод-коде:
1. Перенеси `OrderDayPoint` / `IntakeDayPoint` в `types.ts` своего проекта
2. Замени мок-генератор на `useEffect` с fetch:
   ```tsx
   const [orders, setOrders] = useState<OrderDayPoint[]>([]);
   useEffect(() => {
       fetch(`/api/orders-by-status?from=${from}&to=${to}`)
           .then((r) => r.json())
           .then(setOrders);
   }, [from, to]);
   return <OrdersByStatusChart data={orders} />;
   ```

---

## 6. Адаптация под прод — чеклист

- [ ] Эндпоинты `/api/orders-by-status` и `/api/intake` отдают массивы по контракту выше
- [ ] Пропуски заполнены нулями, сортировка по `date` ASC
- [ ] Перенесены компоненты `OrdersByStatusChart.tsx`, `IntakeChart.tsx`
- [ ] Перенесены типы из `mockData2.ts` (мок-генератор удалён)
- [ ] Цвета `SERIES` подогнаны под брендбук (если нужно)
- [ ] Описания (`desc`) в `SERIES` переведены/адаптированы
- [ ] Для длинных периодов (> 30 дней) клиент агрегирует через `aggregateByPeriod()` из `src/app/v2/components/period.ts`

---

## 7. Гарантии

- **SSR-safe**: генератор детерминированный (`mulberry32` с фиксированным seed) — нет hydration-ошибок.
- **Pure**: компоненты не делают сетевые запросы сами, только рендерят переданный `data`.
- **Без новых зависимостей**.
- **Toggle серий** реализован через локальный `useState<Set<string>>` — изолирован, не вытекает наружу.
