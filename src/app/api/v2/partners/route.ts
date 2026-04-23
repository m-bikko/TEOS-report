import { NextResponse } from "next/server";
import { getStore } from "@/lib/v2/store";
import { parseFilters } from "@/lib/v2/joins";
import { computePartners } from "@/lib/v2/metrics/partners";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const filters = parseFilters(url);
    const store = await getStore();
    const data = computePartners(store, filters);
    return NextResponse.json(data);
}
