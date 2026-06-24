import Link from "next/link";
import { ExternalLink, FlaskConical, Download, ShoppingCart, Banknote, Calculator } from "lucide-react";
import { PaymentsChart } from "./PaymentsChart";
import {
    generateMockPayments,
    computeTotalShiftsCount,
    PARTNERS,
    CHANNEL_LABEL,
} from "./mockData3";

const DOWNLOADS: { file: string; desc: string; path: string }[] = [
    {
        file: "PaymentsChart.tsx",
        path: "src/app/demo-3/PaymentsChart.tsx",
        desc: "универсальный график выплат (1 канал → N линий партнёров + правый сайдбар)",
    },
    {
        file: "mockData3.ts",
        path: "src/app/demo-3/mockData3.ts",
        desc: "типы (Partner, PaymentEvent, PaymentChannel) + генератор",
    },
    {
        file: "page-3.tsx",
        path: "src/app/demo-3/page.tsx",
        desc: "эта страница (для прода не нужна)",
    },
    {
        file: "DEMO_3_GUIDE.md",
        path: "docs/DEMO_3_GUIDE.md",
        desc: "полный гайд по интеграции",
    },
];

const fmtMoney = (n: number): string => {
    if (Math.abs(n) >= 1_000_000)
        return `${(n / 1_000_000).toLocaleString("ru-RU", { maximumFractionDigits: 1 })} млн ₸`;
    if (Math.abs(n) >= 1_000)
        return `${(n / 1_000).toLocaleString("ru-RU", { maximumFractionDigits: 0 })} тыс ₸`;
    return `${Math.round(n).toLocaleString("ru-RU")} ₸`;
};

const fmtNumber = (n: number): string => n.toLocaleString("ru-RU");

export default function Demo3Page() {
    const events = generateMockPayments();
    const totalShiftsCount = computeTotalShiftsCount(events);

    const gphEvents = events.filter((e) => e.channel === "gph");
    const prosperEvents = events.filter((e) => e.channel === "prosper");

    const gphSum = gphEvents.reduce((s, e) => s + e.amount, 0);
    const prosperSum = prosperEvents.reduce((s, e) => s + e.amount, 0);
    const totalPayments = events.length;
    const totalSum = gphSum + prosperSum;
    const avgPayment = totalPayments > 0 ? totalSum / totalPayments : 0;

    const sampleEventJson = JSON.stringify(events.slice(0, 3), null, 2);

    return (
        <div className="min-h-screen bg-background">
            <div className="border-b border-border bg-card">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FlaskConical className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <h1 className="text-xl font-semibold">
                                Демо-3: аналитика выплат (мок-данные)
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Период: 01.01.2026 – 30.01.2026 · 5 партнёров · 2 канала: ГПХ + Prosper Pay (СМЗ)
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                        <Link
                            href="/demo"
                            className="text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                            /demo <ExternalLink className="h-3 w-3" />
                        </Link>
                        <Link
                            href="/demo-2"
                            className="text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                            /demo-2 <ExternalLink className="h-3 w-3" />
                        </Link>
                        <Link
                            href="/v2"
                            className="text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                            V2 <ExternalLink className="h-3 w-3" />
                        </Link>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 space-y-6">
                {/* Верхний KPI-ряд (агрегаты обоих каналов) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <TopKpi
                        label="Всего заказов за период"
                        value={fmtNumber(totalShiftsCount)}
                        hint="total_shifts_count (включая ещё не оплаченные)"
                        accent="#118DFF"
                        icon={<ShoppingCart className="h-3.5 w-3.5" />}
                    />
                    <TopKpi
                        label="Всего выплат за период"
                        value={fmtNumber(totalPayments)}
                        hint={`ГПХ (${fmtNumber(gphEvents.length)}) + СМЗ (${fmtNumber(prosperEvents.length)})`}
                        accent="#3AA76D"
                        icon={<Banknote className="h-3.5 w-3.5" />}
                    />
                    <TopKpi
                        label="Среднее значение выплаты"
                        value={fmtMoney(avgPayment)}
                        hint="total_payments_sum / total_payments"
                        accent="#6B007B"
                        icon={<Calculator className="h-3.5 w-3.5" />}
                    />
                </div>

                {/* График 1 — ГПХ */}
                <PaymentsChart
                    title={`Оплата по ${CHANNEL_LABEL.gph}`}
                    subtitle="Линии = top-5 партнёров · Y — сумма выплат за день · Х — дата проведения выплаты (не дата заказа)"
                    events={gphEvents}
                />

                {/* График 2 — Prosper Pay */}
                <PaymentsChart
                    title={`Оплата через ${CHANNEL_LABEL.prosper}`}
                    subtitle="Линии = top-5 партнёров · Y — сумма выплат за день · Х — дата проведения выплаты · комиссия 5%"
                    events={prosperEvents}
                    commissionPct={5}
                />

                {/* Документация */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <section className="border border-border rounded-sm bg-card p-4 space-y-3">
                        <h2 className="text-sm font-semibold">1. Формат данных от бэка</h2>
                        <p className="text-xs text-muted-foreground">
                            Один эндпоинт отдаёт массив событий выплат за период.
                            Каждое событие — одна транзакция, ключевые поля: дата проведения
                            выплаты, партнёр, сумма, канал.
                        </p>
                        <pre className="text-[11px] leading-snug bg-muted/60 rounded p-3 overflow-x-auto">
                            {`GET /api/payments?from=2026-01-01&to=2026-01-30

Response 200:
[
  {
    "paymentDate": "YYYY-MM-DD",   // дата ПРОВЕДЕНИЯ выплаты, не заказа
    "partnerId": number,
    "amount": number,              // тенге
    "channel": "gph" | "prosper",
    "shiftId": number              // связанная смена
  },
  ...
]

GET /api/payments/summary?from=…&to=…

Response 200:
{
  "totalShiftsCount": number     // включая ещё не оплаченные
}`}
                        </pre>
                        <p className="text-xs text-muted-foreground">Пример события (первые 3):</p>
                        <pre className="text-[11px] leading-snug bg-muted/60 rounded p-3 overflow-x-auto">
                            {sampleEventJson}
                        </pre>
                        <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                            <li>
                                <b>paymentDate</b> — это <i>дата проведения</i> (в TEOS:{" "}
                                <code className="bg-muted px-1 py-0.5 rounded text-[11px]">
                                    balance_log.created_at::date
                                </code>{" "}
                                с <code className="bg-muted px-1 py-0.5 rounded text-[11px]">type = 1</code>),
                                а не <code className="bg-muted px-1 py-0.5 rounded text-[11px]">shift.date</code>.
                            </li>
                            <li>
                                <b>channel</b> определяется типом договора у юзера:{" "}
                                <code className="bg-muted px-1 py-0.5 rounded text-[11px]">gph</code> —
                                договор ГПХ, <code className="bg-muted px-1 py-0.5 rounded text-[11px]">prosper</code>{" "}
                                — выплата через Prosper Pay (для самозанятых).
                            </li>
                            <li>
                                Сортировка и группировка по дате — на клиенте через{" "}
                                <code className="bg-muted px-1 py-0.5 rounded text-[11px]">useMemo</code>.
                            </li>
                        </ul>
                    </section>

                    <section className="border border-border rounded-sm bg-card p-4 space-y-3">
                        <h2 className="text-sm font-semibold">2. Расчёт KPI</h2>
                        <p className="text-xs text-muted-foreground">
                            Один датасет — много метрик. Считаются в одном проходе по массиву
                            событий через <code className="bg-muted px-1 py-0.5 rounded text-[11px]">useMemo</code>.
                        </p>
                        <table className="text-xs w-full">
                            <thead className="text-muted-foreground text-left border-b">
                                <tr>
                                    <th className="py-1.5 pr-2 font-medium">Метрика</th>
                                    <th className="py-1.5 font-medium">Формула</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr]:border-b [&_tr:last-child]:border-0 [&_td]:py-1.5 [&_td]:pr-2 [&_td]:align-top">
                                <tr>
                                    <td>Всего заказов</td>
                                    <td className="text-muted-foreground">
                                        <code className="text-[11px]">totalShiftsCount</code> (из эндпоинта)
                                    </td>
                                </tr>
                                <tr>
                                    <td>Всего выплат</td>
                                    <td className="text-muted-foreground">
                                        <code className="text-[11px]">events.length</code>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Среднее значение выплаты</td>
                                    <td className="text-muted-foreground">
                                        <code className="text-[11px]">Σ amount / events.length</code>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Сумма ГПХ</td>
                                    <td className="text-muted-foreground">
                                        <code className="text-[11px]">Σ amount WHERE channel=&quot;gph&quot;</code>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Сумма Prosper</td>
                                    <td className="text-muted-foreground">
                                        <code className="text-[11px]">
                                            Σ amount WHERE channel=&quot;prosper&quot;
                                        </code>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Комиссия Prosper</td>
                                    <td className="text-muted-foreground">
                                        <code className="text-[11px]">prosperSum × 0.05</code>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Среднее выплаты (channel)</td>
                                    <td className="text-muted-foreground">
                                        <code className="text-[11px]">channelSum / channelCount</code>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </section>
                </div>

                {/* Фронт-стек */}
                <section className="border border-border rounded-sm bg-card p-4 space-y-3">
                    <h2 className="text-sm font-semibold">3. Фронт-стек</h2>
                    <ul className="text-xs space-y-1.5">
                        <li>
                            <b>recharts 3.x</b> — <code className="bg-muted px-1 py-0.5 rounded text-[11px]">LineChart</code>,
                            одна <code className="bg-muted px-1 py-0.5 rounded text-[11px]">&lt;Line&gt;</code> на партнёра
                        </li>
                        <li>
                            <b>5 партнёров</b> — захардкожены в{" "}
                            <code className="bg-muted px-1 py-0.5 rounded text-[11px]">PARTNERS</code>{" "}
                            (id, name, color, scale). В проде получай со своего эндпоинта.
                        </li>
                        <li>
                            <b>Одна ось Y</b> — все 5 линий в одной шкале (партнёры сопоставимы).
                            На оси формат через <code className="bg-muted px-1 py-0.5 rounded text-[11px]">fmtMoneyAxis</code>
                            («120K», «1.5M»).
                        </li>
                        <li>
                            <b>Сайдбар справа</b>: общие KPI (сумма, комиссия, средняя, count) + список
                            партнёров с toggle и индивидуальными totals.
                        </li>
                        <li>
                            <b>date-fns 4.x + ru</b> для подписей «01.01» / «1 января 2026»
                        </li>
                        <li>
                            <b>tailwindcss 4</b> — grid-12, KPI-блоки на col-3 справа
                        </li>
                    </ul>
                    <p className="text-xs text-muted-foreground pt-2 border-t">
                        Минимальный код использования:
                    </p>
                    <pre className="text-[11px] leading-snug bg-muted/60 rounded p-3 overflow-x-auto">
                        {`import { PaymentsChart } from "./PaymentsChart";

// Отфильтруй события по каналу:
const gphEvents = events.filter(e => e.channel === "gph");
const prosperEvents = events.filter(e => e.channel === "prosper");

<PaymentsChart title="Оплата по ГПХ" subtitle="..." events={gphEvents} />
<PaymentsChart title="Prosper Pay"   subtitle="..." events={prosperEvents} commissionPct={5} />`}
                    </pre>
                </section>

                {/* Партнёры в данных */}
                <section className="border border-border rounded-sm bg-card p-4 space-y-3">
                    <h2 className="text-sm font-semibold">4. Партнёры в моке (5 шт)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-xs">
                        {PARTNERS.map((p) => (
                            <div key={p.id} className="border rounded-sm p-2 flex items-center gap-2">
                                <span
                                    className="w-3 h-0.5 shrink-0"
                                    style={{ backgroundColor: p.color }}
                                />
                                <span className="font-medium">{p.name}</span>
                                <span className="text-muted-foreground ml-auto">id={p.id}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Для прода замени массив{" "}
                        <code className="bg-muted px-1 py-0.5 rounded text-[11px]">PARTNERS</code>{" "}
                        на реальный список (например, top-5 по выручке за период из{" "}
                        <code className="bg-muted px-1 py-0.5 rounded text-[11px]">/api/v2/partners</code>).
                    </p>
                </section>

                {/* Скачать */}
                <section className="border border-border rounded-sm bg-card p-4 space-y-3">
                    <h2 className="text-sm font-semibold">5. Скачать файлы</h2>
                    <ul className="text-xs space-y-1.5">
                        {DOWNLOADS.map((d) => (
                            <li key={d.file} className="flex items-start gap-2">
                                <a
                                    href={`/api/demo/download?file=${encodeURIComponent(d.file)}`}
                                    download={d.file}
                                    className="text-primary hover:underline inline-flex items-center gap-1 shrink-0"
                                >
                                    <Download className="h-3 w-3" />
                                    <code className="bg-muted px-1 py-0.5 rounded text-[11px]">{d.path}</code>
                                </a>
                                <span className="text-muted-foreground">— {d.desc}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Адаптация */}
                <section className="border border-border rounded-sm bg-card p-4 space-y-3">
                    <h2 className="text-sm font-semibold">6. Адаптация под прод</h2>
                    <ol className="text-xs space-y-1.5 list-decimal pl-5">
                        <li>
                            Создай эндпоинт <code className="bg-muted px-1 py-0.5 rounded text-[11px]">/api/payments</code>{" "}
                            возвращающий <code className="bg-muted px-1 py-0.5 rounded text-[11px]">PaymentEvent[]</code>.
                            Внутри — SELECT из{" "}
                            <code className="bg-muted px-1 py-0.5 rounded text-[11px]">user_balance_log</code> с{" "}
                            <code className="bg-muted px-1 py-0.5 rounded text-[11px]">type = 1</code> и
                            join со сменой/партнёром.
                        </li>
                        <li>
                            Источник <code className="bg-muted px-1 py-0.5 rounded text-[11px]">channel</code> —
                            таблица договоров (ГПХ vs СМЗ) у юзера-получателя выплаты.
                        </li>
                        <li>
                            <code className="bg-muted px-1 py-0.5 rounded text-[11px]">totalShiftsCount</code>{" "}
                            — отдельный count из таблицы <code className="bg-muted px-1 py-0.5 rounded text-[11px]">shifts</code>
                            за период (с учётом status фильтра, если нужен).
                        </li>
                        <li>
                            Замени массив{" "}
                            <code className="bg-muted px-1 py-0.5 rounded text-[11px]">PARTNERS</code>{" "}
                            на динамический — например, GET <code className="bg-muted px-1 py-0.5 rounded text-[11px]">/api/v2/partners</code>{" "}
                            и top-5 по выручке.
                        </li>
                        <li>
                            Замени <code className="bg-muted px-1 py-0.5 rounded text-[11px]">generateMockPayments()</code>{" "}
                            на fetch + useEffect в client-компоненте.
                        </li>
                        <li>
                            Если периодов больше 30 дней — клиентская агрегация по неделям/месяцам через{" "}
                            <code className="bg-muted px-1 py-0.5 rounded text-[11px]">aggregateByPeriod()</code>{" "}
                            из <code className="bg-muted px-1 py-0.5 rounded text-[11px]">src/app/v2/components/period.ts</code>.
                        </li>
                    </ol>
                </section>
            </div>
        </div>
    );
}

function TopKpi({
    label,
    value,
    hint,
    accent,
    icon,
}: {
    label: string;
    value: string;
    hint: string;
    accent: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="border border-border rounded-sm bg-card p-3 relative overflow-hidden">
            <div
                className="absolute top-0 left-0 h-0.5 w-full"
                style={{ backgroundColor: accent }}
            />
            <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                    {label}
                </span>
                <span className="text-muted-foreground">{icon}</span>
            </div>
            <div className="text-2xl font-semibold leading-tight mt-1">{value}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>
        </div>
    );
}
