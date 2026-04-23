import { Store } from "../store";
import { V2Filters } from "../types";
import { filterShifts, filterShiftUsers } from "../joins";
import { FLAT_HOURS_PER_SHIFT } from "../enums";

export interface OverviewKPIs {
    totalShifts: number;
    inWork: number;
    inRecruiting: number;
    totalAssignments: number;
    planExecutors: number;
    factExecutors: number;
    fulfillmentPct: number;
    expectedCost: number;
    actualPayouts: number;
    costDelta: number;
    costDeltaPct: number;
    hoursTotal: number;
    hoursHourly: number;
    hoursFlat: number;
    hourlyAssignments: number;
    flatAssignments: number;
    unknownTariffAssignments: number;
}

export function computeOverview(store: Store, filters: V2Filters): OverviewKPIs {
    const shifts = filterShifts(store, filters);
    const assignments = filterShiftUsers(store, filters);

    let inWork = 0;
    let inRecruiting = 0;
    let planExecutors = 0;
    const shiftIdSet = new Set<number>();

    for (const r of shifts) {
        shiftIdSet.add(r.shift.id);
        if (r.shift.status === 1) inWork += 1;
        else if (r.shift.status === 2) inRecruiting += 1;
        planExecutors += r.vacancy?.total_employees_count ?? 0;
    }

    let expectedCost = 0;
    let hoursHourly = 0;
    let hoursFlat = 0;
    let hourlyAssignments = 0;
    let flatAssignments = 0;
    let unknownTariffAssignments = 0;
    for (const a of assignments) {
        const rate = a.tariff?.rate_for_company ?? 0;
        expectedCost += rate * a.shiftUser.production;

        const type = a.tariff?.type ?? null;
        if (type === 1) {
            hoursHourly += a.shiftUser.production;
            hourlyAssignments += 1;
        } else if (type === 2 || type === 3 || type === 4) {
            hoursFlat += FLAT_HOURS_PER_SHIFT;
            flatAssignments += 1;
        } else {
            unknownTariffAssignments += 1;
        }
    }

    let actualPayouts = 0;
    for (const entry of store.balanceLog) {
        if (entry.type !== 1) continue;
        if (entry.shift_id == null) continue;
        if (!shiftIdSet.has(entry.shift_id)) continue;
        actualPayouts += Math.abs(entry.change_amount);
    }

    const factExecutors = assignments.length;
    const costDelta = expectedCost - actualPayouts;

    return {
        totalShifts: shifts.length,
        inWork,
        inRecruiting,
        totalAssignments: factExecutors,
        planExecutors,
        factExecutors,
        fulfillmentPct: planExecutors > 0 ? (factExecutors / planExecutors) * 100 : 0,
        expectedCost,
        actualPayouts,
        costDelta,
        costDeltaPct: expectedCost > 0 ? (costDelta / expectedCost) * 100 : 0,
        hoursTotal: hoursHourly + hoursFlat,
        hoursHourly,
        hoursFlat,
        hourlyAssignments,
        flatAssignments,
        unknownTariffAssignments,
    };
}
