/**
 * Детерминированный генератор мок-данных для демо-графика воронки смен.
 *
 * ВАЖНО: значения зависят только от индекса дня (seeded PRNG), поэтому SSR
 * и клиент рендерят одно и то же - без hydration-ошибок.
 *
 * Если хочешь другие случайные значения - поменяй SEED.
 */

export interface FunnelDayPoint {
    /** YYYY-MM-DD - день, к которому относятся показатели */
    date: string;
    /** Взяли смену - сколько исполнителей записались на смену в этот день */
    taken: number;
    /** Вышли на объект - сколько реально появились на объекте */
    attended: number;
    /** Штраф - количество штрафных событий за день */
    fines: number;
    /** Отменил - количество отмен (юзер снялся со смены) */
    cancelled: number;
}

const SEED = 20_260_101;
const DAYS = 30;
const START_ISO = "2026-01-01";

function mulberry32(seed: number): () => number {
    let state = seed;
    return () => {
        state |= 0;
        state = (state + 0x6d2b79f5) | 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function addDays(iso: string, n: number): string {
    const [y, m, d] = iso.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d + n));
    return date.toISOString().slice(0, 10);
}

export function generateMockFunnel(): FunnelDayPoint[] {
    const rng = mulberry32(SEED);
    const out: FunnelDayPoint[] = [];

    for (let i = 0; i < DAYS; i += 1) {
        const date = addDays(START_ISO, i);

        // Взяли смену: 850–1050 с лёгкой синусоидой (имитируем недельный ритм)
        const wave = Math.sin((i / 7) * Math.PI * 2) * 60;
        const taken = Math.round(950 + wave + (rng() - 0.5) * 120);

        // Вышли на объект: обычно ниже взятых (92–100% от взятых),
        // но в ~10% случаев превышает на 2–10% (исполнитель пришёл без записи)
        const overshoot = rng() < 0.1;
        const ratio = overshoot ? 1.02 + rng() * 0.08 : 0.92 + rng() * 0.08;
        const attended = Math.round(taken * ratio);

        // Штраф: 20–150
        const fines = Math.round(20 + rng() * 130);

        // Отменил: 5–120
        const cancelled = Math.round(5 + rng() * 115);

        out.push({ date, taken, attended, fines, cancelled });
    }

    return out;
}
