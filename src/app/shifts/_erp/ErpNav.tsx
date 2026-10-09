"use client";

/**
 * Боковое меню боевого ERP: белая подложка, активный пункт синий,
 * раскрытый подпункт — светло-синяя пилюля.
 *
 * Шесть подпунктов «Заказы» — настоящие ссылки на шесть страниц раздела.
 * На десктопе колонка всегда на месте. Ниже lg превращается в выезжающую
 * панель: в боевом ERP гамбургер в шапке есть, но ничего не сворачивает —
 * здесь он получает смысл.
 */

import Link from "next/link";
import {
    BarChart3,
    BookOpen,
    ChevronDown,
    ChevronUp,
    ClipboardList,
    Download,
    HandHelping,
    HardHat,
    Headset,
    Landmark,
    Percent,
    ShieldCheck,
    SquareCheckBig,
    User,
    UserRound,
    Users,
    X,
} from "lucide-react";
import { STATUS_CONFIG, STATUS_ORDER, type StatusKey } from "./types";

interface NavItem {
    icon: React.ReactNode;
    label: string;
    collapsible?: boolean;
    /** Пункт «Заказы» — единственный с настоящими подпунктами. */
    orders?: boolean;
}

const ICON = "h-[18px] w-[18px] shrink-0";

const ITEMS: NavItem[] = [
    { icon: <ClipboardList className={ICON} />, label: "Заявки" },
    { icon: <SquareCheckBig className={ICON} />, label: "Заказы", collapsible: true, orders: true },
    { icon: <HandHelping className={ICON} />, label: "Франчайзи" },
    { icon: <Users className={ICON} />, label: "Партнеры" },
    { icon: <UserRound className={ICON} />, label: "Клиенты", collapsible: true },
    { icon: <HardHat className={ICON} />, label: "Исполнители", collapsible: true },
    { icon: <User className={ICON} />, label: "Пользователи", collapsible: true },
    { icon: <ShieldCheck className={ICON} />, label: "Отчет по услугам" },
    { icon: <BookOpen className={ICON} />, label: "Справочники", collapsible: true },
    { icon: <BarChart3 className={ICON} />, label: "Аналитика", collapsible: true },
    { icon: <Landmark className={ICON} />, label: "Казначейство", collapsible: true },
    { icon: <Download className={ICON} />, label: "Документы", collapsible: true },
    { icon: <Percent className={ICON} />, label: "Налоги" },
    { icon: <Headset className={ICON} />, label: "Техподдержка" },
];

function TeosLogo() {
    return (
        <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                <path
                    d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7L12 2.5Z"
                    fill="none"
                    stroke="#2f6bff"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                />
                <path
                    d="M12 2.5 20.5 7 12 11.5 3.5 7 12 2.5Z"
                    fill="#2f6bff"
                    stroke="#2f6bff"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                />
            </svg>
            <span className="text-[19px] font-bold tracking-tight text-[#1b2a4e]">TEOS</span>
        </div>
    );
}

function NavList({ active, onNavigate }: { active: StatusKey; onNavigate: () => void }) {
    return (
        <nav className="flex-1 overflow-y-auto pb-6">
            {ITEMS.map((item) => (
                <div key={item.label}>
                    <button
                        type="button"
                        className={`flex w-full items-center gap-3 px-5 py-[11px] text-left text-[14px] transition-colors ${
                            item.orders
                                ? "font-medium text-[#2f6bff]"
                                : "text-[#4a4f57] hover:bg-[#f5f7fa]"
                        }`}
                    >
                        <span className={item.orders ? "text-[#2f6bff]" : "text-[#6b7280]"}>
                            {item.icon}
                        </span>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.collapsible &&
                            (item.orders ? (
                                <ChevronUp className="h-4 w-4 shrink-0 text-[#2f6bff]" />
                            ) : (
                                <ChevronDown className="h-4 w-4 shrink-0 text-[#9aa1ab]" />
                            ))}
                    </button>

                    {item.orders && (
                        <div className="pb-1">
                            {STATUS_ORDER.map((key) => {
                                const cfg = STATUS_CONFIG[key];
                                const isActive = key === active;
                                return (
                                    <Link
                                        key={key}
                                        href={cfg.path}
                                        onClick={onNavigate}
                                        aria-current={isActive ? "page" : undefined}
                                        className={`block px-5 py-[11px] pl-[52px] text-[14px] transition-colors ${
                                            isActive
                                                ? "bg-[#e9f1ff] font-medium text-[#2f6bff]"
                                                : "text-[#4a4f57] hover:bg-[#f5f7fa]"
                                        }`}
                                    >
                                        {cfg.navLabel}
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            ))}
        </nav>
    );
}

interface Props {
    active: StatusKey;
    /** Выезжающая панель открыта (только ниже lg). */
    open: boolean;
    /** Колонка свёрнута гамбургером (только от lg). */
    collapsed: boolean;
    onClose: () => void;
}

export function ErpNav({ active, open, collapsed, onClose }: Props) {
    return (
        <>
            {/* Десктоп: колонка на месте, пока её не свернули гамбургером */}
            <aside
                className={`hidden w-[232px] shrink-0 flex-col border-r border-[#e8eaee] bg-white ${
                    collapsed ? "" : "lg:flex"
                }`}
            >
                <div className="px-5 py-[18px]">
                    <TeosLogo />
                </div>
                <NavList active={active} onNavigate={onClose} />
            </aside>

            {/* Мобильные и планшет: выезжающая панель */}
            <div
                className={`fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden ${
                    open ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
                onClick={onClose}
                aria-hidden="true"
            />
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-[272px] max-w-[85vw] flex-col bg-white shadow-xl transition-transform duration-200 lg:hidden ${
                    open ? "translate-x-0" : "-translate-x-full"
                }`}
                aria-hidden={!open}
            >
                <div className="flex items-center justify-between px-5 py-[18px]">
                    <TeosLogo />
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Закрыть меню"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6b7280] hover:bg-[#f5f7fa]"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <NavList active={active} onNavigate={onClose} />
            </aside>
        </>
    );
}
