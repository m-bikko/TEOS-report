
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

        const records = parsed.data
            .map((row: any) => ({
                userId: String(row['User ID']),
                company: row['Company'],
                branchCity: row['Branch City'],
                branchAddress: row['Branch Address'],
                date: row['Date'],
                production: Number(row['Production'] || 0),
            }))
            .filter((r) => r.company && r.date);

        console.log(`[Sync] Parsed ${records.length} valid records. Update strategy: Full Replace.`);

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
