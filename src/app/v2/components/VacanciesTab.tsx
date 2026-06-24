"use client";

import { Panel } from "./Panel";
import { KpiCard } from "./KpiCard";
import { fmtNumber, fmtMoney, fmtPct } from "./format";
import { POWER_BI_COLORS, POWER_BI_PALETTE } from "@/lib/v2/enums";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";

interface VacancyRow {
    id: number;
    title: string;
    partnerTitle: string | null;
    tariffTitle: string | null;
    startDate: string | null;
    employees: number;
    totalEmployees: number;
    fillPct: number;
    costOneHour: number;
    costFull: number;
}

interface ProfessionRow {
    professionId: number;
    title: string;
    vacanciesCount: number;
    totalEmployees: number;
    filled: number;
    fillPct: number;
    avgRate: number;
}

interface TariffRow {
    tariffId: number;
    title: string;
    rateForUser: number;
    rateForCompany: number;
    delta: number;
    deltaPct: number;
    vacanciesCount: number;
}

interface VacanciesData {
    kpis: {
        total: number;
        filled: number;
        neededTotal: number;
        fillPct: number;
        avgCostOneHour: number;
        avgRatePerMinute: number;
        avgTotalCost: number;
    };
    lowestFill: VacancyRow[];
    highestCost: VacancyRow[];
    professions: ProfessionRow[];
    ageBuckets: { label: string; count: number }[];
    tariffs: TariffRow[];
}

export function VacanciesTab({ data, loading }: { data: VacanciesData | null; loading: boolean }) {
    if (loading) return <div className="p-6 text-center text-muted-foreground">Загрузка...</div>;
    if (!data) return <div className="p-6 text-center text-muted-foreground">Нет данных</div>;

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-6 gap-3">
                <KpiCard
                    label="Вакансий"
                    value={fmtNumber(data.kpis.total)}
                    accentColor={POWER_BI_COLORS.primary}
                />
                <KpiCard
                    label="Заполнено мест"
                    value={fmtNumber(data.kpis.filled)}
                    subtitle={`из ${fmtNumber(data.kpis.neededTotal)}`}
                    accentColor={POWER_BI_COLORS.teal}
                />
                <KpiCard
                    label="% заполнения"
                    value={fmtPct(data.kpis.fillPct)}
                    accentColor={POWER_BI_COLORS.green}
                />
                <KpiCard
                    label="Ср. ставка/час"
                    value={fmtMoney(data.kpis.avgCostOneHour)}
                    accentColor={POWER_BI_COLORS.orange}
                />
                <KpiCard
                    label="Ср. rate/мин"
                    value={fmtNumber(data.kpis.avgRatePerMinute, 2)}
                    accentColor={POWER_BI_COLORS.purple}
                />
                <KpiCard
                    label="Ср. бюджет"
                    value={fmtMoney(data.kpis.avgTotalCost)}
                    accentColor={POWER_BI_COLORS.deepBlue}
                />
            </div>

            <div className="grid grid-cols-12 gap-3">
                <Panel className="col-span-6 h-[340px]" title="Топ-10 профессий" subtitle="По количеству вакансий">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data.professions}
                            layout="vertical"
                            margin={{ top: 5, right: 10, left: 60, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <YAxis
                                type="category"
                                dataKey={(row: ProfessionRow) => row.title || `#${row.professionId}`}
                                tick={{ fontSize: 11 }}
                                width={140}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "var(--card)",
                                    borderColor: "var(--border)",
                                    fontSize: 12,
                                }}
                                formatter={(v, name) => {
                                    const num = Number(v) || 0;
                                    const n = String(name);
                                    if (n === "Заполнение %") return [fmtPct(num), n];
                                    if (n === "Ср. ставка") return [fmtMoney(num), n];
                                    return [fmtNumber(num), n];
                                }}
                            />
                            <Bar dataKey="vacanciesCount" name="Вакансий" fill={POWER_BI_COLORS.primary} />
                        </BarChart>
                    </ResponsiveContainer>
                </Panel>

                <Panel className="col-span-3 h-[340px]" title="Возрастные группы" subtitle="Распределение вакансий">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.ageBuckets} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "var(--card)",
                                    borderColor: "var(--border)",
                                    fontSize: 12,
                                }}
                            />
                            <Bar dataKey="count" name="Вакансии">
                                {data.ageBuckets.map((_, i) => (
                                    <Cell key={i} fill={POWER_BI_PALETTE[i % POWER_BI_PALETTE.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </Panel>

                <Panel className="col-span-3 h-[340px]" title="Тарифы: user vs company" subtitle="Топ-15 по популярности">
                    <div className="overflow-y-auto h-full text-xs">
                        <table className="w-full">
                            <thead className="sticky top-0 bg-card border-b">
                                <tr className="text-left text-muted-foreground">
                                    <th className="py-1 px-1 font-medium">Тариф</th>
                                    <th className="py-1 px-1 font-medium text-right">Маржа</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.tariffs.map((t, i) => (
                                    <tr key={t.tariffId} className={i % 2 ? "bg-muted/20" : ""}>
                                        <td className="py-1 px-1 truncate max-w-[140px]" title={t.title}>
                                            {t.title}
                                        </td>
                                        <td className="py-1 px-1 text-right">{fmtPct(t.deltaPct)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Panel>
            </div>

            <div className="grid grid-cols-12 gap-3">
                <Panel className="col-span-6" title="Худшая заполняемость" subtitle="Топ-20 недобранных вакансий">
                    <div className="overflow-x-auto text-xs">
                        <table className="w-full">
                            <thead className="border-b">
                                <tr className="text-left text-muted-foreground">
                                    <th className="py-1.5 px-2 font-medium">Вакансия</th>
                                    <th className="py-1.5 px-2 font-medium">Партнёр</th>
                                    <th className="py-1.5 px-2 font-medium text-right">Набор</th>
                                    <th className="py-1.5 px-2 font-medium text-right">Заполн.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.lowestFill.map((v, i) => (
                                    <tr key={v.id} className={i % 2 ? "bg-muted/20" : ""}>
                                        <td className="py-1 px-2 truncate max-w-[200px]" title={v.title}>
                                            {v.title}
                                        </td>
                                        <td className="py-1 px-2 text-muted-foreground truncate max-w-[140px]">
                                            {v.partnerTitle ?? "-"}
                                        </td>
                                        <td className="py-1 px-2 text-right">
                                            {v.employees}/{v.totalEmployees}
                                        </td>
                                        <td className="py-1 px-2 text-right">
                                            <span
                                                className={`font-medium ${v.fillPct < 50 ? "text-red-700" : "text-yellow-700"}`}
                                            >
                                                {fmtPct(v.fillPct)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Panel>

                <Panel className="col-span-6" title="Самые дорогие" subtitle="Топ-20 по бюджету вакансии">
                    <div className="overflow-x-auto text-xs">
                        <table className="w-full">
                            <thead className="border-b">
                                <tr className="text-left text-muted-foreground">
                                    <th className="py-1.5 px-2 font-medium">Вакансия</th>
                                    <th className="py-1.5 px-2 font-medium">Партнёр</th>
                                    <th className="py-1.5 px-2 font-medium text-right">Ставка/час</th>
                                    <th className="py-1.5 px-2 font-medium text-right">Бюджет</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.highestCost.map((v, i) => (
                                    <tr key={v.id} className={i % 2 ? "bg-muted/20" : ""}>
                                        <td className="py-1 px-2 truncate max-w-[200px]" title={v.title}>
                                            {v.title}
                                        </td>
                                        <td className="py-1 px-2 text-muted-foreground truncate max-w-[140px]">
                                            {v.partnerTitle ?? "-"}
                                        </td>
                                        <td className="py-1 px-2 text-right">{fmtMoney(v.costOneHour)}</td>
                                        <td className="py-1 px-2 text-right font-medium">{fmtMoney(v.costFull)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Panel>
            </div>
        </div>
    );
}
