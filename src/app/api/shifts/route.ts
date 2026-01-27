
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Shift from '@/models/Shift';
import { syncData } from '@/lib/sync';

export async function GET(request: Request) {
    try {
        await dbConnect();

        // Optional: Trigger sync manually via query param ?sync=true
        const { searchParams } = new URL(request.url);
        if (searchParams.get('sync') === 'true') {
            await syncData();
        }

        const shifts = await Shift.find({}).lean();

        // Transform back to flat structure expected by frontend (or adjust frontend?)
        // Frontend expects ShiftRecord interface. 
        // Our Mongoose model aligns well, but let's ensure we return clean objects.
        const data = shifts.map(doc => ({
            userId: doc.userId,
            company: doc.company,
            branchCity: doc.branchCity,
            branchAddress: doc.branchAddress,
            date: doc.date,
            production: doc.production,
            tariffType: doc.tariffType,
            workCost: doc.workCost,
            workCostClient: doc.workCostClient,
        }));

        return NextResponse.json(data);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
