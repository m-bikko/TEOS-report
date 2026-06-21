import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const FILES: Record<string, { path: string; contentType: string }> = {
    "FunnelMockChart.tsx": {
        path: "src/app/demo/FunnelMockChart.tsx",
        contentType: "text/plain; charset=utf-8",
    },
    "mockData.ts": {
        path: "src/app/demo/mockData.ts",
        contentType: "text/plain; charset=utf-8",
    },
    "page.tsx": {
        path: "src/app/demo/page.tsx",
        contentType: "text/plain; charset=utf-8",
    },
    "FUNNEL_CHART_GUIDE.md": {
        path: "docs/FUNNEL_CHART_GUIDE.md",
        contentType: "text/markdown; charset=utf-8",
    },
};

export async function GET(request: Request) {
    const url = new URL(request.url);
    const fileName = url.searchParams.get("file");

    if (!fileName || !(fileName in FILES)) {
        return NextResponse.json({ error: "Unknown file" }, { status: 404 });
    }

    const entry = FILES[fileName];
    const fullPath = path.join(process.cwd(), entry.path);

    try {
        const content = await fs.readFile(fullPath, "utf-8");
        return new NextResponse(content, {
            status: 200,
            headers: {
                "Content-Type": entry.contentType,
                "Content-Disposition": `attachment; filename="${fileName}"`,
                "Cache-Control": "no-store",
            },
        });
    } catch (e) {
        const message = e instanceof Error ? e.message : "Read failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
