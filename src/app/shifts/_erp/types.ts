/**
 * Модель раздела «Заказы» боевого ERP.
 *
 * Шесть подразделов — это один и тот же экран с разным набором кнопок,
 * действий и колонок. Различия вынесены в STATUS_CONFIG, чтобы они читались
 * одной таблицей, а не расползались по шести страницам.
 */

export type StatusKey =
    | "recruitment"
    | "in-work"
    | "under-approval"
    | "in-payment"
    | "archive"
    | "cancelled";

/** Тон плашки статуса и значений в колонках АВР / Чек / Статус оплаты. */
export type Tone = "amber" | "green" | "blue" | "gray" | "red" | "plain";

export interface Pill {
    label: string;
    tone: Tone;
}

export type ColumnKey =
    | "select"
    | "id"
    | "name"
    | "phone"
    | "kaspi"
    | "citizenship"
    | "rating"
    | "status"
    | "output"
    | "surcharge"
    | "amount"
    | "total"
    | "wallet"
    | "avr"
    | "receipt"
    | "payment";

export const COLUMN_LABEL: Record<Exclude<ColumnKey, "select">, string> = {
    id: "ID",
    name: "ФИО исполнителя",
    phone: "Телефон",
    kaspi: "Номер Kaspi Gold",
    citizenship: "Гражданство",
    rating: "Рейтинг",
    status: "Статус",
    output: "Выработка",
    surcharge: "Доплаты/Удержания",
    amount: "Сумма",
    total: "Итого",
    wallet: "Кошелек",
    avr: "АВР",
    receipt: "Чек",
    payment: "Статус оплаты",
};

export type ActionKey =
    | "ready"
    | "add"
    | "addFromOrder"
    | "blacklist"
    | "foreman"
    | "message"
    | "history"
    | "invite"
    | "remove"
    | "removeFine"
    | "pay"
    | "refund";

export const ACTION_LABEL: Record<ActionKey, string> = {
    ready: "Готов",
    add: "Добавить",
    addFromOrder: "Добавить из другого заказа",
    blacklist: "В черный список",
    foreman: "Назначить бригадиром",
    message: "Отправить сообщение",
    history: "История изменений",
    invite: "Пригласить в заказ",
    remove: "Удалить",
    removeFine: "Удалить со штрафом",
    pay: "Оплатить",
    refund: "Вернуть",
};

/** Действия, которые в оригинале погашены, пока ни одна строка не отмечена. */
export const NEEDS_SELECTION: ReadonlySet<ActionKey> = new Set<ActionKey>([
    "foreman",
    "message",
    "invite",
    "remove",
    "removeFine",
    "refund",
]);

export type ButtonKey =
    | "start"
    | "finish"
    | "toPayment"
    | "toPaymentMuted"
    | "toApproval"
    | "toArchive"
    | "attachLuvr"
    | "downloadLuvr";

export interface Executor {
    id: number;
    name: string;
    phone?: string;
    kaspi?: string;
    citizenship?: string;
    rating?: number;
    status?: Pill;
    output?: string;
    surcharge?: string;
    amount?: string;
    total?: string;
    wallet?: string;
    avr?: Pill;
    receipt?: Pill;
    payment?: Pill;
}

export interface Order {
    number: number;
    company: string;
    title: string;
    phone: string;
    address: string;
    facility: string;
    /** Пустой — в шапке карточки нет карандаша и стрелки. */
    headerIcons: ("edit" | "share")[];
    buttons: ButtonKey[];
    filled: number;
    required: number;
    reserve: number;
    attended: number;
    date: string;
    timeFrom: string;
    /** У части заказов в оригинале указано только одно время. */
    timeTo?: string;
    rate: string;
    total: string;
    executors: Executor[];
    /** Строка «Итого» под таблицей: часы и сумма. */
    totals?: { hours: string; sum: string };
}

export interface StatusConfig {
    key: StatusKey;
    path: string;
    navLabel: string;
    badge: Pill;
    actions: ActionKey[];
    actionsAlign: "left" | "right";
    columns: ColumnKey[];
    /** Строки таблицы залиты голубым — так в оригинале помечены расчётные статусы. */
    tintedRows: boolean;
    /** Выработку и доплаты можно править прямо в строке: поле со временем и карандаш. */
    editableRows?: boolean;
    /** Действия, которые погашены именно в этом подразделе сверх общего списка. */
    extraNeedsSelection?: ActionKey[];
}

const WITH_RATING: ColumnKey[] = [
    "select",
    "id",
    "name",
    "phone",
    "citizenship",
    "rating",
    "status",
];

const FULL_ACTIONS: ActionKey[] = [
    "ready",
    "add",
    "addFromOrder",
    "blacklist",
    "foreman",
    "message",
    "history",
    "invite",
    "remove",
    "removeFine",
];

export const STATUS_CONFIG: Record<StatusKey, StatusConfig> = {
    recruitment: {
        key: "recruitment",
        path: "/shifts/recruitment",
        navLabel: "В наборе",
        badge: { label: "В наборе", tone: "amber" },
        actions: FULL_ACTIONS,
        actionsAlign: "left",
        columns: WITH_RATING,
        tintedRows: false,
    },
    "in-work": {
        key: "in-work",
        path: "/shifts/in-work",
        navLabel: "В работе",
        badge: { label: "В работе", tone: "green" },
        actions: FULL_ACTIONS,
        actionsAlign: "left",
        columns: WITH_RATING,
        tintedRows: false,
        // Бригада уже набрана, поэтому «Готов» здесь погашен до выбора строк.
        extraNeedsSelection: ["ready"],
    },
    "under-approval": {
        key: "under-approval",
        path: "/shifts/under-approval",
        navLabel: "На согласовании",
        badge: { label: "На согласовании", tone: "blue" },
        actions: [
            "add",
            "addFromOrder",
            "blacklist",
            "message",
            "history",
            "remove",
            "removeFine",
        ],
        actionsAlign: "left",
        columns: ["select", "id", "name", "phone", "output", "surcharge", "amount", "total"],
        tintedRows: true,
        editableRows: true,
    },
    "in-payment": {
        key: "in-payment",
        path: "/shifts/in-payment",
        navLabel: "В оплате",
        badge: { label: "В оплате", tone: "amber" },
        actions: ["pay", "refund", "blacklist", "history"],
        actionsAlign: "right",
        columns: [
            "select",
            "id",
            "name",
            "kaspi",
            "output",
            "surcharge",
            "amount",
            "total",
            "avr",
            "receipt",
            "payment",
        ],
        tintedRows: true,
    },
    archive: {
        key: "archive",
        path: "/shifts/archive",
        navLabel: "Архив",
        badge: { label: "Архив", tone: "gray" },
        actions: ["blacklist", "history"],
        actionsAlign: "right",
        columns: [
            "select",
            "id",
            "name",
            "phone",
            "output",
            "amount",
            "surcharge",
            "total",
            "wallet",
            "avr",
            "receipt",
            "payment",
        ],
        tintedRows: true,
    },
    cancelled: {
        key: "cancelled",
        path: "/shifts/cancelled",
        navLabel: "Отмененные",
        badge: { label: "Отмененные", tone: "plain" },
        actions: [],
        actionsAlign: "left",
        // Отмена разбирать некого — чекбоксов в оригинале нет.
        columns: [
            "id",
            "name",
            "phone",
            "output",
            "amount",
            "surcharge",
            "total",
            "wallet",
            "payment",
        ],
        tintedRows: false,
    },
};

/** Порядок подпунктов «Заказы» в боковом меню. */
export const STATUS_ORDER: StatusKey[] = [
    "recruitment",
    "in-work",
    "under-approval",
    "in-payment",
    "archive",
    "cancelled",
];
