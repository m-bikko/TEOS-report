
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const cron = await import('node-cron');
        const { syncData } = await import('@/lib/sync');

        console.log('[Instrumentation] Scheduling daily sync job...');

        // Schedule task to run every day at 00:00 (midnight)
        // For testing you might want to run it every minute: '* * * * *'
        // Production: '0 0 * * *'
        cron.schedule('0 0 * * *', async () => {
            console.log('[Cron] Running scheduled daily sync...');
            await syncData();
        });

        // Optional: Run once on startup to ensure data exists?
        // Be careful with multiple instances (e.g. during dev HMR or multiple pods)
        // syncData(); 
    }
}
