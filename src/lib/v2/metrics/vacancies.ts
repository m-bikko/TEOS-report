import { Store } from "../store";
import { V2Filters } from "../types";
import { filterVacancies, filterShiftUsers } from "../joins";

export interface VacancyKPIs {
    total: number;
    filled: number;
    neededTotal: number;
    fillPct: number;
    avgCostOneHour: number;
    avgRatePerMinute: number;
    avgTotalCost: number;
}

export interface VacancyRow {
    id: number;
    title: string;
    partnerTitle: string | null;
    tariffTitle: string | null;
    startDate: string | null;
    employees: number;
    totalEmployees: number;
    fillPct: number;
    costOneHour: number;
    costFull: number;
}

export interface ProfessionRow {
    professionId: number;
    vacanciesCount: number;
    totalEmployees: number;
    filled: number;
    fillPct: number;
    avgRate: number;
}

export interface AgeBucket {
    label: string;
    count: number;
}

export interface TariffComparisonRow {
    tariffId: number;
    title: string;
    rateForUser: number;
    rateForCompany: number;
    delta: number;
    deltaPct: number;
    vacanciesCount: number;
}

export interface VacanciesResponse {
    kpis: VacancyKPIs;
    lowestFill: VacancyRow[];
    highestCost: VacancyRow[];
    professions: ProfessionRow[];
    ageBuckets: AgeBucket[];
    tariffs: TariffComparisonRow[];
}

function ageBucket(min: number | null, max: number | null): string {
    if (min == null && max == null) return "Не указан";
    const lo = min ?? 0;
    const hi = max ?? 99;
    if (hi <= 25) return "до 25";
    if (hi <= 35) return "26–35";
    if (hi <= 45) return "36–45";
    if (hi <= 60) return "46–60";
    if (lo >= 60) return "60+";
    return "Смешанный";
}

export function computeVacancies(store: Store, filters: V2Filters): VacanciesResponse {
    const vacancies = filterVacancies(store, filters);

    const vacancyIds = new Set(vacancies.map((v) => v.id));

    const filledPerVacancy = new Map<number, number>();
    const assignments = filterShiftUsers(store, filters);
    for (const a of assignments) {
        if (a.vacancy && vacancyIds.has(a.vacancy.id) && a.shiftUser.completion_status === "success") {
            filledPerVacancy.set(a.vacancy.id, (filledPerVacancy.get(a.vacancy.id) ?? 0) + 1);
        }
    }

    let filled = 0;
    let needed = 0;
    let sumHour = 0;
    let sumMinute = 0;
    let sumTotal = 0;

    const byProfession = new Map<number, { vacancies: number; needed: number; filled: number; rateSum: number; rateCount: number }>();
    const ageMap = new Map<string, number>();
    const byTariff = new Map<number, number>();

    for (const v of vacancies) {
        const vFilled = filledPerVacancy.get(v.id) ?? 0;
        filled += vFilled;
        needed += v.total_employees_count;
        sumHour += v.cost_one_hour;
        sumMinute += v.rate_per_minute;
        sumTotal += v.total_cost;

        if (v.profession_id != null) {
            let pBucket = byProfession.get(v.profession_id);
            if (!pBucket) {
                pBucket = { vacancies: 0, needed: 0, filled: 0, rateSum: 0, rateCount: 0 };
                byProfession.set(v.profession_id, pBucket);
            }
            pBucket.vacancies += 1;
            pBucket.needed += v.total_employees_count;
            pBucket.filled += vFilled;
            if (v.cost_one_hour > 0) {
                pBucket.rateSum += v.cost_one_hour;
                pBucket.rateCount += 1;
            }
        }

        const ab = ageBucket(v.min_age, v.max_age);
        ageMap.set(ab, (ageMap.get(ab) ?? 0) + 1);

        if (v.tariff_id != null) byTariff.set(v.tariff_id, (byTariff.get(v.tariff_id) ?? 0) + 1);
    }

    const total = vacancies.length;
    const kpis: VacancyKPIs = {
        total,
        filled,
        neededTotal: needed,
        fillPct: needed > 0 ? (filled / needed) * 100 : 0,
        avgCostOneHour: total > 0 ? sumHour / total : 0,
        avgRatePerMinute: total > 0 ? sumMinute / total : 0,
        avgTotalCost: total > 0 ? sumTotal / total : 0,
    };

    const toRow = (v: (typeof vacancies)[number]): VacancyRow => {
        const vFilled = filledPerVacancy.get(v.id) ?? 0;
        const tariff = v.tariff_id != null ? store.tariffsById.get(v.tariff_id) : undefined;
        const partnerIdCandidate = v.partner_id ?? tariff?.partner_id ?? null;
        const partner = partnerIdCandidate != null ? store.partnersById.get(partnerIdCandidate) : undefined;
        return {
            id: v.id,
            title: v.title,
            partnerTitle: partner ? (partner.short_title ?? partner.title) : null,
            tariffTitle: tariff?.title ?? null,
            startDate: v.start_date,
            employees: vFilled,
            totalEmployees: v.total_employees_count,
            fillPct: v.total_employees_count > 0 ? (vFilled / v.total_employees_count) * 100 : 0,
            costOneHour: v.cost_one_hour,
            costFull: v.cost_full,
        };
    };

    const withNeeded = vacancies.filter((v) => v.total_employees_count > 0);

    const lowestFill = [...withNeeded]
        .sort((a, b) => {
            const fa = (filledPerVacancy.get(a.id) ?? 0) / a.total_employees_count;
            const fb = (filledPerVacancy.get(b.id) ?? 0) / b.total_employees_count;
            return fa - fb;
        })
        .slice(0, 20)
        .map(toRow);

    const highestCost = [...vacancies]
        .sort((a, b) => b.cost_full - a.cost_full)
        .slice(0, 20)
        .map(toRow);

    const professions: ProfessionRow[] = Array.from(byProfession.entries())
        .map(([professionId, b]) => ({
            professionId,
            vacanciesCount: b.vacancies,
            totalEmployees: b.needed,
            filled: b.filled,
            fillPct: b.needed > 0 ? (b.filled / b.needed) * 100 : 0,
            avgRate: b.rateCount > 0 ? b.rateSum / b.rateCount : 0,
        }))
        .sort((a, b) => b.vacanciesCount - a.vacanciesCount)
        .slice(0, 10);

    const ageOrder = ["до 25", "26–35", "36–45", "46–60", "60+", "Смешанный", "Не указан"];
    const ageBuckets: AgeBucket[] = ageOrder
        .filter((l) => ageMap.has(l))
        .map((label) => ({ label, count: ageMap.get(label) ?? 0 }));

    const tariffs: TariffComparisonRow[] = Array.from(byTariff.entries())
        .map(([tariffId, vacanciesCount]) => {
            const t = store.tariffsById.get(tariffId);
            const rateForUser = t?.rate_for_user ?? 0;
            const rateForCompany = t?.rate_for_company ?? 0;
            const delta = rateForCompany - rateForUser;
            return {
                tariffId,
                title: t?.title ?? `Тариф ${tariffId}`,
                rateForUser,
                rateForCompany,
                delta,
                deltaPct: rateForCompany > 0 ? (delta / rateForCompany) * 100 : 0,
                vacanciesCount,
            };
        })
        .sort((a, b) => b.vacanciesCount - a.vacanciesCount)
        .slice(0, 15);

    return { kpis, lowestFill, highestCost, professions, ageBuckets, tariffs };
}
