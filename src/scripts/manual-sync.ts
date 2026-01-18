
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';

async function main() {
    // 1. Load Environment Variables
    const envPath = path.resolve(process.cwd(), '.env');
    console.log(`Loading env from: ${envPath}`);
    const result = dotenv.config({ path: envPath });

    if (result.error) {
        console.error('Error loading .env file:', result.error);
    }

    console.log('MONGODB_URL is:', process.env.MONGODB_URL ? 'DEFINED' : 'UNDEFINED');

    // 2. Dynamic Import (Ensures db.ts reads env vars AFTER they are set)
    const { syncData } = await import('../lib/sync');

    console.log('Running manual sync script...');
    if (!process.env.MONGODB_URL) {
        console.error('MONGODB_URL is missing in env');
        process.exit(1);
    }

    try {
        const syncResult = await syncData();
        console.log('Sync result:', syncResult);
    } catch (error) {
        console.error('Sync failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

main();
