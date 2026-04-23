import { Store } from "../store";
import { V2Filters } from "../types";
import { filterShiftUsers, filterShifts } from "../joins";
import { SHIFT_STATUS, SHIFT_FUNNEL_ORDER, FLAT_HOURS_PER_SHIFT } from "../enums";

export interface DailyPlanFact {
    date: string;
    plan: number;
    fact: number;
}

export interface DailyCostVsPayout {
    date: string;
    cost: number;
    payouts: number;
}

export interface ShiftStatusBucket {
    status: number;
    label: string;
    count: number;
}

export interface ShiftStatusTimelinePoint {
    date: string;
    byStatus: Record<number, number>;
    total: number;
}

export interface CompletionBucket {
    key: string;
    count: number;
}

export interface FunnelStage {
    status: number;
    label: string;
    count: number;
    dropOffPct: number;
}

export interface AVRStats {
    total: number;
    userSignedPct: number;
    partnerSignedPct: number;
    cmsSignedPct: number;
    withDatePct: number;
}

export interface ProductionAdjustment {
    total: number;
    adjusted: number;
    adjustedPct: number;
    sumDelta: number;
}

export interface FunnelResponse {
    shiftStatus: ShiftStatusBucket[];
    assignmentsByStatus: ShiftStatusBucket[];
    hoursByStatus: ShiftStatusBucket[];
    timeline: ShiftStatusTimelinePoint[];
    assignmentTimeline: ShiftStatusTimelinePoint[];
    hoursTimeline: ShiftStatusTimelinePoint[];
    completion: CompletionBucket[];
    payment: CompletionBucket[];
    funnel: FunnelStage[];
    avr: AVRStats;
    production: ProductionAdjustment;
    totalShifts: number;
    totalAssignments: number;
    planFact: DailyPlanFact[];
    costVsPayout: DailyCostVsPayout[];
}

export function computeFunnel(store: Store, filters: V2Filters): FunnelResponse {
    const shifts = filterShifts(store, filters);

    const statusCounts = new Map<number, number>();
    const timelineMap = new Map<string, Map<number, number>>();
    const planByDay = new Map<string, number>();
    const shiftIdSet = new Set<number>();
    const shiftIdToDate = new Map<number, string>();

    for (const r of shifts) {
        const s = r.shift.status;
        statusCounts.set(s, (statusCounts.get(s) ?? 0) + 1);
        const day = r.shift.date;
        let dayMap = timelineMap.get(day);
        if (!dayMap) {
            dayMap = new Map();
            timelineMap.set(day, dayMap);
        }
        dayMap.set(s, (dayMap.get(s) ?? 0) + 1);

        shiftIdSet.add(r.shift.id);
        shiftIdToDate.set(r.shift.id, day);

        const plan = r.vacancy?.total_employees_count ?? 0;
        planByDay.set(day, (planByDay.get(day) ?? 0) + plan);
    }

    const shiftStatus: ShiftStatusBucket[] = Object.keys(SHIFT_STATUS).map((key) => {
        const code = Number(key);
        return {
            status: code,
            label: SHIFT_STATUS[code] ?? `Код ${code}`,
            count: statusCounts.get(code) ?? 0,
        };
    });

    const timeline: ShiftStatusTimelinePoint[] = Array.from(timelineMap.entries())
        .map(([date, map]) => {
            const byStatus: Record<number, number> = {};
            let total = 0;
            for (const [s, c] of map.entries()) {
                byStatus[s] = c;
                total += c;
            }
            return { date, byStatus, total };
        })
        .sort((a, b) => a.date.localeCompare(b.date));

    const assignments = filterShiftUsers(store, filters);

    const completionMap = new Map<string, number>();
    const paymentMap = new Map<string, number>();
    let avrTotal = 0;
    let avrUserSigned = 0;
    let avrPartnerSigned = 0;
    let avrCmsSigned = 0;
    let avrDated = 0;
    let productionAdjustedRows = 0;
    let sumDelta = 0;

    const assignmentStatusCounts = new Map<number, number>();
    const assignmentTimelineMap = new Map<string, Map<number, number>>();
    const hoursStatusCounts = new Map<number, number>();
    const hoursTimelineMap = new Map<string, Map<number, number>>();
    const factByDay = new Map<string, number>();
    const costByDay = new Map<string, number>();

    for (const r of assignments) {
        const cs = r.shiftUser.completion_status ?? "unknown";
        completionMap.set(cs, (completionMap.get(cs) ?? 0) + 1);
        const ps = r.shiftUser.payment_status ?? "unknown";
        paymentMap.set(ps, (paymentMap.get(ps) ?? 0) + 1);

        avrTotal += 1;
        if (r.shiftUser.avr_user_sign) avrUserSigned += 1;
        if (r.shiftUser.avr_partner_sign) avrPartnerSigned += 1;
        if (r.shiftUser.avr_cms) avrCmsSigned += 1;
        if (r.shiftUser.avr_date) avrDated += 1;

        if (r.shiftUser.previous_production > 0 && r.shiftUser.previous_production !== r.shiftUser.production) {
            productionAdjustedRows += 1;
            sumDelta += r.shiftUser.production - r.shiftUser.previous_production;
        }

        const s = r.shift.status;
        assignmentStatusCounts.set(s, (assignmentStatusCounts.get(s) ?? 0) + 1);
        const day = r.shift.date;
        if (day) {
            let dayMap = assignmentTimelineMap.get(day);
            if (!dayMap) {
                dayMap = new Map();
                assignmentTimelineMap.set(day, dayMap);
            }
            dayMap.set(s, (dayMap.get(s) ?? 0) + 1);

            factByDay.set(day, (factByDay.get(day) ?? 0) + 1);

            const rate = r.tariff?.rate_for_company ?? 0;
            costByDay.set(day, (costByDay.get(day) ?? 0) + rate * r.shiftUser.production);
        }

        const tariffType = r.tariff?.type ?? null;
        let hours = 0;
        if (tariffType === 1) hours = r.shiftUser.production;
        else if (tariffType === 2 || tariffType === 3 || tariffType === 4) hours = FLAT_HOURS_PER_SHIFT;

        if (hours > 0) {
            hoursStatusCounts.set(s, (hoursStatusCounts.get(s) ?? 0) + hours);
            if (day) {
                let hoursDayMap = hoursTimelineMap.get(day);
                if (!hoursDayMap) {
                    hoursDayMap = new Map();
                    hoursTimelineMap.set(day, hoursDayMap);
                }
                hoursDayMap.set(s, (hoursDayMap.get(s) ?? 0) + hours);
            }
        }
    }

    const payoutsByDay = new Map<string, number>();
    for (const entry of store.balanceLog) {
        if (entry.type !== 1) continue;
        if (entry.shift_id == null) continue;
        if (!shiftIdSet.has(entry.shift_id)) continue;
        const day = shiftIdToDate.get(entry.shift_id);
        if (!day) continue;
        payoutsByDay.set(day, (payoutsByDay.get(day) ?? 0) + Math.abs(entry.change_amount));
    }

    const assignmentsByStatus: ShiftStatusBucket[] = Object.keys(SHIFT_STATUS).map((key) => {
        const code = Number(key);
        return {
            status: code,
            label: SHIFT_STATUS[code] ?? `Код ${code}`,
            count: assignmentStatusCounts.get(code) ?? 0,
        };
    });

    const assignmentTimeline: ShiftStatusTimelinePoint[] = Array.from(assignmentTimelineMap.entries())
        .map(([date, map]) => {
            const byStatus: Record<number, number> = {};
            let total = 0;
            for (const [s, c] of map.entries()) {
                byStatus[s] = c;
                total += c;
            }
            return { date, byStatus, total };
        })
        .sort((a, b) => a.date.localeCompare(b.date));

    const hoursByStatus: ShiftStatusBucket[] = Object.keys(SHIFT_STATUS).map((key) => {
        const code = Number(key);
        return {
            status: code,
            label: SHIFT_STATUS[code] ?? `Код ${code}`,
            count: Math.round(hoursStatusCounts.get(code) ?? 0),
        };
    });

    const hoursTimeline: ShiftStatusTimelinePoint[] = Array.from(hoursTimelineMap.entries())
        .map(([date, map]) => {
            const byStatus: Record<number, number> = {};
            let total = 0;
            for (const [s, c] of map.entries()) {
                byStatus[s] = c;
                total += c;
            }
            return { date, byStatus, total };
        })
        .sort((a, b) => a.date.localeCompare(b.date));

    const allDays = new Set<string>([...planByDay.keys(), ...factByDay.keys()]);
    const planFact: DailyPlanFact[] = Array.from(allDays)
        .sort((a, b) => a.localeCompare(b))
        .map((date) => ({
            date,
            plan: planByDay.get(date) ?? 0,
            fact: factByDay.get(date) ?? 0,
        }));

    const allCostDays = new Set<string>([...costByDay.keys(), ...payoutsByDay.keys()]);
    const costVsPayout: DailyCostVsPayout[] = Array.from(allCostDays)
        .sort((a, b) => a.localeCompare(b))
        .map((date) => ({
            date,
            cost: costByDay.get(date) ?? 0,
            payouts: payoutsByDay.get(date) ?? 0,
        }));

    const completion: CompletionBucket[] = Array.from(completionMap.entries())
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count);

    const payment: CompletionBucket[] = Array.from(paymentMap.entries())
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count);

    const funnel: FunnelStage[] = [];
    let prevCount = 0;
    for (let i = 0; i < SHIFT_FUNNEL_ORDER.length; i += 1) {
        const code = SHIFT_FUNNEL_ORDER[i];
        const count = statusCounts.get(code) ?? 0;
        const dropOffPct = i === 0 || prevCount === 0 ? 0 : ((prevCount - count) / prevCount) * 100;
        funnel.push({ status: code, label: SHIFT_STATUS[code], count, dropOffPct });
        prevCount = count;
    }

    const avr: AVRStats = {
        total: avrTotal,
        userSignedPct: avrTotal ? (avrUserSigned / avrTotal) * 100 : 0,
        partnerSignedPct: avrTotal ? (avrPartnerSigned / avrTotal) * 100 : 0,
        cmsSignedPct: avrTotal ? (avrCmsSigned / avrTotal) * 100 : 0,
        withDatePct: avrTotal ? (avrDated / avrTotal) * 100 : 0,
    };

    return {
        shiftStatus,
        assignmentsByStatus,
        hoursByStatus,
        timeline,
        assignmentTimeline,
        hoursTimeline,
        completion,
        payment,
        funnel,
        avr,
        production: {
            total: avrTotal,
            adjusted: productionAdjustedRows,
            adjustedPct: avrTotal ? (productionAdjustedRows / avrTotal) * 100 : 0,
            sumDelta,
        },
        totalShifts: shifts.length,
        totalAssignments: assignments.length,
        planFact,
        costVsPayout,
    };
}
