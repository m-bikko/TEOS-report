
import Papa from 'papaparse';
import { parse, isValid, isWithinInterval, startOfDay, endOfDay, parseISO, format } from 'date-fns';

export interface ShiftRecord {
    userId: string;
    company: string;
    branchCity: string;
    branchAddress: string;
    date: string; // YYYY-MM-DD
    production: number; // Hours
}

export interface FilterState {
    dateRange: {
        from: Date | undefined;
        to: Date | undefined;
    };
    company: string; // "all" or specific
    city: string; // "all" or specific
    address: string; // "all" or specific
}

export interface KPIStats {
    totalHours: number;
    totalShifts: number;
    avgHoursPerDay: number;
    avgHoursPerShift: number;
    avgPeoplePerDay: number;
}

export interface ChartDataPoint {
    date: string;
    [company: string]: number | string; // Dynamic keys for companies
}

export const fetchAndParseData = async (): Promise<ShiftRecord[]> => {
    try {
        const response = await fetch('/api/shifts');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data: ShiftRecord[] = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch data", error);
        return [];
    }
};

export const getUniqueValues = (data: ShiftRecord[], key: keyof ShiftRecord) => {
    return Array.from(new Set(data.map((item) => item[key]))).sort();
};

export const filterData = (data: ShiftRecord[], filters: FilterState) => {
    return data.filter((record) => {
        // Date Range Filter
        if (filters.dateRange.from && filters.dateRange.to) {
            const recordDate = parseISO(record.date);
            if (!isValid(recordDate)) return false;

            // Ensure inclusive checks
            if (!isWithinInterval(recordDate, { start: startOfDay(filters.dateRange.from), end: endOfDay(filters.dateRange.to) })) {
                return false;
            }
        }

        // Company Filter
        if (filters.company !== 'all' && record.company !== filters.company) return false;

        // City Filter
        if (filters.city !== 'all' && record.branchCity !== filters.city) return false;

        // Address Filter
        if (filters.address !== 'all' && record.branchAddress !== filters.address) return false;

        return true;
    });
};

export const calculateKPIs = (data: ShiftRecord[]): KPIStats => {
    if (data.length === 0) {
        return {
            totalHours: 0,
            totalShifts: 0,
            avgHoursPerDay: 0,
            avgHoursPerShift: 0,
            avgPeoplePerDay: 0,
        };
    }

    const totalHours = data.reduce((sum, r) => sum + r.production, 0);
    const totalShifts = data.length;

    // Unique days in the dataset
    const uniqueDays = new Set(data.map(r => r.date)).size;

    const avgHoursPerDay = uniqueDays > 0 ? totalHours / uniqueDays : 0;
    const avgHoursPerShift = totalShifts > 0 ? totalHours / totalShifts : 0;
    const avgPeoplePerDay = uniqueDays > 0 ? totalShifts / uniqueDays : 0;

    return {
        totalHours,
        totalShifts,
        avgHoursPerDay,
        avgHoursPerShift,
        avgPeoplePerDay,
    };
};

export const aggregateByDayAndCompany = (data: ShiftRecord[], metric: 'people' | 'hours') => {
    // Group by Date -> Company -> Value
    const grouped: Record<string, Record<string, number>> = {};
    const allCompanies = new Set<string>();

    data.forEach(record => {
        if (!grouped[record.date]) grouped[record.date] = {};
        if (!grouped[record.date][record.company]) grouped[record.date][record.company] = 0;

        if (metric === 'people') {
            // For people count, we might want unique users per day/company, or just total records (shifts)?
            // Request: "Колво людей вышедших каждый день". 
            // "People can be duplicated" is said in the description of inputs, but usually "People count" implies unique heads.
            // However, "Production - 1 record, is how many hours worked by performer for ONE SHIFT".
            // If a person works 2 shifts in a day, do they count as 1 person or 2?
            // "People can be duplicated" - likely refers to the CSV list having the same person multiple times.
            // I will count unique User IDs per day per company for "People", and total shifts for "Shifts" if needed.
            // But the request asks: "Колво людей вышедших каждый день" (Number of people who came out each day).
            // I'll assume Unique User IDs is the most accurate metric for "People".
            // NOTE: But calculating unique users in a simple aggregation loop is tricky if I just sum. 
            // I will use a separate grouping for People to ensure uniqueness if needed.
            // Let's stick to Record Count for now as "Shifts" and maybe Unique for "People" if I can.
            // Actually, let's count Records (Shifts) as a proxy for "People showing up", but if 'User ID' is present, Unique is better.
            // Let's do Unique User IDs for "People Output".
        }
        allCompanies.add(record.company);
    });

    // Re-iterate to count carefully
    // Better strategy:
    const tempGrouping: Record<string, Record<string, Set<string> | number>> = {};

    data.forEach(record => {
        if (!tempGrouping[record.date]) tempGrouping[record.date] = {};

        if (metric === 'people') {
            if (!tempGrouping[record.date][record.company]) tempGrouping[record.date][record.company] = new Set();
            (tempGrouping[record.date][record.company] as Set<string>).add(record.userId);
        } else {
            if (!tempGrouping[record.date][record.company]) tempGrouping[record.date][record.company] = 0;
            (tempGrouping[record.date][record.company] as number) += record.production;
        }
        allCompanies.add(record.company);
    });

    const result: ChartDataPoint[] = Object.keys(tempGrouping).sort().map(date => {
        const entry: any = { date };
        allCompanies.forEach(company => {
            const val = tempGrouping[date][company];
            if (metric === 'people') {
                entry[company] = val ? (val as Set<string>).size : 0;
            } else {
                entry[company] = val || 0;
            }
        });
        return entry;
    });

    return { data: result, companies: Array.from(allCompanies) };
};

// Helper for 'Total shifts' (Shifts count) vs 'People' (Unique persons)
// Request: "Колво выходов" (Shifts) vs "Колво людей" (People).
// I should support both or clarify. 
// "Колво людей вышедших каждый день" -> Unique People.
// "Общее колво выходов" -> Total Shifts.
