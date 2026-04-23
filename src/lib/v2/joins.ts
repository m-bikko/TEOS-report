import { Store } from "./store";
import {
    V2Filters,
    Shift,
    ShiftUser,
    Vacancy,
    Partner,
    Company,
    City,
    Tariff,
    Branch,
    BalanceLogEntry,
} from "./types";

export interface ResolvedShift {
    shift: Shift;
    vacancy: Vacancy | null;
    tariff: Tariff | null;
    partner: Partner | null;
    branch: Branch | null;
    company: Company | null;
    city: City | null;
}

export function resolveShift(store: Store, shift: Shift): ResolvedShift {
    const vacancy = store.vacanciesById.get(shift.vacancy_id) ?? null;
    const tariff = vacancy?.tariff_id != null ? (store.tariffsById.get(vacancy.tariff_id) ?? null) : null;
    const branch = vacancy?.branch_id != null ? (store.branchesById.get(vacancy.branch_id) ?? null) : null;
    const company = branch?.company_id != null ? (store.companiesById.get(branch.company_id) ?? null) : null;

    const partnerId =
        vacancy?.partner_id ??
        tariff?.partner_id ??
        company?.partner_id ??
        null;
    const partner = partnerId != null ? (store.partnersById.get(partnerId) ?? null) : null;

    const city =
        company?.city_id != null
            ? (store.citiesById.get(company.city_id) ?? null)
            : branch?.city_id != null
                ? (store.citiesById.get(branch.city_id) ?? null)
                : partner?.city_id != null
                    ? (store.citiesById.get(partner.city_id) ?? null)
                    : null;
    return { shift, vacancy, tariff, partner, branch, company, city };
}

export function resolveShiftUser(store: Store, su: ShiftUser): ResolvedShift & { shiftUser: ShiftUser } {
    const shift = store.shiftsById.get(su.shift_id);
    if (!shift) {
        return {
            shiftUser: su,
            shift: {
                id: 0,
                vacancy_id: 0,
                status: 0,
                date: "",
                total_employee_count: 0,
                start_time: null,
                end_time: null,
                luvr: null,
                notify_send_time: null,
            },
            vacancy: null,
            tariff: null,
            partner: null,
            branch: null,
            company: null,
            city: null,
        };
    }
    return { shiftUser: su, ...resolveShift(store, shift) };
}

function inDateRange(date: string | null, from: string | null, to: string | null): boolean {
    if (!date) return false;
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
}

function matchDimensions(r: ResolvedShift, f: V2Filters): boolean {
    if (f.partnerId != null && r.partner?.id !== f.partnerId) return false;
    if (f.cityId != null && r.city?.id !== f.cityId) return false;
    if (f.companyId != null && r.company?.id !== f.companyId) return false;
    if (f.branchId != null && r.branch?.id !== f.branchId) return false;
    if (f.tariffId != null && r.tariff?.id !== f.tariffId) return false;
    if (f.professionId != null && r.vacancy?.profession_id !== f.professionId) return false;
    if (f.shiftStatuses.length > 0 && !f.shiftStatuses.includes(r.shift.status)) return false;
    return true;
}

export function filterShifts(store: Store, f: V2Filters): ResolvedShift[] {
    const out: ResolvedShift[] = [];
    for (const s of store.shifts) {
        if (!inDateRange(s.date, f.dateFrom, f.dateTo)) continue;
        const resolved = resolveShift(store, s);
        if (!matchDimensions(resolved, f)) continue;
        out.push(resolved);
    }
    return out;
}

export function filterShiftUsers(store: Store, f: V2Filters): (ResolvedShift & { shiftUser: ShiftUser })[] {
    const out: (ResolvedShift & { shiftUser: ShiftUser })[] = [];
    for (const su of store.shiftUsers) {
        const shift = store.shiftsById.get(su.shift_id);
        if (!shift) continue;
        if (!inDateRange(shift.date, f.dateFrom, f.dateTo)) continue;
        const resolved = resolveShift(store, shift);
        if (!matchDimensions(resolved, f)) continue;
        out.push({ shiftUser: su, ...resolved });
    }
    return out;
}

export function resolvePartnerForVacancy(store: Store, vacancy: Vacancy): Partner | null {
    if (vacancy.partner_id != null) {
        const p = store.partnersById.get(vacancy.partner_id);
        if (p) return p;
    }
    if (vacancy.tariff_id != null) {
        const t = store.tariffsById.get(vacancy.tariff_id);
        if (t?.partner_id != null) {
            const p = store.partnersById.get(t.partner_id);
            if (p) return p;
        }
    }
    if (vacancy.branch_id != null) {
        const br = store.branchesById.get(vacancy.branch_id);
        if (br?.company_id != null) {
            const co = store.companiesById.get(br.company_id);
            if (co?.partner_id != null) {
                const p = store.partnersById.get(co.partner_id);
                if (p) return p;
            }
        }
    }
    return null;
}

export function filterVacancies(store: Store, f: V2Filters): Vacancy[] {
    return store.vacancies.filter((v) => {
        if (v.start_date) {
            if (f.dateFrom && v.start_date < f.dateFrom) return false;
            if (f.dateTo && v.start_date > f.dateTo) return false;
        }
        if (f.partnerId != null) {
            const resolved = resolvePartnerForVacancy(store, v);
            if (resolved?.id !== f.partnerId) return false;
        }
        if (f.tariffId != null && v.tariff_id !== f.tariffId) return false;
        if (f.professionId != null && v.profession_id !== f.professionId) return false;
        if (f.branchId != null && v.branch_id !== f.branchId) return false;
        if (f.cityId != null || f.companyId != null) {
            if (v.branch_id == null) return false;
            const branch = store.branchesById.get(v.branch_id);
            if (!branch) return false;
            if (f.cityId != null && branch.city_id !== f.cityId) return false;
            if (f.companyId != null && branch.company_id !== f.companyId) return false;
        }
        return true;
    });
}

export function filterBalanceLog(
    store: Store,
    f: V2Filters,
): BalanceLogEntry[] {
    if (f.partnerId == null && f.cityId == null && f.companyId == null && f.branchId == null && f.tariffId == null && f.professionId == null && f.shiftStatuses.length === 0) {
        if (!f.dateFrom && !f.dateTo) return store.balanceLog;
        return store.balanceLog.filter((b) =>
            inDateRange(b.created_at ? b.created_at.slice(0, 10) : null, f.dateFrom, f.dateTo),
        );
    }
    const shiftFilter = new Set(filterShifts(store, f).map((r) => r.shift.id));
    return store.balanceLog.filter((b) => {
        if (!inDateRange(b.created_at ? b.created_at.slice(0, 10) : null, f.dateFrom, f.dateTo)) return false;
        if (b.shift_id == null) return false;
        return shiftFilter.has(b.shift_id);
    });
}

export function parseFilters(url: URL): V2Filters {
    const p = url.searchParams;
    const num = (k: string): number | null => {
        const v = p.get(k);
        if (!v) return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    };
    const statusRaw = p.get("status");
    const shiftStatuses = statusRaw
        ? statusRaw
            .split(",")
            .map((s) => Number(s.trim()))
            .filter((n) => Number.isFinite(n) && n >= 1 && n <= 6)
        : [];

    return {
        dateFrom: p.get("from"),
        dateTo: p.get("to"),
        partnerId: num("partner"),
        cityId: num("city"),
        companyId: num("company"),
        branchId: num("branch"),
        tariffId: num("tariff"),
        professionId: num("profession"),
        shiftStatuses,
    };
}
