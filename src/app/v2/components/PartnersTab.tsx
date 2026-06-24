"use client";

import { Panel } from "./Panel";
import { KpiCard } from "./KpiCard";
import { fmtNumber, fmtMoney, fmtPct } from "./format";
import { POWER_BI_COLORS, POWER_BI_PALETTE } from "@/lib/v2/enums";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

interface PartnerRow {
    id: number;
    title: string;
    cityTitle: string | null;
    commissionRate: number | null;
    ndsRate: number | null;
    companiesCount: number;
    vacanciesCount: number;
    shiftsCount: number;
    revenue: number;
    payouts: number;
    margin: number;
    marginPct: number;
    parentId: number | null;
}

interface PartnersData {
    rows: PartnerRow[];
    daily: { date: string; byPartner: Record<number, number>; total: number }[];
    totalRevenue: number;
    totalPayouts: number;
    totalMargin: number;
}

export function PartnersTab({ data, loading }: { data: PartnersData | null; loading: boolean }) {
    if (loading) return <div className="p-6 text-center text-muted-foreground">Загрузка...</div>;
    if (!data) return <div className="p-6 text-center text-muted-foreground">Нет данных</div>;

    const topPartners = data.rows.slice(0, 5);
    const marginPct = data.totalRevenue > 0 ? (data.totalMargin / data.totalRevenue) * 100 : 0;

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-4 gap-3">
                <KpiCard
                    label="Всего партнёров"
                    value={fmtNumber(data.rows.length)}
                    accentColor={POWER_BI_COLORS.primary}
                />
                <KpiCard
                    label="Выручка"
                    value={fmtMoney(data.totalRevenue)}
                    accentColor={POWER_BI_COLORS.green}
                    subtitle="Σ tariff.rate_for_company × production"
                />
                <KpiCard
                    label="Выплаты"
                    value={fmtMoney(data.totalPayouts)}
                    accentColor={POWER_BI_COLORS.red}
                    subtitle="balance_log (type=1) по смене"
                />
                <KpiCard
                    label="Маржа"
                    value={fmtMoney(data.totalMargin)}
                    subtitle={`${fmtPct(marginPct)} от выручки`}
                    accentColor={POWER_BI_COLORS.purple}
                />
            </div>

            <Panel
                title="Выручка по топ-5 партнёрам во времени"
                subtitle="Ежедневная Σ tariff.rate_for_company × production по смене"
                className="h-[360px]"
            >
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.daily} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10 }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            interval="preserveStartEnd"
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "var(--card)",
                                borderColor: "var(--border)",
                                fontSize: 12,
                            }}
                            formatter={(v) => fmtMoney(Number(v) || 0)}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        {topPartners.map((p, i) => (
                            <Line
                                key={p.id}
                                type="monotone"
                                dataKey={(row: { byPartner: Record<number, number> }) => row.byPartner[p.id] ?? 0}
                                name={p.title}
                                stroke={POWER_BI_PALETTE[i % POWER_BI_PALETTE.length]}
                                dot={false}
                                strokeWidth={2}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </Panel>

            <Panel title="Партнёры: полная таблица" subtitle="С комиссиями, объёмами и маржой">
                <div className="overflow-x-auto text-xs">
                    <table className="w-full">
                        <thead className="border-b">
                            <tr className="text-left text-muted-foreground">
                                <th className="py-1.5 px-2 font-medium">Название</th>
                                <th className="py-1.5 px-2 font-medium">Город</th>
                                <th className="py-1.5 px-2 font-medium text-right">Комиссия</th>
                                <th className="py-1.5 px-2 font-medium text-right">НДС</th>
                                <th className="py-1.5 px-2 font-medium text-right">Компаний</th>
                                <th className="py-1.5 px-2 font-medium text-right">Вакансий</th>
                                <th className="py-1.5 px-2 font-medium text-right">Смен</th>
                                <th className="py-1.5 px-2 font-medium text-right">Выручка</th>
                                <th className="py-1.5 px-2 font-medium text-right">Выплаты</th>
                                <th className="py-1.5 px-2 font-medium text-right">Маржа</th>
                                <th className="py-1.5 px-2 font-medium text-right">Маржа %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.rows.map((p, i) => (
                                <tr key={p.id} className={i % 2 ? "bg-muted/20" : ""}>
                                    <td className="py-1 px-2 font-medium">{p.title}</td>
                                    <td className="py-1 px-2 text-muted-foreground">{p.cityTitle ?? "-"}</td>
                                    <td className="py-1 px-2 text-right">{p.commissionRate != null ? fmtNumber(p.commissionRate, 2) : "-"}</td>
                                    <td className="py-1 px-2 text-right">{p.ndsRate != null ? fmtNumber(p.ndsRate, 2) : "-"}</td>
                                    <td className="py-1 px-2 text-right">{p.companiesCount}</td>
                                    <td className="py-1 px-2 text-right">{p.vacanciesCount}</td>
                                    <td className="py-1 px-2 text-right">{p.shiftsCount}</td>
                                    <td className="py-1 px-2 text-right text-green-700">{fmtMoney(p.revenue)}</td>
                                    <td className="py-1 px-2 text-right text-red-700">{fmtMoney(p.payouts)}</td>
                                    <td className="py-1 px-2 text-right font-medium">{fmtMoney(p.margin)}</td>
                                    <td className="py-1 px-2 text-right">
                                        <span
                                            className={`font-medium ${p.marginPct >= 0 ? "text-green-700" : "text-red-700"}`}
                                        >
                                            {fmtPct(p.marginPct)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Panel>
        </div>
    );
}
