/**
 * Детерминированный генератор мок-данных для /demo-2.
 *
 * Содержит 2 датасета:
 *   - OrderDayPoint  - для графика «Заказы по дням и статусам» (Chart 1)
 *   - IntakeDayPoint - для графика «Записи на заказ» (Chart 2)
 *
 * Зависят только от индекса дня - SSR и клиент рендерят одно и то же.
 */

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

// ════════════════════════════════════════════════════════════════════════
// CHART 1 - Заказы по дням и статусам
// ════════════════════════════════════════════════════════════════════════

/** Один день: заказы в каждом из 6 статусов */
export interface OrderDayPoint {
    /** YYYY-MM-DD */
    date: string;
    /** В наборе */
    inRecruiting: number;
    /** В работе */
    inWork: number;
    /** В согласовании */
    inApproval: number;
    /** В оплате */
    inPayment: number;
    /** В архиве */
    archived: number;
    /** Отменённые */
    cancelled: number;
}

export function generateMockOrders(): OrderDayPoint[] {
    const rng = mulberry32(SEED);
    const out: OrderDayPoint[] = [];
    for (let i = 0; i < DAYS; i += 1) {
        const date = addDays(START_ISO, i);

        // Большая часть заказов идёт в архив (старшие даты), новые - в наборе/работе.
        const totalBase = 240 + Math.round(rng() * 80);
        const archived = Math.round(totalBase * (0.65 + rng() * 0.1));
        const cancelled = Math.round(totalBase * (0.18 + rng() * 0.07));

        // Остальные - небольшие "хвосты"
        const inRecruiting = Math.round(rng() * 4);
        const inWork = Math.round(rng() * 3);
        const inApproval = Math.round(rng() * 8);
        const inPayment = Math.round(rng() < 0.07 ? rng() * 2 : 0);

        out.push({ date, inRecruiting, inWork, inApproval, inPayment, archived, cancelled });
    }
    return out;
}

// ════════════════════════════════════════════════════════════════════════
// CHART 2 - Записи на заказ
// ════════════════════════════════════════════════════════════════════════

/** Один день: записи на заказ + подписанные АВР */
export interface IntakeDayPoint {
    /** YYYY-MM-DD */
    date: string;
    /** Записались сами (через мобильное приложение) */
    organicIntake: number;
    /** Записаны операторами (через бэк-офис) */
    operatorIntake: number;
    /** Подписанные АВР за день */
    signedAvr: number;
}

export function generateMockIntake(): IntakeDayPoint[] {
    const rng = mulberry32(SEED + 1);
    const out: IntakeDayPoint[] = [];
    for (let i = 0; i < DAYS; i += 1) {
        const date = addDays(START_ISO, i);

        // Organic - основная часть (60–75% всех записей), 400–700 в день
        const organicIntake = Math.round(420 + rng() * 280);
        // Operator - 30–45% от organic, 150–340
        const operatorIntake = Math.round(organicIntake * (0.30 + rng() * 0.15));

        const total = organicIntake + operatorIntake;
        // АВР подписано: 70–95% от суммарной интейки
        const signedAvr = Math.round(total * (0.70 + rng() * 0.25));

        out.push({ date, organicIntake, operatorIntake, signedAvr });
    }
    return out;
}
