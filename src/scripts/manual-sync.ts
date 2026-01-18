
import dotenv from 'dotenv';
import path from 'path';

// Load env from one level up (since we are in src/scripts, actually project root)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { syncData } from '../lib/sync';
import mongoose from 'mongoose';

async function main() {
    console.log('Running manual sync script...');
    if (!process.env.MONGODB_URL) {
        console.error('MONGODB_URL is missing in env');
        process.exit(1);
    }

    try {
        const result = await syncData();
        console.log('Sync result:', result);
    } catch (error) {
        console.error('Sync failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

main();
