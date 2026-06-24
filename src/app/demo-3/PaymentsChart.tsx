"use client";

/**
 * ──────────────────────────────────────────────────────────────────────────
 * Универсальная компонента «Выплаты по дням и партнёрам» (/demo-3).
 *
 * НА ЧЁМ:
 *   - recharts 3.x - LineChart с N линиями (N = число партнёров)
 *   - date-fns 4.x + ru - подписи дат
 *   - tailwindcss 4 - раскладка
 *
 * ВХОДНЫЕ ДАННЫЕ:
 *   events: PaymentEvent[]  - массив выплат за период, уже отфильтрованный по каналу
 *
 * ЛЭЙАУТ:
 *   col-9: линейный график (одна линия на партнёра)
 *   col-3: справа сайдбар:
 *      [блок 1] - общие KPI по этой выборке (сумма / комиссия / среднее / count)
 *      [блок 2] - кликабельные партнёры с totals (toggle hide/show линии)
 * ──────────────────────────────────────────────────────────────────────────
 */

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { PARTNERS, PaymentEvent } from "./mockData3";

interface Props {
    title: string;
    subtitle: string;
    events: PaymentEvent[];
    /** Если задан - справа покажется доп. строка «Комиссия (X%)» */
    commissionPct?: number;
}

const fmtMoney = (n: number): string => `${Math.round(n).toLocaleString("ru-RU")} ₸`;

const fmtMoneyAxis = (n: number): string => Math.round(n).toLocaleString("ru-RU");

const fmtNumber = (n: number): string => n.toLocaleString("ru-RU");

export function PaymentsChart({ title, subtitle, events, commissionPct }: Props) {
    const [hidden, setHidden] = useState<Set<number>>(new Set());

    // Собрать дневную сетку: для каждой даты - сумма по каждому partnerId
    const series = useMemo(() => {
        const byDate = new Map<string, Record<string, number>>();
        for (const e of events) {
            let day = byDate.get(e.paymentDate);
            if (!day) {
                day = {};
                byDate.set(e.paymentDate, day);
            }
            const key = String(e.partnerId);
            day[key] = (day[key] ?? 0) + e.amount;
        }
        const out: Array<{ date: string } & Record<string, number | string>> = [];
        for (const [date, byPartner] of byDate.entries()) {
            out.push({ date, ...byPartner });
        }
        out.sort((a, b) => a.date.localeCompare(b.date));
        return out;
    }, [events]);

    // Итоги per-partner для правого сайдбара
    const partnerTotals = useMemo(() => {
        const m = new Map<number, { total: number; count: number }>();
        for (const p of PARTNERS) m.set(p.id, { total: 0, count: 0 });
        for (const e of events) {
            const t = m.get(e.partnerId);
            if (!t) continue;
            t.total += e.amount;
            t.count += 1;
        }
        return m;
    }, [events]);

    const grandTotal = useMemo(() => {
        let s = 0;
        for (const e of events) s += e.amount;
        return s;
    }, [events]);

    const count = events.length;
    const avg = count > 0 ? grandTotal / count : 0;
    const commission =
        commissionPct != null ? grandTotal * (commissionPct / 100) : null;

    const tickFormatter = (iso: string) => {
        try {
            return format(parseISO(iso), "dd.MM", { locale: ru });
        } catch {
            return iso;
        }
    };

    const tooltipLabelFormatter = (iso: string) => {
        try {
            return format(parseISO(iso), "d MMMM yyyy", { locale: ru });
        } catch {
            return iso;
        }
    };

    const toggle = (id: number) => {
        setHidden((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <div className="border border-border rounded-sm bg-card p-4">
            <div className="mb-3">
                <h2 className="text-sm font-semibold">{title}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            </div>

            <div className="grid grid-cols-12 gap-4">
                {/* График */}
                <div className="col-span-12 lg:col-span-9 h-[420px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={series}
                            margin={{ top: 10, right: 12, left: 0, bottom: 24 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={tickFormatter}
                                tick={{ fontSize: 11 }}
                                angle={-45}
                                textAnchor="end"
                                height={48}
                                interval={0}
                            />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtMoneyAxis} />
                            <Tooltip
                                labelFormatter={tooltipLabelFormatter}
                                formatter={(v) => fmtMoney(Number(v) || 0)}
                                contentStyle={{
                                    backgroundColor: "var(--card)",
                                    borderColor: "var(--border)",
                                    fontSize: 12,
                                }}
                            />
                            <Legend wrapperStyle={{ display: "none" }} />
                            {PARTNERS.map((p) => (
                                <Line
                                    key={p.id}
                                    type="monotone"
                                    dataKey={String(p.id)}
                                    name={p.name}
                                    stroke={p.color}
                                    strokeWidth={2}
                                    dot={false}
                                    hide={hidden.has(p.id)}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Правая панель: KPI + список партнёров */}
                <aside className="col-span-12 lg:col-span-3 flex flex-col gap-2 text-xs">
                    {/* Блок 1: общие метрики */}
                    <div className="border rounded-sm p-2 space-y-1 bg-muted/20">
                        <KpiRow label="Общая сумма" value={fmtMoney(grandTotal)} bold />
                        {commission != null && (
                            <KpiRow
                                label={`Комиссия (${commissionPct}%)`}
                                value={fmtMoney(commission)}
                                accent="text-orange-700"
                            />
                        )}
                        <KpiRow label="Среднее выплаты" value={fmtMoney(avg)} />
                        <KpiRow label="Количество выплат" value={fmtNumber(count)} />
                    </div>

                    {/* Блок 2: партнёры (toggle) */}
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mt-1">
                        Партнёры (клик - скрыть/показать)
                    </div>
                    {PARTNERS.map((p) => {
                        const isHidden = hidden.has(p.id);
                        const stats = partnerTotals.get(p.id);
                        return (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => toggle(p.id)}
                                className={`text-left rounded-sm border px-2 py-1.5 transition-colors ${
                                    isHidden
                                        ? "border-border bg-muted/30 opacity-50"
                                        : "border-border bg-card hover:bg-muted/40"
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="inline-flex items-center gap-2 font-medium">
                                        <span
                                            className="w-3 h-0.5 shrink-0"
                                            style={{ backgroundColor: p.color }}
                                        />
                                        {p.name}
                                    </span>
                                    <span className="text-muted-foreground tabular-nums">
                                        {fmtMoney(stats?.total ?? 0)}
                                    </span>
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-0.5">
                                    {fmtNumber(stats?.count ?? 0)} выплат
                                </div>
                            </button>
                        );
                    })}
                </aside>
            </div>
        </div>
    );
}

function KpiRow({
    label,
    value,
    bold,
    accent,
}: {
    label: string;
    value: string;
    bold?: boolean;
    accent?: string;
}) {
    return (
        <div className="flex items-baseline justify-between gap-2">
            <span className="text-muted-foreground">{label}</span>
            <span
                className={`${bold ? "text-sm font-semibold" : "font-medium"} ${
                    accent ?? "text-foreground"
                } tabular-nums`}
            >
                {value}
            </span>
        </div>
    );
}
