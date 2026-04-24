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

    const vacancyCountByPartner = new Map<number, number>();
    for (const v of vacancies) {
        const partner = resolvePartnerForVacancy(store, v);
        if (!partner) continue;
        vacancyCountByPartner.set(partner.id, (vacancyCountByPartner.get(partner.id) ?? 0) + 1);
    }

    const shiftCountByPartner = new Map<number, number>();
    const shiftIdToPartner = new Map<number, number>();
    for (const r of shifts) {
        if (r.partner?.id == null) continue;
        shiftCountByPartner.set(r.partner.id, (shiftCountByPartner.get(r.partner.id) ?? 0) + 1);
        shiftIdToPartner.set(r.shift.id, r.partner.id);
    }

    const revenueByPartner = new Map<number, number>();
    const revenueDailyByPartner = new Map<string, Map<number, number>>();

    for (const a of assignments) {
        const pid = a.partner?.id;
        if (pid == null) continue;
        const rate = a.tariff?.rate_for_company ?? 0;
        const revenue = rate * a.shiftUser.production;
        if (revenue === 0) continue;
        revenueByPartner.set(pid, (revenueByPartner.get(pid) ?? 0) + revenue);
        const date = a.shift.date;
        if (!date) continue;
        let dayMap = revenueDailyByPartner.get(date);
        if (!dayMap) {
            dayMap = new Map();
            revenueDailyByPartner.set(date, dayMap);
        }
        dayMap.set(pid, (dayMap.get(pid) ?? 0) + revenue);
    }

    const payoutByPartner = new Map<number, number>();
    for (const entry of store.balanceLog) {
        if (entry.type !== 1) continue;
        if (entry.shift_id == null) continue;
        const pid = shiftIdToPartner.get(entry.shift_id);
        if (pid == null) continue;
        payoutByPartner.set(pid, (payoutByPartner.get(pid) ?? 0) + Math.abs(entry.change_amount));
    }

    const companiesCountByPartner = new Map<number, number>();
    for (const c of store.companies) {
        if (c.partner_id == null) continue;
        companiesCountByPartner.set(c.partner_id, (companiesCountByPartner.get(c.partner_id) ?? 0) + 1);
    }

    const rows: PartnerRow[] = store.partners.map((p) => {
        const revenue = revenueByPartner.get(p.id) ?? 0;
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

    const daily: PartnerDailyPoint[] = Array.from(revenueDailyByPartner.entries())
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
