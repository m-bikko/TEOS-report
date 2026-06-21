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
 *   - Две левые серии (taken/attended) — близки по величине (~1000), рисуем
 *     сгруппированными бар-чартами на левой оси Y.
 *   - Две правые (fines/cancelled) — маленькие (десятки), рисуем линиями
 *     на отдельной правой оси Y, иначе на фоне бар-чартов они сольются в ноль.
 * ──────────────────────────────────────────────────────────────────────────
 */

import { useMemo } from "react";
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

const COLOR_TAKEN = "#118DFF";    // основной синий
const COLOR_ATTEND = "#2FACAD";   // бирюзовый
const COLOR_FINE = "#D64550";     // красный
const COLOR_CANCEL = "#E66C37";   // оранжевый

interface Props {
    data: FunnelDayPoint[];
}

export function FunnelMockChart({ data }: Props) {
    // Подсчёт KPI в одном проходе — для шапки над графиком
    const totals = useMemo(() => {
        let taken = 0,
            attended = 0,
            fines = 0,
            cancelled = 0;
        for (const d of data) {
            taken += d.taken;
            attended += d.attended;
            fines += d.fines;
            cancelled += d.cancelled;
        }
        const showUpPct = taken > 0 ? (attended / taken) * 100 : 0;
        return { taken, attended, fines, cancelled, showUpPct };
    }, [data]);

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

    return (
        <div className="border border-border rounded-sm bg-card p-4 space-y-4">
            {/* Верхняя «лента» KPI — totals по выбранному периоду */}
            <div className="grid grid-cols-4 gap-3">
                <KpiBlock label="Взяли смену" value={totals.taken} accent={COLOR_TAKEN} />
                <KpiBlock
                    label="Вышли на объект"
                    value={totals.attended}
                    accent={COLOR_ATTEND}
                    hint={`${totals.showUpPct.toFixed(1)}% явка`}
                />
                <KpiBlock label="Штрафы" value={totals.fines} accent={COLOR_FINE} />
                <KpiBlock label="Отменили" value={totals.cancelled} accent={COLOR_CANCEL} />
            </div>

            {/* Основной график */}
            <div className="h-[420px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={data}
                        margin={{ top: 10, right: 20, left: 0, bottom: 24 }}
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
                        {/* Левая ось — крупные значения (взяли/вышли) */}
                        <YAxis
                            yAxisId="left"
                            tick={{ fontSize: 11 }}
                            label={{
                                value: "Смены",
                                angle: -90,
                                position: "insideLeft",
                                style: { fontSize: 11, fill: "var(--muted-foreground)" },
                            }}
                        />
                        {/* Правая ось — мелкие значения (штрафы/отмены) */}
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fontSize: 11 }}
                            label={{
                                value: "Штрафы / Отмены",
                                angle: 90,
                                position: "insideRight",
                                style: { fontSize: 11, fill: "var(--muted-foreground)" },
                            }}
                        />
                        <Tooltip
                            labelFormatter={tooltipLabelFormatter}
                            contentStyle={{
                                backgroundColor: "var(--card)",
                                borderColor: "var(--border)",
                                fontSize: 12,
                            }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />

                        {/* Bars: сгруппированы (один barCategoryGap) */}
                        <Bar
                            yAxisId="left"
                            dataKey="taken"
                            name="Взяли смену"
                            fill={COLOR_TAKEN}
                            radius={[2, 2, 0, 0]}
                        />
                        <Bar
                            yAxisId="left"
                            dataKey="attended"
                            name="Вышли на объект"
                            fill={COLOR_ATTEND}
                            radius={[2, 2, 0, 0]}
                        />

                        {/* Lines: на отдельной (правой) оси, иначе при шкале 1000
                            штрафы и отмены сольются с нулём */}
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="fines"
                            name="Штраф"
                            stroke={COLOR_FINE}
                            strokeWidth={2}
                            dot={{ r: 2, fill: COLOR_FINE }}
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="cancelled"
                            name="Отменили"
                            stroke={COLOR_CANCEL}
                            strokeWidth={2}
                            dot={{ r: 2, fill: COLOR_CANCEL }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function KpiBlock({
    label,
    value,
    accent,
    hint,
}: {
    label: string;
    value: number;
    accent: string;
    hint?: string;
}) {
    return (
        <div className="border-l-2 pl-3 py-1" style={{ borderLeftColor: accent }}>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium leading-tight">
                {label}
            </div>
            <div className="text-2xl font-semibold leading-tight mt-0.5">
                {value.toLocaleString("ru-RU")}
            </div>
            {hint && (
                <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">{hint}</div>
            )}
        </div>
    );
}
