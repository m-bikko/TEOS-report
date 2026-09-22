import { ArrowUpRight } from "lucide-react";

/**
 * Указатель стенда. Единственная задача страницы — за один взгляд показать,
 * что на стенде есть, и увести на нужную страницу в новой вкладке, чтобы
 * сам указатель оставался открытым во время обхода.
 *
 * Серверный компонент: ни состояния, ни эффектов — всё движение на CSS.
 */

interface Entry {
    path: string;
    title: string;
    note: string;
    tag?: string;
}

interface Section {
    label: string;
    caption: string;
    accent: string;
    entries: Entry[];
}

const SECTIONS: Section[] = [
    {
        label: "Дашборды",
        caption: "Рабочие страницы на реальных данных",
        accent: "#4a9dff",
        entries: [
            {
                path: "/dashboard",
                title: "Дашборд по сменам",
                note: "Фильтры по периоду, компании, городу и тарифу. KPI, графики и вкладка «Пользователи». Данные подтягиваются через API.",
            },
            {
                path: "/v2",
                title: "Аналитика V2",
                note: "Четыре среза: воронка, финансы, партнёры, вакансии. Общая панель фильтров, датасеты из second-part/.",
            },
        ],
    },
    {
        label: "Витрины графиков",
        caption: "Прототипы на детерминированных моках с образцом ответа бэкенда",
        accent: "#f4b942",
        entries: [
            {
                path: "/demo",
                title: "Воронка смен",
                note: "График воронки плюс KPI-ряд. Рядом лежит пример JSON и выгрузка исходников.",
            },
            {
                path: "/demo-2",
                title: "Заказы и записи",
                note: "Заказы по дням и статусам, записи на заказ с разделением organic / operator и линией АВР.",
            },
            {
                path: "/demo-3",
                title: "Выплаты партнёрам",
                note: "Суммы по каналам ГПХ и Prosper, разбивка по партнёрам, сводка по среднему платежу.",
            },
        ],
    },
    {
        label: "Техподдержка",
        caption: "Сквозной прототип: дерево вопросов, чат, канбан оператора",
        accent: "#45d483",
        entries: [
            {
                path: "/support-mobile",
                title: "Мобильные экраны",
                note: "Шаги дерева частых вопросов покадрово и живое демо — по дереву можно кликать на любую глубину.",
                tag: "интерактив",
            },
            {
                path: "/support-chat-builder",
                title: "Конструктор дерева чата",
                note: "Сборка дерева в ERP: перетаскивание узлов, редактор, превью в телефоне, версии, импорт-экспорт.",
                tag: "интерактив",
            },
            {
                path: "/support-admin",
                title: "Канбан оператора",
                note: "Доска обращений, модалы чата, секундомеры, метрика решённых автоответом.",
            },
            {
                path: "/support-user",
                title: "Кабинет клиента B2B",
                note: "Список обращений, чат, закрытое обращение только на чтение, форма создания.",
            },
        ],
    },
];

const TOTAL = SECTIONS.reduce((sum, s) => sum + s.entries.length, 0);

export default function HubPage() {
    // Сквозная нумерация строк и общий счётчик каскада появления.
    let index = 0;
    let step = 0;

    return (
        <div className="hub">
            <div className="mx-auto max-w-[1180px] px-6 sm:px-10 pb-24">
                <header className="pt-20 sm:pt-28 pb-14 sm:pb-20">
                    <div className="hub-rise" style={{ "--i": step++ } as React.CSSProperties}>
                        <div className="hub-mono text-[11px] tracking-[0.42em] uppercase text-[#7a776f]">
                            TEOS · демо-стенд
                        </div>
                    </div>

                    <h1
                        className="hub-display hub-rise mt-7 font-light leading-[0.88] tracking-[-0.03em] text-[clamp(3.2rem,11vw,8.5rem)]"
                        style={{ "--i": step++ } as React.CSSProperties}
                    >
                        Указатель
                    </h1>

                    <div
                        className="hub-rise mt-10 grid gap-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
                        style={{ "--i": step++ } as React.CSSProperties}
                    >
                        <p className="max-w-[46ch] text-[15px] leading-relaxed text-[#a3a099]">
                            Дашборды по сменам и финансам, витрины отдельных графиков и сквозной
                            прототип техподдержки. Каждая ссылка открывается в новой вкладке —
                            указатель остаётся под рукой.
                        </p>

                        <dl className="hub-mono grid grid-cols-2 gap-x-10 gap-y-3 text-[11px] sm:text-right">
                            <dt className="text-[#7a776f] uppercase tracking-[0.18em]">страниц</dt>
                            <dd className="tabular-nums">{TOTAL}</dd>
                            <dt className="text-[#7a776f] uppercase tracking-[0.18em]">разделов</dt>
                            <dd className="tabular-nums">{SECTIONS.length}</dd>
                            <dt className="text-[#7a776f] uppercase tracking-[0.18em]">префиксы</dt>
                            <dd>/ru /en → /</dd>
                        </dl>
                    </div>
                </header>

                <main className="space-y-16 sm:space-y-20">
                    {SECTIONS.map((section) => (
                        <section key={section.label}>
                            <div
                                className="hub-rise flex flex-wrap items-baseline gap-x-5 gap-y-1 pb-5"
                                style={{ "--i": step++ } as React.CSSProperties}
                            >
                                <h2 className="hub-display text-[15px] font-medium tracking-[0.02em]">
                                    <span
                                        aria-hidden
                                        className="mr-3 inline-block h-[7px] w-[7px] translate-y-[-2px] rounded-full"
                                        style={{ backgroundColor: section.accent }}
                                    />
                                    {section.label}
                                </h2>
                                <p className="hub-mono text-[11px] text-[#7a776f]">{section.caption}</p>
                            </div>

                            <ul
                                className="border-b border-[#26251f]"
                                style={{ "--hub-accent": section.accent } as React.CSSProperties}
                            >
                                {section.entries.map((entry) => {
                                    index += 1;
                                    const number = String(index).padStart(2, "0");

                                    return (
                                        <li
                                            key={entry.path}
                                            className="hub-rise"
                                            style={{ "--i": step++ } as React.CSSProperties}
                                        >
                                            <a
                                                href={entry.path}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hub-row grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-5 sm:gap-x-9 px-1 sm:px-3 py-6 sm:py-7"
                                            >
                                                <span
                                                    aria-hidden
                                                    className="hub-index select-none text-[26px] sm:text-[38px] font-light leading-none tabular-nums"
                                                >
                                                    {number}
                                                </span>

                                                <span className="min-w-0">
                                                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                                                        <span className="hub-display text-[17px] sm:text-[21px] font-normal tracking-[-0.01em]">
                                                            {entry.title}
                                                        </span>
                                                        {entry.tag && (
                                                            <span
                                                                className="hub-mono rounded-full border px-2 py-[2px] text-[9px] uppercase tracking-[0.16em]"
                                                                style={{
                                                                    borderColor: `${section.accent}44`,
                                                                    color: section.accent,
                                                                }}
                                                            >
                                                                {entry.tag}
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="mt-2.5 block max-w-[62ch] text-[13.5px] leading-relaxed text-[#8d8a83]">
                                                        {entry.note}
                                                    </span>
                                                    <span className="hub-path hub-mono mt-3 block text-[11px] text-[#7a776f] transition-colors duration-200 sm:hidden">
                                                        {entry.path}
                                                    </span>
                                                </span>

                                                <span className="flex items-center gap-4 sm:gap-6 pt-1">
                                                    <span className="hub-path hub-mono hidden text-[12px] text-[#7a776f] transition-colors duration-200 sm:block">
                                                        {entry.path}
                                                    </span>
                                                    <ArrowUpRight className="hub-arrow h-[18px] w-[18px] shrink-0" />
                                                </span>
                                            </a>
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    ))}
                </main>

                <footer
                    className="hub-rise hub-mono mt-20 border-t border-[#26251f] pt-7 text-[11px] leading-relaxed text-[#7a776f]"
                    style={{ "--i": step++ } as React.CSSProperties}
                >
                    <p>
                        Локализованных роутов здесь нет. Адреса с префиксом — /ru/v2, /en/support-admin —
                        редиректят на страницу без префикса, так что 404 не будет.
                    </p>
                    <p className="mt-2">
                        Документация: docs/SUPPORT_CHAT_TREE_GUIDE.md · docs/DEMO_2_GUIDE.md ·
                        docs/DEMO_3_GUIDE.md · docs/FUNNEL_CHART_GUIDE.md
                    </p>
                </footer>
            </div>
        </div>
    );
}
