import Papa from 'papaparse';
import dbConnect from './db';
import Shift, { IShift } from '@/models/Shift';

const API_URL = 'https://api.teoserp.kz/api/power-bi/shift-users/download';

export async function syncData() {
    console.log('[Sync] Starting data synchronization...');
    try {
        await dbConnect();

        console.log('[Sync] Fetching data from API...');
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }

        const csvText = await response.text();
        console.log(`[Sync] Data fetched (${csvText.length} bytes). Parsing CSV...`);

        const parsed = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            transformHeader: (header) => header.trim(),
        });

        if (parsed.errors.length > 0) {
            console.warn('[Sync] CSV Parsing encountered errors:', parsed.errors[0]);
        }

        if (parsed.data.length > 0) {
            console.log('[Sync] First row keys:', Object.keys(parsed.data[0] as object));
            console.log('[Sync] First row sample:', parsed.data[0]);
        }

        const records = parsed.data
            .map((row: any) => ({
                userId: String(row['User ID']),
                company: row['Company'],
                branchCity: row['Branch City'],
                branchAddress: row['Branch Address'],
                date: row['Date'],
                production: Number(row['Production'] || 0),
                tariffType: String(row['Tariff Type']),
                workCost: Number(row['Work Cost'] || 0),
                workCostClient: Number(row['Work Cost Client'] || 0),
            }))
            // Filter: Company exists and Date exists
            .filter((r) => r.company && r.date);

        console.log(`[Sync] Parsed ${records.length} valid records (All Tariff Types). Update strategy: Full Replace.`);

        // Strategy: Full replacement ensures no stale data if records are deleted upstream.
        // For larger scales, upsert or diffing would be better, but for ~30k, this is acceptable and safest.

        await Shift.deleteMany({}); // Clear existing
        await Shift.insertMany(records);

        console.log('[Sync] Synchronization completed successfully.');
        return { success: true, count: records.length };
    } catch (error) {
        console.error('[Sync] Error during synchronization:', error);
        return { success: false, error };
    }
}

const USERS_API_URL = 'https://api.teoserp.kz/api/power-bi/users/download';

export async function syncUsers() {
    console.log('[Sync users] Starting user synchronization...');
    try {
        await dbConnect();

        console.log('[Sync users] Fetching data from API...');
        const response = await fetch(USERS_API_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch user data: ${response.status} ${response.statusText}`);
        }

        const csvText = await response.text();
        console.log(`[Sync users] Data fetched (${csvText.length} bytes). Parsing CSV...`);

        const parsed = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            transformHeader: (header) => header.trim(),
        });

        if (parsed.errors.length > 0) {
            console.warn('[Sync users] CSV Parsing encountered errors (sample):', parsed.errors[0]);
        }

        // Debug first row
        if (parsed.data.length > 0) {
            console.log('[Sync users] First row keys:', Object.keys(parsed.data[0] as object));
            console.log('[Sync users] First row sample:', parsed.data[0]);
        }

        // Import User model dynamically to avoid circular deps if any (though none here)
        const { default: User } = await import('@/models/User');

        const records = parsed.data
            .map((row: any) => {
                // Fix: Column names are 'ID' and 'Created Date' based on API inspection
                const userId = String(row['ID'] || row['id']);
                let createdAtRaw = row['Created Date'] || row['created_at'];

                let createdAtDate: Date;

                if (!createdAtRaw) {
                    // Default date: 2025-08-07
                    createdAtDate = new Date('2025-08-07T00:00:00.000Z');
                } else {
                    createdAtDate = new Date(createdAtRaw);
                    if (isNaN(createdAtDate.getTime())) {
                        console.warn(`[Sync users] Invalid date for user ${userId}: ${createdAtRaw}. Using default.`);
                        createdAtDate = new Date('2025-08-07T00:00:00.000Z');
                    }
                }

                return {
                    userId,
                    createdAt: createdAtDate,
                    rawCreatedAt: String(createdAtRaw || ''),
                };
            })
            .filter(r => r.userId && r.userId !== 'undefined');

        console.log(`[Sync users] Parsed ${records.length} valid user records. Update strategy: Full Replace.`);

        await User.deleteMany({});
        await User.insertMany(records);

        console.log('[Sync users] User synchronization completed successfully.');
        return { success: true, count: records.length };

    } catch (error) {
        console.error('[Sync users] Error during user synchronization:', error);
        return { success: false, error };
    }
}
