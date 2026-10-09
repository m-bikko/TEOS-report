/**
 * Расшифровка скриншотов раздела «Заказы» боевого ERP (teoserp.kz/shifts/*).
 *
 * Номера заявок, компании, адреса, объекты, даты, времена, ставки, суммы,
 * выработка, статусы АВР и оплаты перенесены как есть. ФИО, телефоны
 * исполнителей и номера Kaspi Gold заменены на синтетические того же формата:
 * это персональные данные реальных людей, а репозиторий публичный.
 */

import type { Executor, Order, Pill, StatusKey } from "./types";

export const ACCOUNT = {
    balance: "10 823 252,00 ₸",
    commission: "541 162,60 ₸",
    role: "SUPER ADMIN",
    phone: "+7 (777) 200-00-00",
} as const;

const READY: Pill = { label: "Готов", tone: "green" };
const SIGNED: Pill = { label: "Подписан исполнителем", tone: "green" };
const UNSIGNED: Pill = { label: "Не подписан", tone: "amber" };
const OK: Pill = { label: "Успешно", tone: "green" };
const FAILED: Pill = { label: "Не успешно", tone: "red" };
const AWAITING: Pill = { label: "Ожидается оплата", tone: "amber" };

/** Синтетическое ФИО вместо настоящего, порядковый номер в пределах страницы. */
const NAMES = [
    "ИСПОЛНИТЕЛЬ ПЕРВЫЙ",
    "ИСПОЛНИТЕЛЬ ВТОРОЙ",
    "ИСПОЛНИТЕЛЬ ТРЕТИЙ",
    "ИСПОЛНИТЕЛЬ ЧЕТВЁРТЫЙ",
    "ИСПОЛНИТЕЛЬ ПЯТЫЙ",
    "ИСПОЛНИТЕЛЬ ШЕСТОЙ",
] as const;

const person = (n: number): { name: string; phone: string } => ({
    name: NAMES[n - 1],
    phone: `+7 (700) 000-00-0${n}`,
});

// ═══════════════════════════════════════════════════════════════════════
// В наборе
// ═══════════════════════════════════════════════════════════════════════

const RECRUITMENT: Order[] = [
    {
        number: 27597,
        company: "ТОО ЗАММЛЕР КАЗАХСТАН",
        title: "Грузчик самозанятый - БАЗОВЫЙ СЗ 12 - Самозанятый",
        phone: "+7 (121) 212 12 12",
        address: "улица Талант, 40Б, Алматы, Казахстан",
        facility:
            "ЗАММЛЕР КАЗАХСТАН г. Алматы ул. Таланта 40 Б Грузовой Хаб (Бывший Хаб Суюнбая 258/4)",
        headerIcons: ["edit", "share"],
        buttons: ["start"],
        filled: 2,
        required: 2,
        reserve: 1,
        attended: 0,
        date: "09.10.2026",
        timeFrom: "20:00",
        timeTo: "08:00",
        rate: "1 184 ₸",
        total: "13 024 ₸",
        executors: [
            { id: 19590, ...person(1), citizenship: "Казахстан", rating: 0.3, status: READY },
            { id: 16063, ...person(2), citizenship: "Казахстан", rating: 0 },
        ],
    },
    {
        number: 27599,
        company: "ТОО ЗАММЛЕР КАЗАХСТАН",
        title: "Грузчик самозанятый - БАЗОВЫЙ СЗ 12 - Самозанятый",
        phone: "+7 (121) 212 11 22",
        address: "улица Талант, 40Б, Алматы, Казахстан",
        facility:
            "ЗАММЛЕР КАЗАХСТАН г. Алматы ул. Таланта 40/7 Почтовый Хаб (Бывший Нефтебаза 40а)",
        headerIcons: ["edit", "share"],
        buttons: ["start"],
        filled: 4,
        required: 5,
        reserve: 0,
        attended: 2,
        date: "09.10.2026",
        timeFrom: "20:00",
        timeTo: "08:00",
        rate: "1 137 ₸",
        total: "12 507 ₸",
        executors: [
            { id: 20309, ...person(1), citizenship: "Казахстан", rating: 0 },
            { id: 13681, ...person(2), citizenship: "Казахстан", rating: 0.5 },
            { id: 31966, ...person(3), citizenship: "Казахстан", rating: 0, status: READY },
            { id: 27340, ...person(4), citizenship: "Казахстан", rating: 6.9 },
        ],
    },
];

// ═══════════════════════════════════════════════════════════════════════
// В работе
// ═══════════════════════════════════════════════════════════════════════

const IN_WORK: Order[] = [
    {
        number: 26151,
        company: "ТОО БЭСТ ПРАЙС КАЗАХСТАН",
        title: "Мерчендайзер самозанятый - МЕРЧЕНДАЙЗЕР СЗ 12 - Самозанятый",
        phone: "+7 (747) 403 07 39",
        address: "бульвар Гагарина, 18, Усть-Каменогорск, …",
        facility: "Бэст Прайс Казахстан ТОО г. УКА E9486 ул. Гагарина 18",
        headerIcons: ["edit", "share"],
        buttons: ["finish"],
        filled: 1,
        required: 1,
        reserve: 0,
        attended: 0,
        date: "09.10.2026",
        timeFrom: "09:00",
        timeTo: "21:00",
        rate: "1 231.1 ₸",
        total: "13 543 ₸",
        executors: [
            { id: 5551, ...person(1), citizenship: "Казахстан", rating: 9.9, status: READY },
        ],
    },
    {
        number: 27200,
        company: "ТОО JANA POST",
        title: "Грузчик самозанятый - СОРТИРОВЩИК СЗ 12 - Самозанятый",
        phone: "+7 (701) 378 80 76",
        address: "проспект Суюнбая, 258/4, Алматы, Казахст…",
        facility: "ЖАНА ПОСТ ТОО Jana Post в г. Алматы СУЮНБАЯ, 258/4",
        headerIcons: ["edit", "share"],
        buttons: ["finish"],
        filled: 3,
        required: 10,
        reserve: 0,
        attended: 1,
        date: "09.10.2026",
        timeFrom: "08:00",
        timeTo: "20:00",
        rate: "1 042 ₸",
        total: "11 462 ₸",
        executors: [
            { id: 7304, ...person(1), citizenship: "Казахстан", rating: 9.7, status: READY },
            // Гражданство у этой строки в оригинале пустое.
            { id: 9460, ...person(2), citizenship: "", rating: 9, status: READY },
            { id: 19333, ...person(3), citizenship: "Казахстан", rating: 8, status: READY },
        ],
    },
];

// ═══════════════════════════════════════════════════════════════════════
// На согласовании
// ═══════════════════════════════════════════════════════════════════════

const approvalRow = (id: number, n: number): Executor => ({
    id,
    ...person(n),
    output: "11:00",
    surcharge: "0 ₸",
    amount: "10 505 ₸",
    total: "10 505 ₸",
});

const UNDER_APPROVAL: Order[] = [
    {
        number: 150,
        company: "ФИЛИАЛ ТОО ПРИМА ДИСТРИБЬЮШН В ГОРОДЕ КОКШЕТАУ",
        title: "Грузчик - Грузчик 8 часовая - ГПХ",
        phone: "+7 (705) 594 13 60",
        address: "Кокшетау, Акмолинская область, Казахстан",
        facility: "ПРИМА ДИСТРИБЬЮШН\" в городе Кокшетау",
        headerIcons: ["edit"],
        buttons: ["toPaymentMuted", "attachLuvr", "downloadLuvr"],
        filled: 0,
        required: 1,
        reserve: 0,
        attended: 0,
        date: "06.10.2025",
        timeFrom: "08:00",
        rate: "1 071 ₸",
        total: "7 499 ₸",
        executors: [],
        totals: { hours: "00 ч. 00 мин.", sum: "0 ₸" },
    },
    {
        number: 1225,
        company: "ТОО SURAYA ФИЛИАЛ В Г.АЛМАТЫ",
        title: "Кухонный рабочий - РТЗ 12 часовая - ГПХ",
        phone: "+7 (707) 773 07 02",
        address: "микрорайон Самал-2, 111, Алматы, Казахст…",
        facility: "SURAYA ТОО г. Алматы ТРЦ Достык Плаза",
        headerIcons: ["edit"],
        buttons: ["toPaymentMuted", "attachLuvr"],
        filled: 2,
        required: 1,
        reserve: 0,
        attended: 0,
        date: "01.12.2025",
        timeFrom: "08:00",
        rate: "955 ₸",
        total: "10 505 ₸",
        executors: [approvalRow(7511, 1), approvalRow(5887, 2)],
        totals: { hours: "22 ч. 00 мин.", sum: "21 010 ₸" },
    },
];

// ═══════════════════════════════════════════════════════════════════════
// В оплате
// ═══════════════════════════════════════════════════════════════════════

const IN_PAYMENT: Order[] = [
    {
        number: 28632,
        company: "ФИЛИАЛ ТОО ПРИМА ДИСТРИБЬЮШН В ГОРОДЕ АСТАНА",
        title: "Грузчик самозанятый - Грузчик СЗ 9 - Самозанятый",
        phone: "+7 (705) 602 66 64",
        address: "трасса Астана - Караганда, 45/2, Астана,…",
        facility: "ФИЛИАЛ ТОО ПРИМА ДИСТРИБЬЮШН В ГОРОДЕ АСТАНА",
        headerIcons: [],
        buttons: ["toArchive", "toApproval", "downloadLuvr"],
        filled: 1,
        required: 1,
        reserve: 0,
        attended: 0,
        date: "09.10.2026",
        timeFrom: "08:00",
        timeTo: "17:00",
        rate: "1 302.17 ₸",
        total: "10 418 ₸",
        executors: [
            {
                id: 6146,
                name: NAMES[0],
                kaspi: "+7 (700) 000-00-01",
                output: "08:00",
                surcharge: "0 ₸",
                amount: "10 417 ₸",
                total: "10 417 ₸",
                avr: SIGNED,
                receipt: FAILED,
                payment: FAILED,
            },
        ],
        totals: { hours: "08 ч. 00 мин.", sum: "10 417 ₸" },
    },
    {
        number: 28631,
        company: "ТОО SARA LOGISTICS AND MOVING",
        title: "Грузчик самозанятый - Грузчик СЗ 9 часовая - Самозанятый",
        phone: "+7 (705) 602 66 64",
        address: "проспект Богенбай Батыра, 27, Астана, Ка…",
        facility: "SARA LOGISTICS AND MOVING ТОО г. Астана ул. Богенбай батыра 27",
        headerIcons: [],
        buttons: ["toArchive", "toApproval", "downloadLuvr"],
        filled: 2,
        required: 2,
        reserve: 0,
        attended: 0,
        date: "09.10.2026",
        timeFrom: "09:00",
        timeTo: "18:00",
        rate: "1 302.17 ₸",
        total: "10 418 ₸",
        executors: [
            {
                id: 27948,
                name: NAMES[0],
                kaspi: "+7 (700) 000-00-01",
                output: "08:00",
                surcharge: "0 ₸",
                amount: "10 417 ₸",
                total: "10 417 ₸",
                avr: SIGNED,
                receipt: OK,
                payment: OK,
            },
            {
                id: 30968,
                name: NAMES[1],
                kaspi: "+7 (700) 000-00-02",
                output: "08:00",
                surcharge: "0 ₸",
                amount: "10 417 ₸",
                total: "10 417 ₸",
                avr: UNSIGNED,
                receipt: AWAITING,
                payment: AWAITING,
            },
        ],
        totals: { hours: "16 ч. 00 мин.", sum: "20 834 ₸" },
    },
];

// ═══════════════════════════════════════════════════════════════════════
// Архив
// ═══════════════════════════════════════════════════════════════════════

const ARCHIVE: Order[] = [
    {
        number: 28635,
        company: "ТОО ДЕТСКИЙ МИР - КАЗАХСТАН",
        title: "Ртз - РТЗ смз 11 - Самозанятый",
        phone: "+7 (705) 626 05 77",
        address: "проспект Сакена Сейфуллина, 617, Алматы,…",
        facility: "Детский мир - Казахстан ТОО г.Алматы Forum 3009",
        headerIcons: [],
        buttons: ["toPayment", "downloadLuvr"],
        filled: 1,
        required: 1,
        reserve: 0,
        attended: 0,
        date: "09.10.2026",
        timeFrom: "10:00",
        timeTo: "21:00",
        rate: "1 250 ₸",
        total: "12 500 ₸",
        executors: [
            {
                id: 30351,
                ...person(1),
                output: "10:00",
                amount: "12 500 ₸",
                surcharge: "0 ₸",
                total: "12 500 ₸",
                wallet: "",
                avr: SIGNED,
                receipt: OK,
                payment: OK,
            },
        ],
        totals: { hours: "10 ч. 00 мин.", sum: "12 500 ₸" },
    },
    {
        number: 28558,
        company: "ТОО ECOMAF",
        title: "Разнорабочий - РАЗНОРАБОЧИЙ СЗ 10Ч - Самозанятый",
        phone: "+7 (700) 531 00 05",
        address: "улица Александра Пушкина, 52А, Астана, К…",
        facility: "ECOMAF ТОО",
        headerIcons: [],
        buttons: ["toPayment", "downloadLuvr"],
        filled: 1,
        required: 1,
        reserve: 0,
        attended: 0,
        date: "09.10.2026",
        timeFrom: "09:00",
        timeTo: "19:00",
        rate: "1 157.41 ₸",
        total: "10 417 ₸",
        executors: [
            {
                id: 5230,
                ...person(1),
                output: "09:00",
                amount: "10 417 ₸",
                surcharge: "0 ₸",
                total: "10 417 ₸",
                wallet: "",
                avr: SIGNED,
                receipt: OK,
                payment: OK,
            },
        ],
        totals: { hours: "09 ч. 00 мин.", sum: "10 417 ₸" },
    },
];

// ═══════════════════════════════════════════════════════════════════════
// Отмененные
// ═══════════════════════════════════════════════════════════════════════

const CANCELLED: Order[] = [
    {
        number: 28161,
        company: "ТОО «ЖЕТІ АСПАН»",
        title: "Ртз - РТЗ СЗ 12 - Самозанятый",
        phone: "+7 (707) 738 04 02",
        address: "Коргалжынское шоссе, 1, Астана, Казахста…",
        facility: "Жеті Аспан ТОО г. Астана ТРЦ Керуен Сити ул. Кургальжинское шоссе 1",
        headerIcons: [],
        buttons: [],
        filled: 0,
        required: 2,
        reserve: 0,
        attended: 0,
        date: "31.10.2026",
        timeFrom: "08:00",
        timeTo: "20:00",
        rate: "1 042 ₸",
        total: "11 462 ₸",
        executors: [],
        totals: { hours: "00 ч. 00 мин.", sum: "0 ₸" },
    },
    {
        number: 27930,
        company: "ФИЛИАЛТОО ПРИМА ДИСТРИБЬЮШН В Г.УРАЛЬСК",
        title: "Грузчик самозанятый - ГРУЗЧИК СЗ 9 - Самозанятый",
        phone: "+7 (707) 342 74 98",
        address: "улица Штыбы, 68, Уральск, Западно-Казахс…",
        facility: "Филиал Прима Дистрибьюшн в г.Уральск",
        headerIcons: [],
        buttons: [],
        filled: 0,
        required: 0,
        reserve: 0,
        attended: 0,
        date: "31.10.2026",
        timeFrom: "08:00",
        timeTo: "17:00",
        rate: "911.48 ₸",
        total: "7 292 ₸",
        executors: [],
        totals: { hours: "00 ч. 00 мин.", sum: "0 ₸" },
    },
];

export const ORDERS: Record<StatusKey, Order[]> = {
    recruitment: RECRUITMENT,
    "in-work": IN_WORK,
    "under-approval": UNDER_APPROVAL,
    "in-payment": IN_PAYMENT,
    archive: ARCHIVE,
    cancelled: CANCELLED,
};
