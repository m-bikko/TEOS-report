import { NextResponse } from "next/server";
import { getStore } from "@/lib/v2/store";
import { parseFilters } from "@/lib/v2/joins";
import { computeFunnel } from "@/lib/v2/metrics/funnel";
import { computeOverview } from "@/lib/v2/metrics/overview";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const filters = parseFilters(url);
    const store = await getStore();
    const funnel = computeFunnel(store, filters);
    const overview = computeOverview(store, filters);
    return NextResponse.json({ ...funnel, overview });
}
