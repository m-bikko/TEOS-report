"use client";

/**
 * Sidebar-заглушка в стиле web-ERP TEOS для демо-страниц техподдержки.
 * НЕ является продовой версией — оригинальная разметка, повторяет только структуру
 * (лого сверху, список пунктов с иконками, активный state, виджет поддержки внизу).
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
    activeKey?: "user-support" | "admin-support";
}

export function Sidebar({ activeKey }: Props) {
    const isUserView = activeKey === "user-support";
    const isAdminView = activeKey === "admin-support";

    const items: MenuItem[] = [
        { icon: <ClipboardList className="h-4 w-4" />, label: "Заявки" },
        { icon: <ShoppingCart className="h-4 w-4" />, label: "Заказы" },
        { icon: <Briefcase className="h-4 w-4" />, label: "Франчайзи" },
        { icon: <Users className="h-4 w-4" />, label: "Партнеры" },
        { icon: <UserSquare className="h-4 w-4" />, label: "Клиенты" },
        { icon: <HardHat className="h-4 w-4" />, label: "Исполнители" },
        { icon: <UserCog className="h-4 w-4" />, label: "Пользователи" },
        { icon: <BookOpen className="h-4 w-4" />, label: "Табели" },
        { icon: <BookOpen className="h-4 w-4" />, label: "Справочники" },
        { icon: <LineChart className="h-4 w-4" />, label: "Аналитика" },
        { icon: <FileText className="h-4 w-4" />, label: "Отчёты" },
        {
            icon: <LifeBuoy className="h-4 w-4" />,
            label: "Техподдержка",
            active: isAdminView || isUserView,
            badge: isAdminView ? 3 : undefined,
            children: isAdminView
                ? [
                    { label: "Канбан", active: true },
                    { label: "Архив" },
                    { label: "Метрики" },
                ]
                : isUserView
                    ? [
                        { label: "Мои обращения", active: true },
                        { label: "Создать" },
                    ]
                    : undefined,
        },
        { icon: <Bell className="h-4 w-4" />, label: "Новости" },
        { icon: <Wallet className="h-4 w-4" />, label: "Казначейство" },
        { icon: <FolderOpen className="h-4 w-4" />, label: "Документы" },
    ];

    return (
        <aside className="w-[220px] shrink-0 border-r border-border bg-card min-h-screen flex flex-col">
            {/* Логотип */}
            <div className="px-4 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                        <Box className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-base font-bold tracking-tight">TEOS</span>
                </div>
            </div>

            {/* Меню */}
            <nav className="flex-1 overflow-y-auto py-2">
                {items.map((it) => (
                    <div key={it.label}>
                        <button
                            type="button"
                            className={`w-full text-left flex items-center gap-2 px-4 py-2 text-xs transition-colors ${
                                it.active
                                    ? "bg-primary/10 text-primary border-r-2 border-primary font-medium"
                                    : "text-foreground hover:bg-muted/60"
                            }`}
                        >
                            {it.icon}
                            <span className="flex-1">{it.label}</span>
                            {it.badge != null && (
                                <span className="text-[10px] rounded-full bg-red-500 text-white px-1.5 py-0.5 font-medium">
                                    {it.badge}
                                </span>
                            )}
                        </button>
                        {it.children && (
                            <div className="bg-muted/20">
                                {it.children.map((c) => (
                                    <button
                                        key={c.label}
                                        type="button"
                                        className={`w-full text-left px-11 py-1.5 text-xs transition-colors flex items-center justify-between ${
                                            c.active
                                                ? "text-primary bg-primary/5 font-medium"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        <span>{c.label}</span>
                                        {c.badge != null && (
                                            <span className="text-[10px] rounded-full bg-red-500 text-white px-1.5 py-0.5">
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

            {/* Виджет поддержки */}
            <div className="m-3 rounded-lg p-3 text-xs text-white" style={{ backgroundColor: "#3AA76D" }}>
                <div className="font-semibold mb-1">Техническая поддержка</div>
                <div className="opacity-90">+7 (707) 741-89-65</div>
                <div className="opacity-90">support@teos.kz</div>
            </div>
        </aside>
    );
}
