"use client";

/**
 * ──────────────────────────────────────────────────────────────────────────
 * График «Заказы по дням и статусам» (Chart 1 на /demo-2).
 *
 * НА ЧЁМ:
 *   - recharts 3.x — BarChart со стек-барами
 *   - date-fns 4.x + ru — подписи дат
 *   - tailwindcss 4 — раскладка
 *
 * ФОРМАТ ДАННЫХ:
 *   data: OrderDayPoint[]  где OrderDayPoint = {
 *       date: "YYYY-MM-DD",
 *       inRecruiting: number,  // В наборе
 *       inWork: number,        // В работе
 *       inApproval: number,    // В согласовании
 *       inPayment: number,     // В оплате
 *       archived: number,      // В архиве
 *       cancelled: number,     // Отменённые
 *   }
 *
 * ЛЭЙАУТ:
 *   grid col-9 chart + col-3 panel-легенда справа.
 *   Каждая серия в легенде кликабельна — фильтрует её показ на графике.
 * ──────────────────────────────────────────────────────────────────────────
 */

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { OrderDayPoint } from "./mockData2";

interface SeriesDef {
    key: keyof OrderDayPoint;
    label: string;
    color: string;
    desc: string;
}

const SERIES: SeriesDef[] = [
    { key: "inRecruiting", label: "В наборе", color: "#F4B942", desc: "ещё ищем исполнителей" },
    { key: "inWork", label: "В работе", color: "#118DFF", desc: "исполнители на объекте" },
    { key: "inApproval", label: "В согласовании", color: "#2FACAD", desc: "ждём подтверждения заказчика" },
    { key: "inPayment", label: "В оплате", color: "#3AA76D", desc: "ждём перечисления денег" },
    { key: "archived", label: "В архиве", color: "#12239E", desc: "выполнено и оплачено" },
    { key: "cancelled", label: "Отменённые", color: "#D64550", desc: "отменено заказчиком/системой" },
];

interface Props {
    data: OrderDayPoint[];
}

export function OrdersByStatusChart({ data }: Props) {
    const [hidden, setHidden] = useState<Set<string>>(new Set());

    const totals = useMemo(() => {
        const m: Record<string, number> = {};
        for (const s of SERIES) m[s.key] = 0;
        for (const d of data) {
            for (const s of SERIES) m[s.key] += Number(d[s.key]) || 0;
        }
        return m;
    }, [data]);

    const grandTotal = useMemo(
        () => Object.values(totals).reduce((a, b) => a + b, 0),
        [totals],
    );

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

    const toggle = (key: string) => {
        setHidden((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    return (
        <div className="border border-border rounded-sm bg-card p-4">
            <div className="mb-3">
                <h2 className="text-sm font-semibold">Заказы по дням и статусам</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Стек по 6 статусам · Y — количество заказов · клик на легенду справа скрывает/показывает серию
                </p>
            </div>

            <div className="grid grid-cols-12 gap-4">
                {/* График */}
                <div className="col-span-12 lg:col-span-9 h-[440px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 24 }}>
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
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip
                                labelFormatter={tooltipLabelFormatter}
                                contentStyle={{
                                    backgroundColor: "var(--card)",
                                    borderColor: "var(--border)",
                                    fontSize: 12,
                                }}
                            />
                            <Legend wrapperStyle={{ display: "none" }} />
                            {SERIES.map((s) => (
                                <Bar
                                    key={s.key}
                                    dataKey={s.key}
                                    name={s.label}
                                    stackId="orders"
                                    fill={s.color}
                                    hide={hidden.has(s.key)}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Легенда / описания справа */}
                <aside className="col-span-12 lg:col-span-3 flex flex-col gap-2 text-xs">
                    <div className="flex items-baseline justify-between border-b pb-2 mb-1">
                        <span className="font-semibold">Всего за период</span>
                        <span className="text-base font-semibold">
                            {grandTotal.toLocaleString("ru-RU")}
                        </span>
                    </div>
                    {SERIES.map((s) => {
                        const isHidden = hidden.has(s.key);
                        return (
                            <button
                                key={s.key}
                                type="button"
                                onClick={() => toggle(s.key)}
                                className={`text-left rounded-sm border px-2 py-1.5 transition-colors ${
                                    isHidden
                                        ? "border-border bg-muted/30 opacity-50"
                                        : "border-border bg-card hover:bg-muted/40"
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="inline-flex items-center gap-2 font-medium">
                                        <span
                                            className="w-3 h-3 rounded-sm shrink-0"
                                            style={{ backgroundColor: s.color }}
                                        />
                                        {s.label}
                                    </span>
                                    <span className="text-muted-foreground tabular-nums">
                                        {totals[s.key].toLocaleString("ru-RU")}
                                    </span>
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                    {s.desc}
                                </div>
                            </button>
                        );
                    })}
                </aside>
            </div>
        </div>
    );
}
