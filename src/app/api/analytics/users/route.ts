import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { startOfDay, format, subDays, eachDayOfInterval } from 'date-fns';
import { ru } from 'date-fns/locale';
import { syncUsers } from '@/lib/sync';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const syncMode = searchParams.get('sync');

    if (syncMode === 'true') {
        try {
            const result = await syncUsers();
            return NextResponse.json(result);
        } catch (error) {
            return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
        }
    }

    try {
        await dbConnect();

        // Date filtering
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        let dateFilter: any = {};
        if (from && to) {
            dateFilter.createdAt = {
                $gte: new Date(from),
                $lte: new Date(to) // Ensure end of day inclusion if needed
            };
        }

        const totalUsers = await User.countDocuments(dateFilter);

        // Calculate users created BEFORE the start date (for cumulative chart)
        let totalBefore = 0;
        if (from) {
            totalBefore = await User.countDocuments({
                createdAt: { $lt: new Date(from) }
            });
        } else {
            // If no filter, totalBefore is effectively 0 or we could say we show all history?
            // But usually 'from' defaults to Jan 1.
            // If from is not provided, maybe we should return 0?
        }

        const defaultDateStr = '2025-08-07';

        // Aggregation: Group by Date (YYYY-MM-DD)
        const distribution = await User.aggregate([
            { $match: dateFilter },
            {
                $project: {
                    dateStr: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
                }
            },
            {
                $group: {
                    _id: "$dateStr",
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return NextResponse.json({
            total: totalUsers,
            totalBefore, // Return the baseline
            defaultDateCount: 0, // Deprecated or re-calc if needed
            distribution: distribution.map(d => ({ date: d._id, count: d.count }))
        });

    } catch (error) {
        console.error("Failed to fetch user analytics", error);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
