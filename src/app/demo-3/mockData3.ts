/**
 * Детерминированный генератор мок-данных для /demo-3 (аналитика выплат).
 *
 * Сценарий: каждая выплата привязана к смене и партнёру, идёт по одному из
 * двух каналов:
 *   - "gph"      - оплата по ГПХ (договор гражданско-правового характера)
 *   - "prosper"  - оплата через Prosper Pay (для СМЗ - самозанятых)
 *
 * ВАЖНО: paymentDate - это **дата проведения выплаты**, а не дата заказа.
 * В TEOS-смыслах это created_at записи в user_balance_log (type=1).
 *
 * SSR-safe: фиксированный seed → одинаковые значения на сервере и клиенте.
 */

export interface Partner {
    id: number;
    name: string;
    color: string;
    /** Множитель активности - задаёт «крупность» партнёра */
    scale: number;
}

export const PARTNERS: Partner[] = [
    { id: 1, name: "UniGroup Lab", color: "#118DFF", scale: 1.0 },
    { id: 2, name: "UG Тұмар", color: "#E66C37", scale: 0.85 },
    { id: 3, name: "UniGroupkz", color: "#3AA76D", scale: 0.65 },
    { id: 4, name: "UG Куат", color: "#6B007B", scale: 0.45 },
    { id: 5, name: "UniGroup Юг", color: "#D64550", scale: 0.30 },
];

export type PaymentChannel = "gph" | "prosper";

export const CHANNEL_LABEL: Record<PaymentChannel, string> = {
    gph: "ГПХ",
    prosper: "Prosper Pay (СМЗ)",
};

export interface PaymentEvent {
    /** Дата проведения выплаты (YYYY-MM-DD), НЕ дата заказа */
    paymentDate: string;
    partnerId: number;
    /** Сумма выплаты в тенге */
    amount: number;
    channel: PaymentChannel;
    /** Связанная смена (по которой идёт выплата) */
    shiftId: number;
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

export function generateMockPayments(): PaymentEvent[] {
    const rng = mulberry32(SEED);
    const events: PaymentEvent[] = [];
    let shiftCounter = 1000;

    for (let i = 0; i < DAYS; i += 1) {
        const date = addDays(START_ISO, i);
        // Лёгкая недельная синусоида: пиковые рабочие дни → больше выплат
        const wave = 0.8 + 0.4 * Math.sin((i / 7) * Math.PI * 2);

        for (const partner of PARTNERS) {
            const dayScale = partner.scale * wave;

            // ГПХ: реже, но крупнее (3–12 выплат/день, 30k–150k)
            const gphCount = Math.round((3 + rng() * 9) * dayScale);
            for (let k = 0; k < gphCount; k += 1) {
                events.push({
                    paymentDate: date,
                    partnerId: partner.id,
                    amount: Math.round(30_000 + rng() * 120_000),
                    channel: "gph",
                    shiftId: shiftCounter++,
                });
            }

            // Prosper Pay (СМЗ): чаще, мельче (8–35 выплат/день, 5k–28k)
            const prosperCount = Math.round((8 + rng() * 27) * dayScale);
            for (let k = 0; k < prosperCount; k += 1) {
                events.push({
                    paymentDate: date,
                    partnerId: partner.id,
                    amount: Math.round(5_000 + rng() * 23_000),
                    channel: "prosper",
                    shiftId: shiftCounter++,
                });
            }
        }
    }

    return events;
}

