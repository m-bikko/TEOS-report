import { format, parseISO, startOfWeek } from "date-fns";
import { ru } from "date-fns/locale";

export type Period = "day" | "week" | "month" | "year";

export const PERIOD_LABELS: Record<Period, string> = {
    day: "Дни",
    week: "Недели",
    month: "Месяцы",
    year: "Годы",
};

export function periodKey(date: string, period: Period): string {
    if (!date) return date;
    if (period === "day") return date;
    if (period === "year") return date.slice(0, 4);
    if (period === "month") return date.slice(0, 7);
    const parsed = parseISO(date);
    if (Number.isNaN(parsed.getTime())) return date;
    const weekStart = startOfWeek(parsed, { weekStartsOn: 1 });
    return format(weekStart, "yyyy-MM-dd");
}

export function formatPeriodLabel(key: string, period: Period): string {
    if (!key) return key;
    try {
        if (period === "year") return key;
        if (period === "month") {
            const d = parseISO(`${key}-01`);
            return format(d, "LLL yyyy", { locale: ru });
        }
        const d = parseISO(key);
        if (period === "week") return `${format(d, "dd MMM", { locale: ru })}`;
        return format(d, "dd.MM", { locale: ru });
    } catch {
        return key;
    }
}

interface Keyed {
    date: string;
}

export function aggregateByPeriod<T extends Keyed>(
    rows: T[],
    period: Period,
    merge: (acc: T, next: T) => T,
    init: (first: T) => T,
): T[] {
    if (period === "day") return rows;
    const map = new Map<string, T>();
    for (const r of rows) {
        const key = periodKey(r.date, period);
        const existing = map.get(key);
        if (!existing) {
            map.set(key, { ...init(r), date: key });
        } else {
            map.set(key, { ...merge(existing, r), date: key });
        }
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}
