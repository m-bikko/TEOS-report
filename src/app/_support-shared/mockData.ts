/**
 * Shared mock data for support demo pages (/support-mobile, /support-user, /support-admin).
 * Детерминированный, без внешних вызовов.
 */

export type TicketStatus = "waiting" | "in_progress" | "closed";
export type TicketCategory = "b2b" | "executor";
export type MessageAuthor = "user" | "support";
export type AttachmentKind = "file" | "image" | "link";

export interface Attachment {
    kind: AttachmentKind;
    name: string;
    size?: string;
    url?: string;
}

export interface ChatMessage {
    id: number;
    ticketId: number;
    author: MessageAuthor;
    authorName: string;
    text: string;
    timestamp: string; // ISO
    attachments?: Attachment[];
}

export interface Ticket {
    id: number;
    number: string; // "T-2843"
    title: string;
    category: TicketCategory;
    status: TicketStatus;
    userName: string;
    userPhone: string;
    userCompany?: string;
    createdAt: string;
    /** когда статус стал текущим (для секундомера) */
    statusChangedAt: string;
    /** когда закрыт (только если status = closed) */
    closedAt?: string;
    lastMessage: string;
    unreadForAdmin: number;
    /** История переходов статусов для метрик карточки */
    history: { status: TicketStatus; at: string }[];
    messages: ChatMessage[];
}

export const STATUS_LABEL: Record<TicketStatus, string> = {
    waiting: "Ожидает ответа",
    in_progress: "В работе",
    closed: "Закрыто",
};

export const STATUS_COLOR: Record<TicketStatus, string> = {
    waiting: "#F4B942",
    in_progress: "#2563EB",
    closed: "#3AA76D",
};

export const CATEGORY_LABEL: Record<TicketCategory, string> = {
    b2b: "B2B",
    executor: "Исполнитель",
};

export const CATEGORY_COLOR: Record<TicketCategory, string> = {
    b2b: "#6B007B",
    executor: "#2FACAD",
};

/** Псевдо-«сейчас» для стабильности рендера. В проде — new Date() */
export const NOW = "2026-06-25T14:32:00Z";

function iso(daysAgo: number, hoursAgo = 0, minutesAgo = 0): string {
    const base = new Date(NOW).getTime();
    const off = daysAgo * 86_400_000 + hoursAgo * 3_600_000 + minutesAgo * 60_000;
    return new Date(base - off).toISOString();
}

export const TICKETS: Ticket[] = [
    {
        id: 1,
        number: "T-2843",
        title: "Не проходит оплата через Prosper Pay",
        category: "b2b",
        status: "waiting",
        userName: "Иван Иванов",
        userPhone: "+7 (701) 554-44-54",
        userCompany: 'ТОО «ЮниГрупп»',
        createdAt: iso(0, 0, 34),
        statusChangedAt: iso(0, 0, 34),
        lastMessage: "Здравствуйте! У нас с 10:00 не проходят выплаты через Prosper. Помогите!",
        unreadForAdmin: 2,
        history: [{ status: "waiting", at: iso(0, 0, 34) }],
        messages: [
            {
                id: 1,
                ticketId: 1,
                author: "user",
                authorName: "Иван Иванов",
                text: "Здравствуйте! У нас с 10:00 не проходят выплаты через Prosper. Помогите!",
                timestamp: iso(0, 0, 34),
            },
            {
                id: 2,
                ticketId: 1,
                author: "user",
                authorName: "Иван Иванов",
                text: "Прикладываю скриншот ошибки",
                timestamp: iso(0, 0, 32),
                attachments: [
                    { kind: "image", name: "error-prosper.png", size: "148 КБ" },
                ],
            },
        ],
    },
    {
        id: 2,
        number: "T-2842",
        title: "Как подписать АВР за смену",
        category: "executor",
        status: "waiting",
        userName: "Марленов Олжас",
        userPhone: "+7 (747) 996-00-68",
        createdAt: iso(0, 1, 12),
        statusChangedAt: iso(0, 1, 12),
        lastMessage: "Не могу найти где подписывать АВР в приложении",
        unreadForAdmin: 1,
        history: [{ status: "waiting", at: iso(0, 1, 12) }],
        messages: [
            {
                id: 3,
                ticketId: 2,
                author: "user",
                authorName: "Марленов Олжас",
                text: "Не могу найти где подписывать АВР в приложении",
                timestamp: iso(0, 1, 12),
            },
        ],
    },
    {
        id: 3,
        number: "T-2839",
        title: "Отклонена запись на смену «Грузчик»",
        category: "executor",
        status: "in_progress",
        userName: "Талгат Расулов",
        userPhone: "+7 (702) 271-16-40",
        createdAt: iso(0, 3, 20),
        statusChangedAt: iso(0, 1, 5),
        lastMessage: "Понял, спасибо! Ожидаю проверку.",
        unreadForAdmin: 0,
        history: [
            { status: "waiting", at: iso(0, 3, 20) },
            { status: "in_progress", at: iso(0, 1, 5) },
        ],
        messages: [
            {
                id: 4,
                ticketId: 3,
                author: "user",
                authorName: "Талгат Расулов",
                text: "Здравствуйте, отклонили запись на смену. Не понимаю почему.",
                timestamp: iso(0, 3, 20),
            },
            {
                id: 5,
                ticketId: 3,
                author: "support",
                authorName: "Айгуль (техподдержка)",
                text: "Здравствуйте! Сейчас проверю причину. Одну минуту.",
                timestamp: iso(0, 1, 12),
            },
            {
                id: 6,
                ticketId: 3,
                author: "support",
                authorName: "Айгуль (техподдержка)",
                text: "Похоже, санкнижка просрочена. Обновите её в профиле и перезапишитесь.",
                timestamp: iso(0, 1, 8),
                attachments: [
                    { kind: "link", name: "Инструкция по обновлению санкнижки", url: "#" },
                ],
            },
            {
                id: 7,
                ticketId: 3,
                author: "user",
                authorName: "Талгат Расулов",
                text: "Понял, спасибо! Ожидаю проверку.",
                timestamp: iso(0, 1, 5),
            },
        ],
    },
    {
        id: 4,
        number: "T-2830",
        title: "Ошибка при экспорте отчёта по выплатам",
        category: "b2b",
        status: "in_progress",
        userName: "Максутова Альмира",
        userPhone: "+7 (777) 512-33-40",
        userCompany: 'ТОО «Казпочта»',
        createdAt: iso(1, 4),
        statusChangedAt: iso(0, 5),
        lastMessage: "Разработчики уже смотрят, ответим до конца дня.",
        unreadForAdmin: 0,
        history: [
            { status: "waiting", at: iso(1, 4) },
            { status: "in_progress", at: iso(0, 5) },
        ],
        messages: [
            {
                id: 8,
                ticketId: 4,
                author: "user",
                authorName: "Максутова Альмира",
                text: "При экспорте XLSX падает с 500 ошибкой. Файл нужен для бухгалтерии срочно.",
                timestamp: iso(1, 4),
                attachments: [
                    { kind: "file", name: "export-error.log", size: "12 КБ" },
                ],
            },
            {
                id: 9,
                ticketId: 4,
                author: "support",
                authorName: "Айгуль (техподдержка)",
                text: "Приняли в работу. Разработчики уже смотрят, ответим до конца дня.",
                timestamp: iso(0, 5),
            },
        ],
    },
    {
        id: 5,
        number: "T-2810",
        title: "Не пришло начисление за смену от 21.06",
        category: "executor",
        status: "closed",
        userName: "Стасов Иван",
        userPhone: "+7 (700) 541-00-01",
        createdAt: iso(3, 6),
        statusChangedAt: iso(2, 4),
        closedAt: iso(2, 4),
        lastMessage: "Начисление зачислили, обращение закрыто.",
        unreadForAdmin: 0,
        history: [
            { status: "waiting", at: iso(3, 6) },
            { status: "in_progress", at: iso(3, 2) },
            { status: "closed", at: iso(2, 4) },
        ],
        messages: [
            {
                id: 10,
                ticketId: 5,
                author: "user",
                authorName: "Стасов Иван",
                text: "Здравствуйте, за смену 21.06 не пришли деньги. Смена в архиве, но начисления нет.",
                timestamp: iso(3, 6),
            },
            {
                id: 11,
                ticketId: 5,
                author: "support",
                authorName: "Айгуль (техподдержка)",
                text: "Здравствуйте! Смотрим, вернёмся с ответом.",
                timestamp: iso(3, 2),
            },
            {
                id: 12,
                ticketId: 5,
                author: "support",
                authorName: "Айгуль (техподдержка)",
                text: "Начисление зачислили, обращение закрыто.",
                timestamp: iso(2, 4),
            },
        ],
    },
    {
        id: 6,
        number: "T-2805",
        title: "Просьба добавить нового пользователя-менеджера",
        category: "b2b",
        status: "closed",
        userName: "Петров Николай",
        userPhone: "+7 (777) 999-11-22",
        userCompany: 'ТОО «KEGOC»',
        createdAt: iso(5),
        statusChangedAt: iso(4, 3),
        closedAt: iso(4, 3),
        lastMessage: "Пользователь добавлен, спасибо!",
        unreadForAdmin: 0,
        history: [
            { status: "waiting", at: iso(5) },
            { status: "in_progress", at: iso(4, 20) },
            { status: "closed", at: iso(4, 3) },
        ],
        messages: [
            {
                id: 13,
                ticketId: 6,
                author: "user",
                authorName: "Петров Николай",
                text: "Добавьте, пожалуйста, менеджера manager2@kegoc.kz с доступом к смене.",
                timestamp: iso(5),
            },
            {
                id: 14,
                ticketId: 6,
                author: "support",
                authorName: "Айгуль (техподдержка)",
                text: "Добавили, доступ выдали. Пусть проверит вход по ссылке.",
                timestamp: iso(4, 3),
            },
            {
                id: 15,
                ticketId: 6,
                author: "user",
                authorName: "Петров Николай",
                text: "Пользователь добавлен, спасибо!",
                timestamp: iso(4, 3),
            },
        ],
    },
];

// ═══════════════════════════════════════════════════════════════════════
// Time helpers
// ═══════════════════════════════════════════════════════════════════════

export function formatElapsed(fromIso: string, toIso: string = NOW): string {
    const from = new Date(fromIso).getTime();
    const to = new Date(toIso).getTime();
    const ms = Math.max(0, to - from);
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}ч ${m}м`;
    if (m > 0) return `${m}м ${s.toString().padStart(2, "0")}с`;
    return `${s}с`;
}

export function formatShortTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Средняя длительность закрытых тикетов (createdAt → closedAt) */
export function computeAvgCloseTime(tickets: Ticket[]): { hours: number; label: string } {
    const closed = tickets.filter((t) => t.status === "closed" && t.closedAt);
    if (closed.length === 0) return { hours: 0, label: "—" };
    let totalMs = 0;
    for (const t of closed) {
        const from = new Date(t.createdAt).getTime();
        const to = new Date(t.closedAt!).getTime();
        totalMs += Math.max(0, to - from);
    }
    const avgMs = totalMs / closed.length;
    const hours = avgMs / 3_600_000;
    if (hours >= 24) return { hours, label: `${(hours / 24).toFixed(1)} дн` };
    if (hours >= 1) return { hours, label: `${hours.toFixed(1)} ч` };
    return { hours, label: `${Math.round(avgMs / 60_000)} мин` };
}
