"use client";

/**
 * ──────────────────────────────────────────────────────────────────────────
 * Графическая компонента воронки смен (демо, на мок-данных).
 *
 * НА ЧЁМ РАБОТАЕТ:
 *   - recharts 3.x — ResponsiveContainer + ComposedChart (bars + lines)
 *   - date-fns 4.x + ru — форматирование подписей дат (dd.MM)
 *   - tailwindcss 4 — раскладка/стили
 *
 * ФОРМАТ ВХОДНЫХ ДАННЫХ:
 *   data: FunnelDayPoint[]  где FunnelDayPoint = {
 *       date: "YYYY-MM-DD",
 *       taken: number,        // Взяли смену
 *       attended: number,     // Вышли на объект
 *       fines: number,        // Штраф (количество событий)
 *       cancelled: number,    // Отменил
 *   }
 *
 * Бэкенд должен возвращать JSON-массив таких точек, отсортированных по date ASC,
 * по одной записи на каждый день в выбранном диапазоне. Пропуски заполнять нулями
 * (или не отдавать — фронт всё равно отрисует столбик в 0).
 *
 *
 * ВИЗУАЛЬНАЯ ЛОГИКА:
 *   - Все 4 серии живут на ОДНОЙ оси Y, чтобы пропорции были честными.
 *     При штрафах ~100 и сменах ~1000 линии штрафов идут низко — это правда:
 *     штрафов реально мало относительно смен. На двух осях такая разница
 *     визуально терялась (линия штрафов "плыла" наверху как будто крупная серия).
 *   - taken/attended — сгруппированные бары
 *   - fines/cancelled — линии (поверх баров, чтобы не сливались с горизонтом)
 *
 * ЛЭЙАУТ:
 *   - grid col-9 chart + col-3 правая панель-легенда (одинаково с /demo-2).
 *   - Каждая серия в легенде кликабельна — toggle hide/show на графике.
 *   - Цвет: квадрат для баров, горизонтальная полоска для линий.
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
import { FunnelDayPoint } from "./mockData";

type Kind = "bar" | "line";

interface SeriesDef {
    key: keyof FunnelDayPoint;
    label: string;
    color: string;
    kind: Kind;
    desc: string;
}

const SERIES: SeriesDef[] = [
    {
        key: "taken",
        label: "Взяли смену",
        color: "#118DFF",
        kind: "bar",
        desc: "исполнители записались на смену в этот день",
    },
    {
        key: "attended",
        label: "Вышли на объект",
        color: "#2FACAD",
        kind: "bar",
        desc: "реально появились на объекте",
    },
    {
        key: "fines",
        label: "Штраф",
        color: "#D64550",
        kind: "line",
        desc: "штрафные события за день",
    },
    {
        key: "cancelled",
        label: "Отменили",
        color: "#E66C37",
        kind: "line",
        desc: "юзер снялся со смены",
    },
];

interface Props {
    data: FunnelDayPoint[];
}

export function FunnelMockChart({ data }: Props) {
    const [hidden, setHidden] = useState<Set<string>>(new Set());

    const totals = useMemo(() => {
        const m: Record<string, number> = {};
        for (const s of SERIES) m[s.key] = 0;
        for (const d of data) {
            for (const s of SERIES) m[s.key] += Number(d[s.key]) || 0;
        }
        return m;
    }, [data]);

    const showUpPct = totals.taken > 0 ? (totals.attended / totals.taken) * 100 : 0;

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
                <h2 className="text-sm font-semibold">Воронка смен</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Бары (взяли/вышли) + линии (штраф/отмена) · одна ось Y ·
                    клик на легенду справа скрывает/показывает серию
                </p>
            </div>

            <div className="grid grid-cols-12 gap-4">
                {/* График */}
                <div className="col-span-12 lg:col-span-9 h-[440px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={data}
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
                                    fill={s.color}
                                    radius={[2, 2, 0, 0]}
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
                        <span className="font-semibold">Явка за период</span>
                        <span className="text-base font-semibold">{showUpPct.toFixed(1)}%</span>
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
                </aside>
            </div>
        </div>
    );
}
