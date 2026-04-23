import { Store } from "../store";
import { V2Filters } from "../types";
import { filterBalanceLog, filterShiftUsers } from "../joins";

export interface FinanceKPIs {
    totalAccruals: number;
    totalDeductions: number;
    netPayout: number;
    fineCount: number;
    fineAmount: number;
    uniqueUsers: number;
    transactionCount: number;
}

export interface TopUserRow {
    userId: number;
    accruals: number;
    deductions: number;
    net: number;
    shifts: number;
    fines: number;
    currentBalance: number;
}

export interface DailyPayoutPoint {
    date: string;
    accruals: number;
    deductions: number;
    net: number;
}

export interface UserBalancePoint {
    date: string;
    balance: number;
    delta: number;
    comment: string | null;
}

export interface FinanceResponse {
    kpis: FinanceKPIs;
    topUsers: TopUserRow[];
    daily: DailyPayoutPoint[];
    selectedUser: UserBalancePoint[] | null;
}

export function computeFinance(
    store: Store,
    filters: V2Filters,
    selectedUserId: number | null,
): FinanceResponse {
    const log = filterBalanceLog(store, filters);

    let totalAccruals = 0;
    let totalDeductions = 0;
    let fineCount = 0;
    let fineAmount = 0;
    const users = new Set<number>();

    const byUser = new Map<
        number,
        { accruals: number; deductions: number; shifts: Set<number>; fines: number; latestBalance: number; latestTs: string }
    >();
    const byDay = new Map<string, { accruals: number; deductions: number }>();

    for (const entry of log) {
        users.add(entry.user_id);
        const day = (entry.created_at ?? "").slice(0, 10);
        if (!byDay.has(day) && day) byDay.set(day, { accruals: 0, deductions: 0 });
        const dayBucket = day ? byDay.get(day) : undefined;

        let bucket = byUser.get(entry.user_id);
        if (!bucket) {
            bucket = { accruals: 0, deductions: 0, shifts: new Set(), fines: 0, latestBalance: 0, latestTs: "" };
            byUser.set(entry.user_id, bucket);
        }
        if (entry.shift_id != null) bucket.shifts.add(entry.shift_id);
        if (entry.fine_id != null) {
            bucket.fines += 1;
            fineCount += 1;
            fineAmount += Math.abs(entry.change_amount);
        }

        if (entry.type === 1) {
            totalAccruals += entry.change_amount;
            bucket.accruals += entry.change_amount;
            if (dayBucket) dayBucket.accruals += entry.change_amount;
        } else {
            const amt = Math.abs(entry.change_amount);
            totalDeductions += amt;
            bucket.deductions += amt;
            if (dayBucket) dayBucket.deductions += amt;
        }

        const ts = entry.created_at ?? "";
        if (ts > bucket.latestTs) {
            bucket.latestTs = ts;
            bucket.latestBalance = entry.current_balance;
        }
    }

    const topUsers: TopUserRow[] = Array.from(byUser.entries())
        .map(([userId, b]) => ({
            userId,
            accruals: b.accruals,
            deductions: b.deductions,
            net: b.accruals - b.deductions,
            shifts: b.shifts.size,
            fines: b.fines,
            currentBalance: b.latestBalance,
        }))
        .sort((a, b) => b.net - a.net)
        .slice(0, 20);

    const daily: DailyPayoutPoint[] = Array.from(byDay.entries())
        .map(([date, b]) => ({
            date,
            accruals: b.accruals,
            deductions: b.deductions,
            net: b.accruals - b.deductions,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

    let selectedUser: UserBalancePoint[] | null = null;
    if (selectedUserId != null) {
        selectedUser = store.balanceLog
            .filter((e) => e.user_id === selectedUserId)
            .sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""))
            .map((e) => ({
                date: (e.created_at ?? "").slice(0, 10),
                balance: e.current_balance,
                delta: e.type === 1 ? e.change_amount : -Math.abs(e.change_amount),
                comment: e.comment,
            }));
    }

    const resolvedShiftUsers = filterShiftUsers(store, filters);
    const resolvedUserSet = new Set(resolvedShiftUsers.map((r) => r.shiftUser.user_id));

    return {
        kpis: {
            totalAccruals,
            totalDeductions,
            netPayout: totalAccruals - totalDeductions,
            fineCount,
            fineAmount,
            uniqueUsers: Math.max(users.size, resolvedUserSet.size),
            transactionCount: log.length,
        },
        topUsers,
        daily,
        selectedUser,
    };
}
