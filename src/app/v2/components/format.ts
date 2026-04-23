export const fmtNumber = (n: number, digits = 0): string =>
    n.toLocaleString("ru-RU", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const fmtMoney = (n: number): string => {
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} млн ₸`;
    if (Math.abs(n) >= 1_000) return `${(n / 1_000).toLocaleString("ru-RU", { maximumFractionDigits: 1 })} тыс ₸`;
    return `${n.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₸`;
};

export const fmtMoneyFull = (n: number): string =>
    n.toLocaleString("ru-RU", { style: "currency", currency: "KZT", maximumFractionDigits: 0 });

export const fmtPct = (n: number, digits = 1): string => `${n.toFixed(digits)}%`;
