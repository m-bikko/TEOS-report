import Link from "next/link";
import { ExternalLink, FlaskConical, Download } from "lucide-react";
import { OrdersByStatusChart } from "./OrdersByStatusChart";
import { IntakeChart } from "./IntakeChart";
import { generateMockOrders, generateMockIntake } from "./mockData2";

const DOWNLOADS: { file: string; desc: string; path: string }[] = [
    {
        file: "OrdersByStatusChart.tsx",
        path: "src/app/demo-2/OrdersByStatusChart.tsx",
        desc: "график «Заказы по дням и статусам» + правая легенда",
    },
    {
        file: "IntakeChart.tsx",
        path: "src/app/demo-2/IntakeChart.tsx",
        desc: "график «Записи на заказ» (organic + operator + АВР-линия)",
    },
    {
        file: "mockData2.ts",
        path: "src/app/demo-2/mockData2.ts",
        desc: "типы (OrderDayPoint, IntakeDayPoint) + детерминированный генератор",
    },
    {
        file: "page-2.tsx",
        path: "src/app/demo-2/page.tsx",
        desc: "эта страница (для прод-использования не нужна)",
    },
    {
        file: "DEMO_2_GUIDE.md",
        path: "docs/DEMO_2_GUIDE.md",
        desc: "полный гайд по интеграции обоих графиков",
    },
];

export default function Demo2Page() {
    const orders = generateMockOrders();
    const intake = generateMockIntake();
    const ordersSampleJson = JSON.stringify(orders.slice(0, 2), null, 2);
    const intakeSampleJson = JSON.stringify(intake.slice(0, 2), null, 2);

    return (
        <div className="min-h-screen bg-background">
            <div className="border-b border-border bg-card">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FlaskConical className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <h1 className="text-xl font-semibold">
                                Демо-2: заказы и записи (мок-данные)
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Период: 01.01.2026 – 30.01.2026 · детерминированный мок · не из CSV
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                        <Link
                            href="/demo"
                            className="text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                            ← /demo <ExternalLink className="h-3 w-3" />
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
                {/* Графики */}
                <OrdersByStatusChart data={orders} />
                <IntakeChart data={intake} />

                {/* Инструкции */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <section className="border border-border rounded-sm bg-card p-4 space-y-3">
                        <h2 className="text-sm font-semibold">1. Формат данных - Заказы по статусам</h2>
                        <pre className="text-[11px] leading-snug bg-muted/60 rounded p-3 overflow-x-auto">
                            {`GET /api/orders-by-status?from=…&to=…

Response 200:
[
  {
    "date": "YYYY-MM-DD",
    "inRecruiting": number,  // В наборе
    "inWork": number,        // В работе
    "inApproval": number,    // В согласовании
    "inPayment": number,     // В оплате
    "archived": number,      // В архиве
    "cancelled": number      // Отменённые
  },
  ...
]`}
                        </pre>
                        <p className="text-xs text-muted-foreground">Пример (первые 2 дня):</p>
                        <pre className="text-[11px] leading-snug bg-muted/60 rounded p-3 overflow-x-auto">
                            {ordersSampleJson}
                        </pre>
                        <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                            <li>Одна точка на день, отсортированы по date ASC.</li>
                            <li>Бэк считает counts из таблицы shifts по их status и date.</li>
                            <li>Пропуски → отдай записи с нулями, чтобы график не «прыгал».</li>
                        </ul>
                    </section>

                    <section className="border border-border rounded-sm bg-card p-4 space-y-3">
                        <h2 className="text-sm font-semibold">2. Формат данных - Записи на заказ</h2>
                        <pre className="text-[11px] leading-snug bg-muted/60 rounded p-3 overflow-x-auto">
                            {`GET /api/intake?from=…&to=…

Response 200:
[
  {
    "date": "YYYY-MM-DD",
    "organicIntake": number,   // записались сами
    "operatorIntake": number,  // записаны операторами
    "signedAvr": number        // подписанные АВР за день (линия)
  },
  ...
]`}
                        </pre>
                        <p className="text-xs text-muted-foreground">Пример (первые 2 дня):</p>
                        <pre className="text-[11px] leading-snug bg-muted/60 rounded p-3 overflow-x-auto">
                            {intakeSampleJson}
                        </pre>
                        <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                            <li>
                                <code className="bg-muted px-1 py-0.5 rounded text-[11px]">organicIntake</code>{" "}
                                +{" "}
                                <code className="bg-muted px-1 py-0.5 rounded text-[11px]">operatorIntake</code>{" "}
                                = общий интейк за день (стек на графике).
                            </li>
                            <li>
                                <code className="bg-muted px-1 py-0.5 rounded text-[11px]">signedAvr</code>{" "}
                                - отдельный показатель, идёт ЛИНИЕЙ (не стек), пропорция к интейку = «покрытие
                                АВР».
                            </li>
                        </ul>
                    </section>
                </div>

                {/* Фронт-стек */}
                <section className="border border-border rounded-sm bg-card p-4 space-y-3">
                    <h2 className="text-sm font-semibold">3. Фронт-стек</h2>
                    <ul className="text-xs space-y-1.5">
                        <li>
                            <b>recharts 3.x</b> - <code className="bg-muted px-1 py-0.5 rounded text-[11px]">BarChart</code> для Chart 1,{" "}
                            <code className="bg-muted px-1 py-0.5 rounded text-[11px]">ComposedChart</code> для Chart 2 (бары + линия)
                        </li>
                        <li>
                            <b>Одна ось Y</b> на обоих графиках - пропорции честные. Стек по сериям через{" "}
                            <code className="bg-muted px-1 py-0.5 rounded text-[11px]">stackId</code>.
                        </li>
                        <li>
                            <b>Легенда справа</b> вместо встроенной снизу - в правой колонке{" "}
                            <code className="bg-muted px-1 py-0.5 rounded text-[11px]">col-span-3</code> с описанием и
                            кликабельным toggle (скрыть/показать серию).
                        </li>
                        <li>
                            <b>date-fns 4.x + ru</b> · форматирование «01.01», «1 января 2026»
                        </li>
                        <li>
                            <b>tailwindcss 4</b> · разметка grid, цвета, hover-эффекты
                        </li>
                    </ul>
                </section>

                {/* Файлы для скачивания */}
                <section className="border border-border rounded-sm bg-card p-4 space-y-3">
                    <h2 className="text-sm font-semibold">4. Скачать файлы</h2>
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
                                <span className="text-muted-foreground">- {d.desc}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Адаптация */}
                <section className="border border-border rounded-sm bg-card p-4 space-y-3">
                    <h2 className="text-sm font-semibold">5. Адаптация под прод</h2>
                    <ol className="text-xs space-y-1.5 list-decimal pl-5">
                        <li>
                            Замени{" "}
                            <code className="bg-muted px-1 py-0.5 rounded text-[11px]">generateMockOrders()</code>{" "}
                            и{" "}
                            <code className="bg-muted px-1 py-0.5 rounded text-[11px]">generateMockIntake()</code>{" "}
                            на fetch к своим эндпоинтам.
                        </li>
                        <li>
                            На бэке для Chart 1 - group by{" "}
                            <code className="bg-muted px-1 py-0.5 rounded text-[11px]">shifts.date, shifts.status</code>,
                            пивот в 6 колонок.
                        </li>
                        <li>
                            Для Chart 2 - посчитай по дням: organic = записи, где источник = «приложение»,
                            operator = записи где источник = «оператор», signedAvr = кол-во подписанных
                            АВР за день.
                        </li>
                        <li>
                            Перенеси компоненты + типы в свою папку, оставь{" "}
                            <code className="bg-muted px-1 py-0.5 rounded text-[11px]">page.tsx</code> своим.
                        </li>
                        <li>
                            Если периодов &gt; 30 - на клиенте сагрегируй в недели/месяцы через тот же
                            утильный <code className="bg-muted px-1 py-0.5 rounded text-[11px]">aggregateByPeriod()</code>{" "}
                            из <code className="bg-muted px-1 py-0.5 rounded text-[11px]">src/app/v2/components/period.ts</code>.
                        </li>
                    </ol>
                </section>
            </div>
        </div>
    );
}
