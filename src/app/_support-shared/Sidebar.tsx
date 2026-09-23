"use client";

/**
 * Sidebar web-ERP TEOS для демо-страниц техподдержки.
 * Оформление по брендбуку и скриншотам ERP: белая подложка, синий #3563e9
 * на активном пункте, вложенный уровень пилюлей.
 *
 * Логотип намеренно не перерисован: брендбук требует использовать поставляемый
 * Logo.svg как есть. До того как файл положат в public/, здесь нейтральная
 * плитка-заглушка.
 */

import {
    Box,
    Users,
    UserCog,
    Briefcase,
    ShoppingCart,
    UserSquare,
    HardHat,
    ClipboardList,
    BookOpen,
    LineChart,
    FileText,
    Bell,
    Wallet,
    FolderOpen,
    LifeBuoy,
} from "lucide-react";

interface MenuItem {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    badge?: number;
    children?: { label: string; active?: boolean; badge?: number }[];
}

interface Props {
    activeKey?: "user-support" | "admin-support" | "chat-builder";
}

export function Sidebar({ activeKey }: Props) {
    const isUserView = activeKey === "user-support";
    const isAdminView = activeKey === "admin-support";
    const isBuilderView = activeKey === "chat-builder";

    const supportChildren = isAdminView
        ? [
              { label: "Канбан", active: true },
              { label: "Архив" },
              { label: "Метрики" },
              { label: "Конструктор чата" },
          ]
        : isBuilderView
          ? [
                { label: "Канбан" },
                { label: "Архив" },
                { label: "Метрики" },
                { label: "Конструктор чата", active: true },
            ]
          : isUserView
            ? [{ label: "Мои обращения", active: true }, { label: "Создать" }]
            : undefined;

    const items: MenuItem[] = [
        { icon: <ClipboardList className="h-[18px] w-[18px]" />, label: "Заявки" },
        { icon: <ShoppingCart className="h-[18px] w-[18px]" />, label: "Заказы" },
        { icon: <Briefcase className="h-[18px] w-[18px]" />, label: "Франчайзи" },
        { icon: <Users className="h-[18px] w-[18px]" />, label: "Партнеры" },
        { icon: <UserSquare className="h-[18px] w-[18px]" />, label: "Клиенты" },
        { icon: <HardHat className="h-[18px] w-[18px]" />, label: "Исполнители" },
        { icon: <UserCog className="h-[18px] w-[18px]" />, label: "Пользователи" },
        { icon: <BookOpen className="h-[18px] w-[18px]" />, label: "Табели" },
        { icon: <BookOpen className="h-[18px] w-[18px]" />, label: "Справочники" },
        { icon: <LineChart className="h-[18px] w-[18px]" />, label: "Аналитика" },
        { icon: <FileText className="h-[18px] w-[18px]" />, label: "Отчёты" },
        {
            icon: <LifeBuoy className="h-[18px] w-[18px]" />,
            label: "Техподдержка",
            active: isAdminView || isUserView || isBuilderView,
            badge: isAdminView ? 3 : undefined,
            children: supportChildren,
        },
        { icon: <Bell className="h-[18px] w-[18px]" />, label: "Новости" },
        { icon: <Wallet className="h-[18px] w-[18px]" />, label: "Казначейство" },
        { icon: <FolderOpen className="h-[18px] w-[18px]" />, label: "Документы" },
    ];

    return (
        <aside className="flex min-h-screen w-[230px] shrink-0 flex-col border-r border-[#e6e8ec] bg-white font-sans">
            {/* Логотип — заглушка под TEOS/Logo.svg */}
            <div className="border-b border-[#e6e8ec] px-5 py-4">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3563e9]">
                        <Box className="h-4 w-4 text-white" />
                    </span>
                    <span className="text-[17px] font-bold tracking-tight text-[#222222]">TEOS</span>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-2">
                {items.map((it) => (
                    <div key={it.label}>
                        <button
                            type="button"
                            className={`flex w-full items-center gap-2.5 px-5 py-2.5 text-left text-[13px] transition-colors ${
                                it.active
                                    ? "font-semibold text-[#3563e9]"
                                    : "text-[#5d646d] hover:bg-[#f6f7f9] hover:text-[#222222]"
                            }`}
                        >
                            <span className={it.active ? "text-[#3563e9]" : "text-[#8a9099]"}>
                                {it.icon}
                            </span>
                            <span className="flex-1">{it.label}</span>
                            {it.badge != null && (
                                <span className="rounded-full bg-[#ec2d30] px-1.5 py-0.5 text-[10px] font-bold text-white">
                                    {it.badge}
                                </span>
                            )}
                        </button>

                        {it.children && (
                            <div className="space-y-0.5 px-3 pb-1">
                                {it.children.map((c) => (
                                    <button
                                        key={c.label}
                                        type="button"
                                        className={`flex w-full items-center justify-between rounded-lg px-6 py-2 text-left text-[12.5px] transition-colors ${
                                            c.active
                                                ? "bg-[#e8eefc] font-semibold text-[#3563e9]"
                                                : "text-[#8a9099] hover:bg-[#f6f7f9] hover:text-[#222222]"
                                        }`}
                                    >
                                        <span>{c.label}</span>
                                        {c.badge != null && (
                                            <span className="rounded-full bg-[#ec2d30] px-1.5 py-0.5 text-[10px] font-bold text-white">
                                                {c.badge}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </nav>

            <div className="m-3 rounded-xl bg-[#07bb4f] p-3.5 text-[12px] text-white">
                <div className="mb-1 font-bold">Техническая поддержка</div>
                <div className="opacity-90">+7 (707) 741-89-65</div>
                <div className="opacity-90">support@teos.kz</div>
            </div>
        </aside>
    );
}
