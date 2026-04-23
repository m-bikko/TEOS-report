import fs from "fs/promises";
import path from "path";
import Papa from "papaparse";

const DATA_DIR = path.join(process.cwd(), "second-part");

type Row = Record<string, string | number | null>;

interface CachedFile<T> {
    mtimeMs: number;
    rows: T[];
}

const cache = new Map<string, CachedFile<unknown>>();

const toNum = (v: unknown, fallback = 0): number => {
    if (v === null || v === undefined || v === "") return fallback;
    if (typeof v === "number") return Number.isFinite(v) ? v : fallback;
    const s = String(v).trim().replace(/^"|"$/g, "");
    if (s === "" || s === "0") return s === "0" ? 0 : fallback;
    const n = Number(s);
    return Number.isFinite(n) ? n : fallback;
};

const toNumOrNull = (v: unknown): number | null => {
    if (v === null || v === undefined || v === "") return null;
    const s = typeof v === "string" ? v.trim().replace(/^"|"$/g, "") : v;
    if (s === "") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
};

const toStr = (v: unknown): string | null => {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    if (s === "" || s === "0" || s === "NULL") return null;
    return s;
};

const toStrRequired = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    return String(v).trim();
};

const toBool = (v: unknown): boolean => {
    if (v === null || v === undefined || v === "") return false;
    const s = String(v).trim();
    return s === "1" || s.toLowerCase() === "true";
};

export const parsers = { toNum, toNumOrNull, toStr, toStrRequired, toBool };

export async function readCsv<T>(
    filename: string,
    mapper: (row: Row) => T | null,
): Promise<T[]> {
    const filePath = path.join(DATA_DIR, filename);
    let stat: Awaited<ReturnType<typeof fs.stat>>;
    try {
        stat = await fs.stat(filePath);
    } catch {
        return [];
    }

    const cached = cache.get(filename) as CachedFile<T> | undefined;
    if (cached && cached.mtimeMs === stat.mtimeMs) {
        return cached.rows;
    }

    const raw = await fs.readFile(filePath, "utf-8");
    const withoutBom = raw.replace(/^﻿/, "");
    const parsed = Papa.parse<Row>(withoutBom, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        transformHeader: (h) => h.trim(),
    });

    const rows: T[] = [];
    for (const r of parsed.data) {
        const mapped = mapper(r);
        if (mapped !== null) rows.push(mapped);
    }

    cache.set(filename, { mtimeMs: stat.mtimeMs, rows });
    return rows;
}

export function clearCache(): void {
    cache.clear();
}
