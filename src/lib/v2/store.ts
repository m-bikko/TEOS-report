import { readCsv, parsers } from "./csv";
import {
    City,
    Partner,
    Company,
    Tariff,
    Vacancy,
    Shift,
    ShiftUser,
    BalanceLogEntry,
    Branch,
} from "./types";

const { toNum, toNumOrNull, toStr, toStrRequired, toBool } = parsers;

export interface Store {
    cities: City[];
    partners: Partner[];
    companies: Company[];
    tariffs: Tariff[];
    vacancies: Vacancy[];
    shifts: Shift[];
    shiftUsers: ShiftUser[];
    balanceLog: BalanceLogEntry[];
    branches: Branch[];

    citiesById: Map<number, City>;
    partnersById: Map<number, Partner>;
    companiesById: Map<number, Company>;
    tariffsById: Map<number, Tariff>;
    vacanciesById: Map<number, Vacancy>;
    shiftsById: Map<number, Shift>;
    branchesById: Map<number, Branch>;
}

async function loadCities(): Promise<City[]> {
    return readCsv<City>("cities.csv", (r) => {
        const id = toNumOrNull(r["id"]);
        if (id === null) return null;
        return {
            id,
            title: toStrRequired(r["title"]),
            longitude: toNumOrNull(r["longitude"]),
            latitude: toNumOrNull(r["latitude"]),
            country_id: toNumOrNull(r["country_id"]),
        };
    });
}

async function loadPartners(): Promise<Partner[]> {
    return readCsv<Partner>("partners.csv", (r) => {
        const id = toNumOrNull(r["id"]);
        if (id === null) return null;
        return {
            id,
            title: toStrRequired(r["title"]),
            short_title: toStr(r["short_title"]),
            bin: toStr(r["bin"]),
            commission_rate: toNumOrNull(r["commission_rate"]),
            nds_rate: toNumOrNull(r["nds_rate"]),
            city_id: toNumOrNull(r["city_id"]),
            manager_id: toNumOrNull(r["manager_id"]),
            parent_id: toNumOrNull(r["parent_id"]),
            balance_id: toNumOrNull(r["balance_id"]),
        };
    });
}

async function loadCompanies(): Promise<Company[]> {
    return readCsv<Company>("companies.csv", (r) => {
        const id = toNumOrNull(r["id"]);
        if (id === null) return null;
        return {
            id,
            title: toStrRequired(r["title"]),
            bin: toStr(r["bin"]),
            city_id: toNumOrNull(r["city_id"]),
            partner_id: toNumOrNull(r["partner_id"]),
            balance: toNum(r["balance"]),
            enabled: toBool(r["enabled"]),
            director: toStr(r["director"]),
            address: toStr(r["address"]),
            phone: toStr(r["phone"]),
            email: toStr(r["email"]),
            nds: toNumOrNull(r["nds"]),
            commission: toNumOrNull(r["commission"]),
            rating: toNumOrNull(r["rating"]),
            is_blocked: toBool(r["is_blocked"]),
            work_scheme_id: toNumOrNull(r["work_scheme_id"]),
            responsible_manager_id: toNumOrNull(r["responsible_manager_id"]),
        };
    });
}

async function loadTariffs(): Promise<Tariff[]> {
    return readCsv<Tariff>("tariffs.csv", (r) => {
        const id = toNumOrNull(r["id"]);
        if (id === null) return null;
        return {
            id,
            title: toStrRequired(r["title"]),
            type: toNumOrNull(r["type"]),
            branch_id: toNumOrNull(r["branch_id"]),
            rate_for_user: toNum(r["rate_for_user"]),
            rate_for_company: toNum(r["rate_for_company"]),
            unit_id: toNumOrNull(r["unit_id"]),
            partner_id: toNumOrNull(r["partner_id"]),
        };
    });
}

const MAX_SANE_EMPLOYEE_COUNT = 10000;
const MAX_SANE_COST = 1_000_000_000;

async function loadVacancies(): Promise<Vacancy[]> {
    return readCsv<Vacancy>("vacancies.csv", (r) => {
        const id = toNumOrNull(r["id"]);
        if (id === null) return null;
        const rawTotalEmployees = toNum(r["total_employees_count"]);
        const totalEmployees = rawTotalEmployees > MAX_SANE_EMPLOYEE_COUNT ? 0 : rawTotalEmployees;
        const rawTotalCost = toNum(r["total_cost"]);
        const totalCost = rawTotalCost > MAX_SANE_COST ? 0 : rawTotalCost;
        return {
            id,
            title: toStrRequired(r["title"]),
            description: toStr(r["description"]),
            start_date: toStr(r["start_date"]),
            end_date: toStr(r["end_date"]),
            start_time: toStr(r["start_time"]),
            end_time: toStr(r["end_time"]),
            tariff_id: toNumOrNull(r["tariff_id"]),
            branch_id: toNumOrNull(r["branch_id"]),
            partner_id: toNumOrNull(r["partner_id"]),
            profession_id: toNumOrNull(r["profession_id"]),
            schedule_type: toNumOrNull(r["schedule_type"]),
            status: toNumOrNull(r["status"]),
            type: toNumOrNull(r["type"]),
            total_employees_count: totalEmployees,
            employees_count: toNum(r["employees_count"]),
            enabled: toBool(r["enabled"]),
            total_cost: totalCost,
            cost_one_hour: toNum(r["cost_one_hour"]),
            cost_full: toNum(r["cost_full"]),
            rate_per_minute: toNum(r["rate_per_minute"]),
            nds: toNumOrNull(r["nds"]),
            shift_count: toNumOrNull(r["shift_count"]),
            count_of_work_day: toNumOrNull(r["count_of_work_day"]),
            min_age: toNumOrNull(r["min_age"]),
            max_age: toNumOrNull(r["max_age"]),
            gender_id: toNumOrNull(r["gender_id"]),
            citizenship_id: toNumOrNull(r["citizenship_id"]),
            responsible_id: toNumOrNull(r["responsible_id"]),
            total_cost_user: toNum(r["total_cost_user"]),
            deleted_at: toStr(r["deleted_at"]),
        };
    });
}

async function loadShifts(): Promise<Shift[]> {
    return readCsv<Shift>("shifts.csv", (r) => {
        const id = toNumOrNull(r["id"]);
        const vacancy_id = toNumOrNull(r["vacancy_id"]);
        const date = toStr(r["date"]);
        if (id === null || vacancy_id === null || date === null) return null;
        const statusVal = toNumOrNull(r["status"]);
        return {
            id,
            vacancy_id,
            status: statusVal ?? 0,
            date,
            total_employee_count: toNum(r["total_employee_count"]),
            start_time: toStr(r["start_time"]),
            end_time: toStr(r["end_time"]),
            luvr: toStr(r["luvr"]),
            notify_send_time: toStr(r["notify_send_time"]),
        };
    });
}

async function loadShiftUsers(): Promise<ShiftUser[]> {
    return readCsv<ShiftUser>("shift_users.csv", (r) => {
        const id = toNumOrNull(r["id"]);
        const shift_id = toNumOrNull(r["shift_id"]);
        const user_id = toNumOrNull(r["user_id"]);
        if (id === null || shift_id === null || user_id === null) return null;
        return {
            id,
            shift_id,
            user_id,
            status: toNumOrNull(r["status"]),
            foreman: toNumOrNull(r["foreman"]),
            production: toNum(r["production"]),
            previous_production: toNum(r["previous_production"]),
            wallet_id: toNumOrNull(r["wallet_id"]),
            payment_status: toStr(r["payment_status"]),
            payment_comment: toStr(r["payment_comment"]),
            pay_amount: toNum(r["pay_amount"]),
            avr: toStr(r["avr"]),
            avr_user_sign: toStr(r["avr_user_sign"]),
            avr_partner_sign: toStr(r["avr_partner_sign"]),
            avr_cms: toStr(r["avr_cms"]),
            completion_status: toStr(r["completion_status"]),
            avr_date: toStr(r["avr_date"]),
            created_at: toStr(r["created_at"]),
            updated_at: toStr(r["updated_at"]),
        };
    });
}

async function loadBalanceLog(): Promise<BalanceLogEntry[]> {
    return readCsv<BalanceLogEntry>("user_balance_log.csv", (r) => {
        const id = toNumOrNull(r["id"]);
        const user_id = toNumOrNull(r["user_id"]);
        const typeVal = toNumOrNull(r["type"]);
        if (id === null || user_id === null || typeVal === null) return null;
        return {
            id,
            user_id,
            previous_balance: toNum(r["previous_balance"]),
            current_balance: toNum(r["current_balance"]),
            change_amount: toNum(r["change_amount"]),
            comment: toStr(r["comment"]),
            type: typeVal,
            wallet_id: toNumOrNull(r["wallet_id"]),
            shift_id: toNumOrNull(r["shift_id"]),
            fine_id: toNumOrNull(r["fine_id"]),
            issuer_id: toNumOrNull(r["issuer_id"]),
            requisite: toStr(r["requisite"]),
            created_at: toStr(r["created_at"]),
            updated_at: toStr(r["updated_at"]),
        };
    });
}

async function loadBranches(): Promise<Branch[]> {
    return readCsv<Branch>("branches.csv", (r) => {
        const id = toNumOrNull(r["id"]);
        if (id === null) return null;
        return {
            id,
            title: toStr(r["title"]),
            short_title: toStr(r["short_title"]),
            company_id: toNumOrNull(r["company_id"]),
            city_id: toNumOrNull(r["city_id"]),
            address: toStr(r["address"]),
            phone: toStr(r["phone"]),
            longitude: toNumOrNull(r["longitude"]),
            latitude: toNumOrNull(r["latitude"]),
            enabled: toBool(r["enabled"]),
        };
    });
}

function indexById<T extends { id: number }>(rows: T[]): Map<number, T> {
    const m = new Map<number, T>();
    for (const r of rows) m.set(r.id, r);
    return m;
}

export async function getStore(): Promise<Store> {
    const [
        cities,
        partners,
        companies,
        tariffs,
        vacancies,
        shifts,
        shiftUsers,
        balanceLog,
        branches,
    ] = await Promise.all([
        loadCities(),
        loadPartners(),
        loadCompanies(),
        loadTariffs(),
        loadVacancies(),
        loadShifts(),
        loadShiftUsers(),
        loadBalanceLog(),
        loadBranches(),
    ]);

    return {
        cities,
        partners,
        companies,
        tariffs,
        vacancies,
        shifts,
        shiftUsers,
        balanceLog,
        branches,
        citiesById: indexById(cities),
        partnersById: indexById(partners),
        companiesById: indexById(companies),
        tariffsById: indexById(tariffs),
        vacanciesById: indexById(vacancies),
        shiftsById: indexById(shifts),
        branchesById: indexById(branches),
    };
}
