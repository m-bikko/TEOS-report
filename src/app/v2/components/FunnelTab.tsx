"use client";

import { useMemo, useState } from "react";
import { Panel } from "./Panel";
import { KpiCard } from "./KpiCard";
import { fmtNumber, fmtPct, fmtMoney } from "./format";
import { Period, PERIOD_LABELS, aggregateByPeriod, formatPeriodLabel } from "./period";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    ComposedChart,
    Line,
} from "recharts";
import {
    SHIFT_STATUS,
    SHIFT_STATUS_ORDER,
    STATUS_COLORS,
    COMPLETION_STATUS_LABEL,
    COMPLETION_COLORS,
    PAYMENT_STATUS_LABEL,
    PAYMENT_COLORS,
    POWER_BI_COLORS,
} from "@/lib/v2/enums";
import { Users, Activity, Clock, Timer } from "lucide-react";

type ViewMode = "shifts" | "executors" | "hours";

function CompactMetric({
    label,
    value,
    hint,
    accentColor,
}: {
    label: string;
    value: string;
    hint: string;
    accentColor: string;
}) {
    return (
        <div className="border-l-2 pl-3 py-1" style={{ borderLeftColor: accentColor }}>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium leading-tight">
                {label}
            </div>
            <div className="text-xl font-semibold leading-tight mt-1">{value}</div>
            <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">{hint}</div>
        </div>
    );
}

interface FunnelData {
    shiftStatus: { status: number; label: string; count: number }[];
    assignmentsByStatus: { status: number; label: string; count: number }[];
    hoursByStatus: { status: number; label: string; count: number }[];
    timeline: { date: string; byStatus: Record<number, number>; total: number }[];
    assignmentTimeline: { date: string; byStatus: Record<number, number>; total: number }[];
    hoursTimeline: { date: string; byStatus: Record<number, number>; total: number }[];
    completion: { key: string; count: number }[];
    payment: { key: string; count: number }[];
    funnel: { status: number; label: string; count: number; dropOffPct: number }[];
    avr: {
        total: number;
        userSignedPct: number;
        partnerSignedPct: number;
        cmsSignedPct: number;
        withDatePct: number;
    };
    production: { total: number; adjusted: number; adjustedPct: number; sumDelta: number };
    totalShifts: number;
    totalAssignments: number;
    planFact: { date: string; plan: number; fact: number }[];
    costVsPayout: { date: string; cost: number; payouts: number }[];
    overview: {
        totalShifts: number;
        inWork: number;
        inRecruiting: number;
        totalAssignments: number;
        planExecutors: number;
        factExecutors: number;
        fulfillmentPct: number;
        expectedCost: number;
        actualPayouts: number;
        costDelta: number;
        costDeltaPct: number;
        hoursTotal: number;
        hoursHourly: number;
        hoursFlat: number;
        hourlyAssignments: number;
        flatAssignments: number;
        unknownTariffAssignments: number;
    };
}

export function FunnelTab({ data, loading }: { data: FunnelData | null; loading: boolean }) {
    const [viewMode, setViewMode] = useState<ViewMode>("shifts");
    const [period, setPeriod] = useState<Period>("day");

    const aggTimeline = useMemo(() => {
        if (!data) return [];
        const source =
            viewMode === "shifts"
                ? data.timeline
                : viewMode === "executors"
                    ? data.assignmentTimeline
                    : data.hoursTimeline;
        return aggregateByPeriod(
            source,
            period,
            (acc, next) => {
                const byStatus: Record<number, number> = { ...acc.byStatus };
                for (const [s, v] of Object.entries(next.byStatus)) {
                    byStatus[Number(s)] = (byStatus[Number(s)] ?? 0) + v;
                }
                return { date: acc.date, byStatus, total: acc.total + next.total };
            },
            (first) => ({ date: first.date, byStatus: { ...first.byStatus }, total: 0 }),
        );
    }, [data, viewMode, period]);

    const aggPlanFact = useMemo(() => {
        if (!data) return [];
        return aggregateByPeriod(
            data.planFact,
            period,
            (acc, next) => ({ date: acc.date, plan: acc.plan + next.plan, fact: acc.fact + next.fact }),
            (first) => ({ date: first.date, plan: 0, fact: 0 }),
        );
    }, [data, period]);

    const aggHoursTimeline = useMemo(() => {
        if (!data) return [];
        return aggregateByPeriod(
            data.hoursTimeline,
            period,
            (acc, next) => {
                const byStatus: Record<number, number> = { ...acc.byStatus };
                for (const [s, v] of Object.entries(next.byStatus)) {
                    byStatus[Number(s)] = (byStatus[Number(s)] ?? 0) + v;
                }
                return { date: acc.date, byStatus, total: acc.total + next.total };
            },
            (first) => ({ date: first.date, byStatus: { ...first.byStatus }, total: 0 }),
        );
    }, [data, period]);

    const aggCostVsPayout = useMemo(() => {
        if (!data) return [];
        return aggregateByPeriod(
            data.costVsPayout,
            period,
            (acc, next) => ({ date: acc.date, cost: acc.cost + next.cost, payouts: acc.payouts + next.payouts }),
            (first) => ({ date: first.date, cost: 0, payouts: 0 }),
        );
    }, [data, period]);

    if (loading) return <div className="p-6 text-center text-muted-foreground">Загрузка...</div>;
    if (!data) return <div className="p-6 text-center text-muted-foreground">Нет данных</div>;

    const activeStatusData =
        viewMode === "shifts"
            ? data.shiftStatus
            : viewMode === "executors"
                ? data.assignmentsByStatus
                : data.hoursByStatus;
    const statusMap = new Map(activeStatusData.map((s) => [s.status, s.count]));
    const viewLabel = viewMode === "shifts" ? "смен" : viewMode === "executors" ? "назначений" : "часов";
    const chartTitle =
        viewMode === "shifts"
            ? "Смены по дням и статусам"
            : viewMode === "executors"
                ? "Исполнители по дням и статусам смен"
                : "Часы работы по дням и статусам смен";
    const chartSubtitle =
        viewMode === "hours"
            ? "type=1 → production · type=2,3,4 → назначения × 9ч"
            : `Стек по статусу · Y — количество ${viewLabel}`;
    const tickFormatter = (v: string) => formatPeriodLabel(v, period);
    const PERIOD_ORDER: Period[] = ["day", "week", "month", "year"];

    type TooltipPayloadItem = { value?: number | string; color?: string; dataKey?: string | number };
    const PlanFactTooltip = ({
        active,
        payload,
        label,
    }: {
        active?: boolean;
        payload?: TooltipPayloadItem[];
        label?: string;
    }) => {
        if (!active || !payload || payload.length === 0) return null;
        const planItem = payload.find((p) => p.dataKey === "plan");
        const factItem = payload.find((p) => p.dataKey === "fact");
        const plan = Number(planItem?.value ?? 0);
        const fact = Number(factItem?.value ?? 0);
        const pct = plan > 0 ? (fact / plan) * 100 : 0;
        const pctColor = pct >= 90 ? "#3AA76D" : pct >= 60 ? "#F4B942" : "#D64550";
        return (
            <div
                style={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    fontSize: 12,
                }}
                className="border rounded-sm p-2 min-w-[140px] shadow-sm"
            >
                <div className="font-medium mb-1">
                    {typeof label === "string" ? tickFormatter(label) : label}
                </div>
                {planItem && (
                    <div style={{ color: planItem.color ?? undefined }}>
                        План: <b>{fmtNumber(plan)}</b>
                    </div>
                )}
                {factItem && (
                    <div style={{ color: factItem.color ?? undefined }}>
                        Факт: <b>{fmtNumber(fact)}</b>
                    </div>
                )}
                <div style={{ color: pctColor, marginTop: 2 }}>
                    %: <b>{fmtPct(pct)}</b>
                </div>
            </div>
        );
    };

    const completionChart = data.completion.map((c) => ({
        name: COMPLETION_STATUS_LABEL[c.key] ?? c.key,
        value: c.count,
        color: COMPLETION_COLORS[c.key] ?? POWER_BI_COLORS.primary,
    }));

    const paymentChart = data.payment.map((c) => ({
        name: PAYMENT_STATUS_LABEL[c.key] ?? c.key,
        value: c.count,
        color: PAYMENT_COLORS[c.key] ?? POWER_BI_COLORS.primary,
    }));

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-1 border border-border rounded-sm p-0.5 bg-card">
                    <button
                        type="button"
                        onClick={() => setViewMode("shifts")}
                        className={`text-xs px-3 py-1.5 rounded-sm flex items-center gap-1.5 transition-colors ${
                            viewMode === "shifts"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Activity className="h-3.5 w-3.5" /> Смены
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode("executors")}
                        className={`text-xs px-3 py-1.5 rounded-sm flex items-center gap-1.5 transition-colors ${
                            viewMode === "executors"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Users className="h-3.5 w-3.5" /> Исполнители
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode("hours")}
                        className={`text-xs px-3 py-1.5 rounded-sm flex items-center gap-1.5 transition-colors ${
                            viewMode === "hours"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Timer className="h-3.5 w-3.5" /> Часы
                    </button>
                </div>

                <div className="flex items-center gap-1 border border-border rounded-sm p-0.5 bg-card">
                    {PERIOD_ORDER.map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => setPeriod(p)}
                            className={`text-xs px-3 py-1.5 rounded-sm transition-colors ${
                                period === p
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {PERIOD_LABELS[p]}
                        </button>
                    ))}
                </div>

                <div className="text-xs text-muted-foreground">
                    Всего: {fmtNumber(data.totalShifts)} смен · {fmtNumber(data.totalAssignments)} назначений
                </div>
            </div>

            <div className="grid grid-cols-6 gap-3">
                {SHIFT_STATUS_ORDER.map((code) => (
                    <KpiCard
                        key={code}
                        label={SHIFT_STATUS[code]}
                        value={fmtNumber(statusMap.get(code) ?? 0)}
                        subtitle={viewLabel}
                        accentColor={STATUS_COLORS[code]}
                    />
                ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
                <KpiCard
                    label="Всего часов"
                    value={fmtNumber(data.overview.hoursTotal, 1)}
                    subtitle={`${fmtNumber(data.overview.hourlyAssignments + data.overview.flatAssignments)} назначений`}
                    accentColor={POWER_BI_COLORS.primary}
                    icon={<Clock className="h-3.5 w-3.5" />}
                />
                <KpiCard
                    label="Часы — часовой тариф (type 1)"
                    value={fmtNumber(data.overview.hoursHourly, 1)}
                    subtitle={`${fmtNumber(data.overview.hourlyAssignments)} назн. · production напрямую`}
                    accentColor={POWER_BI_COLORS.teal}
                    icon={<Clock className="h-3.5 w-3.5" />}
                />
                <KpiCard
                    label="Часы — остальные (2,3,4)"
                    value={fmtNumber(data.overview.hoursFlat, 0)}
                    subtitle={`${fmtNumber(data.overview.flatAssignments)} назн. × 9ч${data.overview.unknownTariffAssignments > 0 ? ` · ${fmtNumber(data.overview.unknownTariffAssignments)} без тарифа` : ""}`}
                    accentColor={POWER_BI_COLORS.orange}
                    icon={<Clock className="h-3.5 w-3.5" />}
                />
            </div>

            <div className="grid grid-cols-12 gap-3">
                <Panel
                    className="col-span-8 h-[360px]"
                    title={chartTitle}
                    subtitle={chartSubtitle}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={aggTimeline} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={tickFormatter}
                                tick={{ fontSize: 10 }}
                                stroke="currentColor"
                                angle={-45}
                                textAnchor="end"
                                height={60}
                                interval="preserveStartEnd"
                            />
                            <YAxis tick={{ fontSize: 11 }} stroke="currentColor" />
                            <Tooltip
                                labelFormatter={tickFormatter}
                                contentStyle={{
                                    backgroundColor: "var(--card)",
                                    borderColor: "var(--border)",
                                    fontSize: 12,
                                }}
                            />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            {SHIFT_STATUS_ORDER.map((code) => (
                                <Bar
                                    key={code}
                                    dataKey={(row: { byStatus: Record<number, number> }) => row.byStatus[code] ?? 0}
                                    name={SHIFT_STATUS[code]}
                                    stackId="s"
                                    fill={STATUS_COLORS[code]}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </Panel>

                <Panel className="col-span-4 h-[360px]" title="Воронка смен" subtitle="Прохождение этапов, drop-off">
                    <div className="h-full flex flex-col justify-center gap-2">
                        {data.funnel.map((stage) => {
                            const maxCount = Math.max(...data.funnel.map((s) => s.count), 1);
                            const widthPct = (stage.count / maxCount) * 100;
                            return (
                                <div key={stage.status} className="space-y-0.5">
                                    <div className="flex justify-between text-xs">
                                        <span className="font-medium">{stage.label}</span>
                                        <span className="text-muted-foreground">
                                            {fmtNumber(stage.count)}
                                            {stage.dropOffPct > 0 && (
                                                <span className="ml-2 text-red-600">−{fmtPct(stage.dropOffPct)}</span>
                                            )}
                                        </span>
                                    </div>
                                    <div className="h-5 bg-muted rounded-sm overflow-hidden">
                                        <div
                                            className="h-full rounded-sm"
                                            style={{
                                                width: `${widthPct}%`,
                                                backgroundColor: STATUS_COLORS[stage.status],
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Panel>
            </div>

            <Panel
                className="h-[360px]"
                title="Часы работы по дням и статусам"
                subtitle="type=1 → production · type=2,3,4 → назначения × 9ч · стек по статусу"
                right={
                    <div className="text-xs text-muted-foreground">
                        Всего: <b className="text-foreground">{fmtNumber(data.overview.hoursTotal, 0)}</b> ч
                    </div>
                }
            >
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={aggHoursTimeline} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="date"
                            tickFormatter={tickFormatter}
                            tick={{ fontSize: 10 }}
                            stroke="currentColor"
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            interval="preserveStartEnd"
                        />
                        <YAxis tick={{ fontSize: 11 }} stroke="currentColor" />
                        <Tooltip
                            labelFormatter={tickFormatter}
                            contentStyle={{
                                backgroundColor: "var(--card)",
                                borderColor: "var(--border)",
                                fontSize: 12,
                            }}
                            formatter={(v) => `${fmtNumber(Number(v) || 0, 1)} ч`}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        {SHIFT_STATUS_ORDER.map((code) => (
                            <Bar
                                key={code}
                                dataKey={(row: { byStatus: Record<number, number> }) => row.byStatus[code] ?? 0}
                                name={SHIFT_STATUS[code]}
                                stackId="h"
                                fill={STATUS_COLORS[code]}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </Panel>

            <div className="grid grid-cols-12 gap-3">
                <Panel
                    className="col-span-8 h-[360px]"
                    title="План vs Факт исполнителей"
                    subtitle="План = Σ vacancy.total_employees_count · Факт = Σ shift_users"
                    right={
                        <div className="flex gap-3 text-xs">
                            <span className="text-muted-foreground">
                                План: <b className="text-foreground">{fmtNumber(data.overview.planExecutors)}</b>
                            </span>
                            <span className="text-muted-foreground">
                                Факт: <b className="text-foreground">{fmtNumber(data.overview.factExecutors)}</b>
                            </span>
                            <span
                                className={
                                    data.overview.fulfillmentPct >= 90
                                        ? "text-green-700 font-medium"
                                        : data.overview.fulfillmentPct >= 60
                                            ? "text-yellow-700 font-medium"
                                            : "text-red-700 font-medium"
                                }
                            >
                                {fmtPct(data.overview.fulfillmentPct)}
                            </span>
                        </div>
                    }
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={aggPlanFact} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={tickFormatter}
                                tick={{ fontSize: 10 }}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                                interval="preserveStartEnd"
                            />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip content={<PlanFactTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="plan" name="План" fill={POWER_BI_COLORS.deepBlue} opacity={0.5} />
                            <Line
                                type="monotone"
                                dataKey="fact"
                                name="Факт"
                                stroke={POWER_BI_COLORS.orange}
                                strokeWidth={2}
                                dot={false}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </Panel>

                <Panel
                    className="col-span-4 h-[360px]"
                    title="Стоимость vs Выплаты"
                    subtitle="tariff × production vs факт выплат по сменам"
                >
                    <div className="h-full flex flex-col justify-around gap-2">
                        <CompactMetric
                            label="Расчётная стоимость"
                            value={fmtMoney(data.overview.expectedCost)}
                            hint="Σ tariff.rate_for_company × production"
                            accentColor={POWER_BI_COLORS.deepBlue}
                        />
                        <CompactMetric
                            label="Фактические выплаты"
                            value={fmtMoney(data.overview.actualPayouts)}
                            hint="balance_log (type=1) по смене"
                            accentColor={POWER_BI_COLORS.orange}
                        />
                        <CompactMetric
                            label="Расхождение"
                            value={fmtMoney(data.overview.costDelta)}
                            hint={fmtPct(data.overview.costDeltaPct)}
                            accentColor={
                                data.overview.costDelta >= 0
                                    ? POWER_BI_COLORS.green
                                    : POWER_BI_COLORS.red
                            }
                        />
                    </div>
                </Panel>
            </div>

            <Panel
                title="Динамика стоимости vs выплат"
                subtitle="По дате смены (сопоставляется per-shift, не по дате транзакции)"
                className="h-[320px]"
            >
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={aggCostVsPayout} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="date"
                            tickFormatter={tickFormatter}
                            tick={{ fontSize: 10 }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            interval="preserveStartEnd"
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                            labelFormatter={tickFormatter}
                            contentStyle={{
                                backgroundColor: "var(--card)",
                                borderColor: "var(--border)",
                                fontSize: 12,
                            }}
                            formatter={(v) => fmtMoney(Number(v) || 0)}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="cost" name="Стоимость" fill={POWER_BI_COLORS.deepBlue} />
                        <Bar dataKey="payouts" name="Выплаты" fill={POWER_BI_COLORS.orange} />
                    </ComposedChart>
                </ResponsiveContainer>
            </Panel>

            <div className="grid grid-cols-12 gap-3">
                <Panel className="col-span-4 h-[300px]" title="Completion status" subtitle="Распределение по итогу">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={completionChart} dataKey="value" nameKey="name" outerRadius={80} label={false}>
                                {completionChart.map((c, i) => (
                                    <Cell key={i} fill={c.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "var(--card)",
                                    borderColor: "var(--border)",
                                    fontSize: 12,
                                }}
                            />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </Panel>

                <Panel className="col-span-4 h-[300px]" title="Payment status" subtitle="Оплата назначений">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={paymentChart} dataKey="value" nameKey="name" outerRadius={80} label={false}>
                                {paymentChart.map((c, i) => (
                                    <Cell key={i} fill={c.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "var(--card)",
                                    borderColor: "var(--border)",
                                    fontSize: 12,
                                }}
                            />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </Panel>

                <Panel className="col-span-4 h-[300px]" title="AVR-подписи и корректировки" subtitle="Покрытие подписей">
                    <div className="space-y-3">
                        {[
                            { label: "Подпись исполнителя", value: data.avr.userSignedPct },
                            { label: "Подпись партнёра", value: data.avr.partnerSignedPct },
                            { label: "Подпись CMS (ACM)", value: data.avr.cmsSignedPct },
                            { label: "С датой AVR", value: data.avr.withDatePct },
                        ].map((row) => (
                            <div key={row.label}>
                                <div className="flex justify-between text-xs mb-0.5">
                                    <span>{row.label}</span>
                                    <span className="font-medium">{fmtPct(row.value)}</span>
                                </div>
                                <div className="h-1.5 bg-muted rounded-sm overflow-hidden">
                                    <div
                                        className="h-full"
                                        style={{
                                            width: `${Math.min(row.value, 100)}%`,
                                            backgroundColor: POWER_BI_COLORS.primary,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                        <div className="pt-2 border-t text-xs">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Корректировки production</span>
                                <span className="font-medium">
                                    {fmtNumber(data.production.adjusted)} ({fmtPct(data.production.adjustedPct)})
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Сумма расхождений</span>
                                <span className="font-medium">
                                    {data.production.sumDelta >= 0 ? "+" : ""}
                                    {fmtNumber(data.production.sumDelta, 2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </Panel>
            </div>
        </div>
    );
}
