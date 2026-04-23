import { NextResponse } from "next/server";
import { getStore } from "@/lib/v2/store";
import { parseFilters } from "@/lib/v2/joins";
import { computeFinance } from "@/lib/v2/metrics/finance";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const filters = parseFilters(url);
    const userParam = url.searchParams.get("user");
    const selectedUserId = userParam ? Number(userParam) : null;
    const store = await getStore();
    const data = computeFinance(store, filters, Number.isFinite(selectedUserId) ? selectedUserId : null);
    return NextResponse.json(data);
}
