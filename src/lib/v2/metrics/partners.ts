import { Store } from "../store";
import { V2Filters } from "../types";
import { filterShiftUsers, filterVacancies, filterShifts, resolvePartnerForVacancy } from "../joins";

export interface PartnerRow {
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

export interface PartnerDailyPoint {
    date: string;
    byPartner: Record<number, number>;
    total: number;
}

export interface PartnersResponse {
    rows: PartnerRow[];
    daily: PartnerDailyPoint[];
    totalRevenue: number;
    totalPayouts: number;
    totalMargin: number;
}

export function computePartners(store: Store, filters: V2Filters): PartnersResponse {
    const vacancies = filterVacancies(store, filters);
    const shifts = filterShifts(store, filters);
    const assignments = filterShiftUsers(store, filters);

    const vacancyRevenueByPartner = new Map<number, number>();
    const vacancyCountByPartner = new Map<number, number>();
    for (const v of vacancies) {
        const partner = resolvePartnerForVacancy(store, v);
        if (!partner) continue;
        vacancyRevenueByPartner.set(partner.id, (vacancyRevenueByPartner.get(partner.id) ?? 0) + v.cost_full);
        vacancyCountByPartner.set(partner.id, (vacancyCountByPartner.get(partner.id) ?? 0) + 1);
    }

    const shiftCountByPartner = new Map<number, number>();
    for (const r of shifts) {
        if (r.partner?.id == null) continue;
        shiftCountByPartner.set(r.partner.id, (shiftCountByPartner.get(r.partner.id) ?? 0) + 1);
    }

    const payoutByPartner = new Map<number, number>();
    const dailyByPartner = new Map<string, Map<number, number>>();
    const shiftToPartner = new Map<number, number>();
    for (const r of shifts) {
        if (r.partner?.id != null) shiftToPartner.set(r.shift.id, r.partner.id);
    }
    for (const entry of store.balanceLog) {
        if (entry.type !== 1) continue;
        if (entry.shift_id == null) continue;
        const pid = shiftToPartner.get(entry.shift_id);
        if (pid == null) continue;
        const amt = Math.abs(entry.change_amount);
        payoutByPartner.set(pid, (payoutByPartner.get(pid) ?? 0) + amt);
        const day = (entry.created_at ?? "").slice(0, 10) || "—";
        let dayMap = dailyByPartner.get(day);
        if (!dayMap) {
            dayMap = new Map();
            dailyByPartner.set(day, dayMap);
        }
        dayMap.set(pid, (dayMap.get(pid) ?? 0) + amt);
    }
    void assignments;

    const companiesCountByPartner = new Map<number, number>();
    for (const c of store.companies) {
        if (c.partner_id == null) continue;
        companiesCountByPartner.set(c.partner_id, (companiesCountByPartner.get(c.partner_id) ?? 0) + 1);
    }

    const rows: PartnerRow[] = store.partners.map((p) => {
        const revenue = vacancyRevenueByPartner.get(p.id) ?? 0;
        const payouts = payoutByPartner.get(p.id) ?? 0;
        const margin = revenue - payouts;
        return {
            id: p.id,
            title: p.short_title ?? p.title,
            cityTitle: p.city_id != null ? (store.citiesById.get(p.city_id)?.title ?? null) : null,
            commissionRate: p.commission_rate,
            ndsRate: p.nds_rate,
            companiesCount: companiesCountByPartner.get(p.id) ?? 0,
            vacanciesCount: vacancyCountByPartner.get(p.id) ?? 0,
            shiftsCount: shiftCountByPartner.get(p.id) ?? 0,
            revenue,
            payouts,
            margin,
            marginPct: revenue > 0 ? (margin / revenue) * 100 : 0,
            parentId: p.parent_id,
        };
    });

    rows.sort((a, b) => b.revenue - a.revenue);

    const daily: PartnerDailyPoint[] = Array.from(dailyByPartner.entries())
        .map(([date, map]) => {
            const byPartner: Record<number, number> = {};
            let total = 0;
            for (const [pid, v] of map.entries()) {
                byPartner[pid] = v;
                total += v;
            }
            return { date, byPartner, total };
        })
        .sort((a, b) => a.date.localeCompare(b.date));

    let totalRevenue = 0;
    let totalPayouts = 0;
    for (const r of rows) {
        totalRevenue += r.revenue;
        totalPayouts += r.payouts;
    }

    return {
        rows,
        daily,
        totalRevenue,
        totalPayouts,
        totalMargin: totalRevenue - totalPayouts,
    };
}
