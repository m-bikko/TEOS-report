import Link from "next/link";
import { ExternalLink, FlaskConical, Download } from "lucide-react";
import { FunnelMockChart } from "./FunnelMockChart";
import { generateMockFunnel } from "./mockData";

const DOWNLOADS: { file: string; desc: string }[] = [
    { file: "FunnelMockChart.tsx", desc: "сам график + KPI-ряд" },
    { file: "mockData.ts", desc: "генератор мока + типы (FunnelDayPoint)" },
    { file: "page.tsx", desc: "эта страница (для прод-использования не нужна)" },
    { file: "FUNNEL_CHART_GUIDE.md", desc: "полный гайд по интеграции" },
];

const FILE_PATH_LABEL: Record<string, string> = {
    "FunnelMockChart.tsx": "src/app/demo/FunnelMockChart.tsx",
    "mockData.ts": "src/app/demo/mockData.ts",
    "page.tsx": "src/app/demo/page.tsx",
    "FUNNEL_CHART_GUIDE.md": "docs/FUNNEL_CHART_GUIDE.md",
};

/**
 * Демо-страница: воронка смен на мок-данных.
 * Никакого API/CSV - данные генерируются детерминированно в mockData.ts
 * Цель - показать формат бэк-ответа и фронтовую реализацию.
 */
export default function DemoPage() {
    const data = generateMockFunnel();

    const sampleJson = JSON.stringify(data.slice(0, 3), null, 2);

    return (
        <div className="min-h-screen bg-background">
            <div className="border-b border-border bg-card">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FlaskConical className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <h1 className="text-xl font-semibold">
                                Демо: воронка смен (мок-данные)
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Период: 01.01.2026 – 30.01.2026 · значения сгенерированы детерминированно (не из CSV)
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/v2"
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                        Вернуться к V2 <ExternalLink className="h-3 w-3" />
                    </Link>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 space-y-6">
                {/* Сам компонент */}
                <FunnelMockChart data={data} />

                {/* Инструкции */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <section className="border border-border rounded-sm bg-card p-4 space-y-3">
                        <h2 className="text-sm font-semibold">1. Формат бэк-ответа</h2>
                        <p className="text-xs text-muted-foreground">
                            Бэкенд отдаёт массив точек, одна точка на день, отсортированный по{" "}
                            <code className="bg-muted px-1 py-0.5 rounded text-[11px]">date</code>{" "}
                            по возрастанию.
                        </p>
                        <pre className="text-[11px] leading-snug bg-muted/60 rounded p-3 overflow-x-auto">
                            {`GET /api/funnel?from=2026-01-01&to=2026-01-30

Response 200:
[
  {
    "date": "YYYY-MM-DD",
    "taken": number,      // Взяли смену
    "attended": number,   // Вышли на объект
    "fines": number,      // Штраф (число событий)
    "cancelled": number   // Отменил
  },
  ...
]`}
                        </pre>
                        <p className="text-xs text-muted-foreground">
                            Реальный пример (первые 3 дня):
                        </p>
                        <pre className="text-[11px] leading-snug bg-muted/60 rounded p-3 overflow-x-auto">
                            {sampleJson}
                        </pre>
                        <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                            <li>
                                Пропуски в датах допустимы - фронт не дорисует за бэк, бары будут только в
                                те дни, что пришли.
                            </li>
                            <li>
                                Все 4 поля обязательны и числовые (0 если ничего не было).
                            </li>
                            <li>
                                <code className="bg-muted px-1 py-0.5 rounded text-[11px]">attended</code>{" "}
                                иногда может быть больше{" "}
                                <code className="bg-muted px-1 py-0.5 rounded text-[11px]">taken</code> (исполнитель
                                пришёл без записи) - это нормально.
                            </li>
                        </ul>
                    </section>

                    <section className="border border-border rounded-sm bg-card p-4 space-y-3">
                        <h2 className="text-sm font-semibold">2. Фронт-стек</h2>
                        <ul className="text-xs space-y-1.5">
                            <li>
                                <b>recharts 3.x</b> ·{" "}
                                <code className="bg-muted px-1 py-0.5 rounded text-[11px]">ComposedChart</code>{" "}
                                - гибрид бар-чарта и линий в одном поле
                            </li>
                            <li>
                                <b>Одна ось Y</b> для всех 4 серий - пропорции показываются честно.
                                Штрафы/отмены идут низко (их реально мало относительно смен).
                                Не используем dual-axis, чтобы штраф в 137 не выглядел выше столбика смен в 900.
                            </li>
                            <li>
                                <b>Легенда справа</b> (col-span-3) с описанием, totals и
                                кликабельным toggle (скрыть/показать серию). Встроенная recharts-легенда
                                подавлена.
                            </li>
                            <li>
                                <b>date-fns 4.x + ru</b> · форматирование «01.01», «1 января 2026»
                            </li>
                            <li>
                                <b>tailwindcss 4</b> · разметка KPI-ряда + контейнер
                            </li>
                        </ul>
                        <p className="text-xs text-muted-foreground pt-2 border-t">
                            Минимальный код использования компоненты:
                        </p>
                        <pre className="text-[11px] leading-snug bg-muted/60 rounded p-3 overflow-x-auto">
                            {`import { FunnelMockChart } from "./FunnelMockChart";

// data приходит с бэка как FunnelDayPoint[]
<FunnelMockChart data={data} />`}
                        </pre>
                        <p className="text-xs text-muted-foreground pt-2 border-t">
                            Файлы компоненты (клик - скачать):
                        </p>
                        <ul className="text-xs space-y-1.5">
                            {DOWNLOADS.map((d) => (
                                <li key={d.file} className="flex items-start gap-2">
                                    <a
                                        href={`/api/demo/download?file=${encodeURIComponent(d.file)}`}
                                        download={d.file}
                                        className="text-primary hover:underline inline-flex items-center gap-1 shrink-0"
                                    >
                                        <Download className="h-3 w-3" />
                                        <code className="bg-muted px-1 py-0.5 rounded text-[11px]">
                                            {FILE_PATH_LABEL[d.file]}
                                        </code>
                                    </a>
                                    <span className="text-muted-foreground">- {d.desc}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>

                <section className="border border-border rounded-sm bg-card p-4 space-y-3">
                    <h2 className="text-sm font-semibold">3. Адаптация под прод</h2>
                    <ol className="text-xs space-y-1.5 list-decimal pl-5">
                        <li>
                            Замени{" "}
                            <code className="bg-muted px-1 py-0.5 rounded text-[11px]">generateMockFunnel()</code>{" "}
                            на{" "}
                            <code className="bg-muted px-1 py-0.5 rounded text-[11px]">
                                fetch(&quot;/api/funnel?from=…&to=…&quot;).then(r =&gt; r.json())
                            </code>
                            .
                        </li>
                        <li>
                            На бэке посчитай по каждому дню в диапазоне 4 числа из реальных
                            таблиц (для TEOS:{" "}
                            <code className="bg-muted px-1 py-0.5 rounded text-[11px]">shift_users</code>,{" "}
                            <code className="bg-muted px-1 py-0.5 rounded text-[11px]">balance_log</code>) и
                            верни массив.
                        </li>
                        <li>
                            При желании добавь <i>completion_status</i>-фильтрацию (например, для
                            «Вышли на объект» брать{" "}
                            <code className="bg-muted px-1 py-0.5 rounded text-[11px]">completion_status</code> ∈
                            {" "}«success» ∪ «fine» ∪ «zero_production»).
                        </li>
                        <li>
                            Если периодов в фильтре больше 30 - на клиенте сагрегируй в недели/месяцы
                            тем же утильным{" "}
                            <code className="bg-muted px-1 py-0.5 rounded text-[11px]">aggregateByPeriod()</code>,
                            который уже используется в V2.
                        </li>
                    </ol>
                </section>
            </div>
        </div>
    );
}
