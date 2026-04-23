export const FLAT_HOURS_PER_SHIFT = 9;

export const SHIFT_STATUS: Record<number, string> = {
    1: "В работе",
    2: "В наборе",
    3: "В согласовании",
    4: "В оплате",
    5: "В архиве",
    6: "Отменённые",
};

export const SHIFT_STATUS_ORDER: number[] = [2, 1, 3, 4, 5, 6];

export const SHIFT_FUNNEL_ORDER: number[] = [2, 1, 3, 4, 5];

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
    pending: "Ожидание",
    success: "Оплачено",
    fail: "Ошибка",
    in_process: "В процессе",
};

export const COMPLETION_STATUS_LABEL: Record<string, string> = {
    success: "Выполнено",
    reject: "Отказ",
    fine: "Штраф",
    zero_production: "Нулевая выработка",
    in_process: "В процессе",
};

export const BALANCE_TYPE_LABEL: Record<number, string> = {
    1: "Начисление",
    2: "Списание",
};

export const POWER_BI_COLORS = {
    primary: "#118DFF",
    deepBlue: "#12239E",
    orange: "#E66C37",
    purple: "#6B007B",
    red: "#D64550",
    brown: "#B65D3D",
    teal: "#2FACAD",
    green: "#3AA76D",
    yellow: "#F4B942",
    pink: "#E57BBE",
} as const;

export const POWER_BI_PALETTE: string[] = [
    POWER_BI_COLORS.primary,
    POWER_BI_COLORS.orange,
    POWER_BI_COLORS.teal,
    POWER_BI_COLORS.purple,
    POWER_BI_COLORS.red,
    POWER_BI_COLORS.deepBlue,
    POWER_BI_COLORS.green,
    POWER_BI_COLORS.yellow,
    POWER_BI_COLORS.brown,
    POWER_BI_COLORS.pink,
];

export const STATUS_COLORS: Record<number, string> = {
    1: POWER_BI_COLORS.primary,
    2: POWER_BI_COLORS.yellow,
    3: POWER_BI_COLORS.teal,
    4: POWER_BI_COLORS.green,
    5: POWER_BI_COLORS.deepBlue,
    6: POWER_BI_COLORS.red,
};

export const COMPLETION_COLORS: Record<string, string> = {
    success: POWER_BI_COLORS.green,
    reject: POWER_BI_COLORS.red,
    fine: POWER_BI_COLORS.orange,
    zero_production: POWER_BI_COLORS.brown,
    in_process: POWER_BI_COLORS.teal,
};

export const PAYMENT_COLORS: Record<string, string> = {
    success: POWER_BI_COLORS.green,
    pending: POWER_BI_COLORS.yellow,
    fail: POWER_BI_COLORS.red,
    in_process: POWER_BI_COLORS.teal,
};
