export interface City {
    id: number;
    title: string;
    longitude: number | null;
    latitude: number | null;
    country_id: number | null;
}

export interface Partner {
    id: number;
    title: string;
    short_title: string | null;
    bin: string | null;
    commission_rate: number | null;
    nds_rate: number | null;
    city_id: number | null;
    manager_id: number | null;
    parent_id: number | null;
    balance_id: number | null;
}

export interface Company {
    id: number;
    title: string;
    bin: string | null;
    city_id: number | null;
    partner_id: number | null;
    balance: number;
    enabled: boolean;
    director: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    nds: number | null;
    commission: number | null;
    rating: number | null;
    is_blocked: boolean;
    work_scheme_id: number | null;
    responsible_manager_id: number | null;
}

export interface Tariff {
    id: number;
    title: string;
    type: number | null;
    branch_id: number | null;
    rate_for_user: number;
    rate_for_company: number;
    unit_id: number | null;
    partner_id: number | null;
}

export interface Vacancy {
    id: number;
    title: string;
    description: string | null;
    start_date: string | null;
    end_date: string | null;
    start_time: string | null;
    end_time: string | null;
    tariff_id: number | null;
    branch_id: number | null;
    partner_id: number | null;
    profession_id: number | null;
    schedule_type: number | null;
    status: number | null;
    type: number | null;
    total_employees_count: number;
    employees_count: number;
    enabled: boolean;
    total_cost: number;
    cost_one_hour: number;
    cost_full: number;
    rate_per_minute: number;
    nds: number | null;
    shift_count: number | null;
    count_of_work_day: number | null;
    min_age: number | null;
    max_age: number | null;
    gender_id: number | null;
    citizenship_id: number | null;
    responsible_id: number | null;
    total_cost_user: number;
    deleted_at: string | null;
}

export interface Shift {
    id: number;
    vacancy_id: number;
    status: number;
    date: string;
    total_employee_count: number;
    start_time: string | null;
    end_time: string | null;
    luvr: string | null;
    notify_send_time: string | null;
}

export interface ShiftUser {
    id: number;
    shift_id: number;
    user_id: number;
    status: number | null;
    foreman: number | null;
    production: number;
    previous_production: number;
    wallet_id: number | null;
    payment_status: string | null;
    payment_comment: string | null;
    pay_amount: number;
    avr: string | null;
    avr_user_sign: string | null;
    avr_partner_sign: string | null;
    avr_cms: string | null;
    completion_status: string | null;
    avr_date: string | null;
    created_at: string | null;
    updated_at: string | null;
}

export interface BalanceLogEntry {
    id: number;
    user_id: number;
    previous_balance: number;
    current_balance: number;
    change_amount: number;
    comment: string | null;
    type: number;
    wallet_id: number | null;
    shift_id: number | null;
    fine_id: number | null;
    issuer_id: number | null;
    requisite: string | null;
    created_at: string | null;
    updated_at: string | null;
}

export interface Branch {
    id: number;
    title: string | null;
    short_title: string | null;
    company_id: number | null;
    city_id: number | null;
    address: string | null;
    phone: string | null;
    longitude: number | null;
    latitude: number | null;
    enabled: boolean;
}

export interface DateRange {
    from: string | null;
    to: string | null;
}

export interface V2Filters {
    dateFrom: string | null;
    dateTo: string | null;
    partnerId: number | null;
    cityId: number | null;
    companyId: number | null;
    branchId: number | null;
    tariffId: number | null;
    professionId: number | null;
    shiftStatuses: number[];
}

export interface DimensionOption {
    id: number;
    label: string;
    extra?: string;
}

export interface BranchDimensionOption extends DimensionOption {
    companyId: number | null;
    cityId: number | null;
}
