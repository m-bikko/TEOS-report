"use client";

/**
 * ──────────────────────────────────────────────────────────────────────────
 * График «Записи на заказ» (Chart 2 на /demo-2).
 *
 * НА ЧЁМ:
 *   - recharts 3.x — ComposedChart (стек-бары + линия)
 *   - date-fns 4.x + ru — подписи дат
 *   - tailwindcss 4 — раскладка
 *
 * ФОРМАТ ДАННЫХ:
 *   data: IntakeDayPoint[]  где IntakeDayPoint = {
 *       date: "YYYY-MM-DD",
 *       organicIntake: number,   // записались сами
 *       operatorIntake: number,  // записали операторы
 *       signedAvr: number,       // подписанные АВР за день
 *   }
 *
 * ВИЗУАЛ:
 *   - Бары organicIntake + operatorIntake СТЕКАЮТСЯ (общая интейка дня).
 *   - signedAvr — отдельная ЛИНИЯ поверх (НЕ стек, НЕ накладывается на бар).
 *   - Все 3 серии на ОДНОЙ оси Y — пропорции честные.
 * ──────────────────────────────────────────────────────────────────────────
 */

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import {
    Bar,
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { IntakeDayPoint } from "./mockData2";

type Kind = "bar" | "line";

interface SeriesDef {
    key: keyof IntakeDayPoint;
    label: string;
    color: string;
    kind: Kind;
    desc: string;
}

const SERIES: SeriesDef[] = [
    {
        key: "organicIntake",
        label: "Organic intake",
        color: "#3AA76D",
        kind: "bar",
        desc: "исполнители записались сами через приложение",
    },
    {
        key: "operatorIntake",
        label: "Operator intake",
        color: "#E66C37",
        kind: "bar",
        desc: "операторы записали исполнителей вручную",
    },
    {
        key: "signedAvr",
        label: "Подписано АВР",
        color: "#12239E",
        kind: "line",
        desc: "отдельная линия поверх, показывает покрытие подписями",
    },
];

interface Props {
    data: IntakeDayPoint[];
}

export function IntakeChart({ data }: Props) {
    const [hidden, setHidden] = useState<Set<string>>(new Set());

    const totals = useMemo(() => {
        const m: Record<string, number> = {};
        for (const s of SERIES) m[s.key] = 0;
        for (const d of data) {
            for (const s of SERIES) m[s.key] += Number(d[s.key]) || 0;
        }
        return m;
    }, [data]);

    const intakeTotal = useMemo(
        () => totals.organicIntake + totals.operatorIntake,
        [totals],
    );

    const organicPct = intakeTotal > 0 ? (totals.organicIntake / intakeTotal) * 100 : 0;
    const avrCoveragePct = intakeTotal > 0 ? (totals.signedAvr / intakeTotal) * 100 : 0;

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
                <h2 className="text-sm font-semibold">Записи на заказ</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Стек: organic + operator (общая интейка) · линия: подписанные АВР как
                    сопроводительный показатель (не накладывается на бар)
                </p>
            </div>

            <div className="grid grid-cols-12 gap-4">
                {/* График */}
                <div className="col-span-12 lg:col-span-9 h-[440px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 24 }}>
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
                            {SERIES.filter((s) => s.kind === "bar").map((s) => (
                                <Bar
                                    key={s.key}
                                    dataKey={s.key}
                                    name={s.label}
                                    stackId="intake"
                                    fill={s.color}
                                    hide={hidden.has(s.key)}
                                />
                            ))}
                            {SERIES.filter((s) => s.kind === "line").map((s) => (
                                <Line
                                    key={s.key}
                                    type="monotone"
                                    dataKey={s.key}
                                    name={s.label}
                                    stroke={s.color}
                                    strokeWidth={2}
                                    dot={{ r: 2, fill: s.color }}
                                    hide={hidden.has(s.key)}
                                />
                            ))}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                {/* Легенда / описания справа */}
                <aside className="col-span-12 lg:col-span-3 flex flex-col gap-2 text-xs">
                    <div className="flex items-baseline justify-between border-b pb-2 mb-1">
                        <span className="font-semibold">Всего интейк</span>
                        <span className="text-base font-semibold">
                            {intakeTotal.toLocaleString("ru-RU")}
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
                                        {s.kind === "bar" ? (
                                            <span
                                                className="w-3 h-3 rounded-sm shrink-0"
                                                style={{ backgroundColor: s.color }}
                                            />
                                        ) : (
                                            <span
                                                className="w-3 h-0.5 shrink-0"
                                                style={{ backgroundColor: s.color }}
                                            />
                                        )}
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

                    <div className="border-t pt-2 mt-1 space-y-1 text-[11px] text-muted-foreground">
                        <div className="flex justify-between">
                            <span>Доля organic</span>
                            <span className="text-foreground font-medium tabular-nums">
                                {organicPct.toFixed(1)}%
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Покрытие АВР</span>
                            <span className="text-foreground font-medium tabular-nums">
                                {avrCoveragePct.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
