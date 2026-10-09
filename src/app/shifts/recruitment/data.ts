/**
 * Данные страницы «Заказы → В наборе» — расшифровка скриншота боевого ERP
 * (teoserp.kz/shifts/recruitment).
 *
 * Номера заявок, компания, адреса, объекты, даты, ставки и суммы перенесены
 * как есть. ФИО и телефоны исполнителей заменены на синтетические того же
 * формата: это персональные данные реальных людей, а репозиторий публичный.
 * Формат строки, длина и раскладка колонок не изменились.
 */

export interface Executor {
    id: number;
    name: string;
    phone: string;
    citizenship: string;
    rating: number;
    status: string;
}

export interface OrderRequest {
    /** Номер заявки в шапке карточки. */
    number: number;
    company: string;
    status: string;
    title: string;
    phone: string;
    address: string;
    facility: string;
    /** Набрано из требуемого: «2/2», «3/5». */
    filled: number;
    required: number;
    reserve: number;
    /** Сколько исполнителей вышли; при значении больше нуля — ссылка. */
    attended: number;
    date: string;
    timeFrom: string;
    timeTo: string;
    rate: string;
    total: string;
    executors: Executor[];
}

export const ORDERS: OrderRequest[] = [
    {
        number: 27597,
        company: "ТОО ЗАММЛЕР КАЗАХСТАН",
        status: "В наборе",
        title: "Грузчик самозанятый - БАЗОВЫЙ СЗ 12 - Самозанятый",
        phone: "+7 (121) 212 12 12",
        address: "улица Талант, 40Б, Алматы, Казахстан",
        facility:
            "ЗАММЛЕР КАЗАХСТАН г. Алматы ул. Таланта 40 Б Грузовой Хаб (Бывший Хаб Суюнбая 258/4)",
        filled: 2,
        required: 2,
        reserve: 0,
        attended: 0,
        date: "09.10.2026",
        timeFrom: "20:00",
        timeTo: "08:00",
        rate: "1 184 ₸",
        total: "13 024 ₸",
        executors: [
            {
                id: 19590,
                name: "ИСПОЛНИТЕЛЬ ПЕРВЫЙ",
                phone: "+7 (700) 000-00-01",
                citizenship: "Казахстан",
                rating: 0,
                status: "",
            },
            {
                id: 16063,
                name: "ИСПОЛНИТЕЛЬ ВТОРОЙ",
                phone: "+7 (700) 000-00-02",
                citizenship: "Казахстан",
                rating: 0,
                status: "",
            },
        ],
    },
    {
        number: 27599,
        company: "ТОО ЗАММЛЕР КАЗАХСТАН",
        status: "В наборе",
        title: "Грузчик самозанятый - БАЗОВЫЙ СЗ 12 - Самозанятый",
        phone: "+7 (121) 212 11 22",
        address: "улица Талант, 40Б, Алматы, Казахстан",
        facility:
            "ЗАММЛЕР КАЗАХСТАН г. Алматы ул. Таланта 40/7 Почтовый Хаб (Бывший Нефтебаза 40а)",
        filled: 3,
        required: 5,
        reserve: 0,
        attended: 2,
        date: "09.10.2026",
        timeFrom: "20:00",
        timeTo: "08:00",
        rate: "1 137 ₸",
        total: "12 507 ₸",
        executors: [
            {
                id: 20309,
                name: "ИСПОЛНИТЕЛЬ ТРЕТИЙ",
                phone: "+7 (700) 000-00-03",
                citizenship: "Казахстан",
                rating: 0,
                status: "",
            },
            {
                id: 13681,
                name: "ИСПОЛНИТЕЛЬ ЧЕТВЁРТЫЙ",
                phone: "+7 (700) 000-00-04",
                citizenship: "Казахстан",
                rating: 0.5,
                status: "",
            },
            {
                id: 31966,
                name: "ИСПОЛНИТЕЛЬ ПЯТЫЙ",
                phone: "+7 (700) 000-00-05",
                citizenship: "Казахстан",
                rating: 0,
                status: "",
            },
        ],
    },
];

export const ACCOUNT = {
    balance: "7 717 835,00 ₸",
    commission: "385 891,75 ₸",
    role: "SUPER ADMIN",
    phone: "+7 (777) 200-00-00",
} as const;
