"use client";

/**
 * Общий каркас раздела «Заказы» боевого ERP. Шесть подразделов отличаются
 * только конфигурацией из STATUS_CONFIG и набором заявок.
 *
 * Адаптивность, которой в оригинале нет:
 *   — ниже lg боковое меню уезжает за край и открывается гамбургером,
 *     а карточка заявки и состав бригады становятся одной карточкой;
 *   — ниже md таблица исполнителей разворачивается в карточки;
 *   — ниже sm шапка и строка фильтра перестраиваются в колонку.
 */

import { useState } from "react";
import {
    Bell,
    LogOut,
    Menu,
    RefreshCw,
    Search,
    SlidersHorizontal,
    User,
    Wallet,
} from "lucide-react";
import { ErpNav } from "./ErpNav";
import { ExecutorsPanel } from "./ExecutorsPanel";
import { OrderCard } from "./OrderCard";
import { ACCOUNT, ORDERS } from "./data";
import { STATUS_CONFIG, type StatusKey } from "./types";

export function ErpPage({ status }: { status: StatusKey }) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [navCollapsed, setNavCollapsed] = useState(false);
    const [query, setQuery] = useState("");

    const config = STATUS_CONFIG[status];
    const orders = ORDERS[status];

    return (
        <div className="flex min-h-screen bg-[#f5f6f8] font-sans text-[#2c3038]">
            <ErpNav
                active={status}
                open={drawerOpen}
                collapsed={navCollapsed}
                onClose={() => setDrawerOpen(false)}
            />

            <div className="flex min-w-0 flex-1 flex-col">
                {/* ── Шапка ───────────────────────────────────────────── */}
                <header className="flex items-center gap-3 border-b border-[#e8eaee] bg-white px-4 py-3 sm:px-6">
                    <button
                        type="button"
                        onClick={() => setDrawerOpen(true)}
                        aria-label="Открыть меню"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#4a4f57] transition-colors hover:bg-[#f5f7fa] lg:hidden"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setNavCollapsed((v) => !v)}
                        aria-label={navCollapsed ? "Показать меню" : "Скрыть меню"}
                        className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#4a4f57] transition-colors hover:bg-[#f5f7fa] lg:flex"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    {/* Логотип переезжает в шапку, когда колонка скрыта */}
                    <span className="text-[17px] font-bold tracking-tight text-[#1b2a4e] lg:hidden">
                        TEOS
                    </span>

                    <div className="ml-auto flex items-center gap-3 sm:gap-5">
                        {/* Баланс и «Пополнить» в шапку 390 px не помещаются —
                            ниже sm они переезжают в отдельную полосу под ней. */}
                        <div className="hidden items-center gap-2.5 sm:flex">
                            <Wallet className="h-[18px] w-[18px] shrink-0 text-[#4a4f57]" />
                            <div className="leading-tight">
                                <div className="text-[13px] font-medium text-[#2c3038]">
                                    Баланс: {ACCOUNT.balance}
                                </div>
                                <div className="text-[11px] text-[#9aa1ab]">
                                    Комиссия: {ACCOUNT.commission}
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="hidden shrink-0 rounded-lg border border-[#e0e3e8] px-4 py-2 text-[13px] text-[#2c3038] transition-colors hover:bg-[#f5f7fa] sm:block"
                        >
                            Пополнить
                        </button>

                        <span className="hidden h-7 w-px bg-[#e8eaee] sm:block" />

                        <button
                            type="button"
                            aria-label="Уведомления"
                            className="shrink-0 text-[#4a4f57] transition-colors hover:text-[#2f6bff]"
                        >
                            <Bell className="h-[19px] w-[19px]" />
                        </button>

                        <div className="flex shrink-0 items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9ebef]">
                                <User className="h-[18px] w-[18px] text-[#9aa1ab]" />
                            </span>
                            <div className="hidden leading-tight md:block">
                                <div className="text-[13px] font-bold text-[#2c3038]">
                                    {ACCOUNT.role}
                                </div>
                                <div className="text-[11px] text-[#9aa1ab]">{ACCOUNT.phone}</div>
                            </div>
                        </div>

                        <button
                            type="button"
                            aria-label="Выйти"
                            className="hidden shrink-0 text-[#4a4f57] transition-colors hover:text-[#2f6bff] sm:block"
                        >
                            <LogOut className="h-[19px] w-[19px]" />
                        </button>
                    </div>
                </header>

                {/* Полоса баланса — только ниже sm, замена блоку в шапке */}
                <div className="flex items-center justify-between gap-3 border-b border-[#e8eaee] bg-white px-4 py-2.5 sm:hidden">
                    <div className="flex min-w-0 items-center gap-2">
                        <Wallet className="h-[18px] w-[18px] shrink-0 text-[#4a4f57]" />
                        <div className="min-w-0 leading-tight">
                            <div className="truncate text-[13px] font-medium text-[#2c3038]">
                                Баланс: {ACCOUNT.balance}
                            </div>
                            <div className="truncate text-[11px] text-[#9aa1ab]">
                                Комиссия: {ACCOUNT.commission}
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="shrink-0 rounded-lg border border-[#e0e3e8] px-3.5 py-1.5 text-[13px] text-[#2c3038] transition-colors hover:bg-[#f5f7fa]"
                    >
                        Пополнить
                    </button>
                </div>

                {/* ── Содержимое ──────────────────────────────────────── */}
                <main className="flex-1 px-4 py-4 sm:px-6 sm:py-5">
                    {/* Ниже sm поиск уходит наверх, а «Фильтр» и «Обновить»
                        делят одну строку: три полноширинные кнопки подряд
                        отодвигали бы заявки за нижний край экрана. */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative order-first min-w-0 flex-1 sm:order-none">
                            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[#9aa1ab]" />
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Введите номер заявки или название заказа"
                                aria-label="Поиск по заявкам и заказам"
                                className="w-full rounded-lg border border-[#e0e3e8] bg-white py-2.5 pl-11 pr-4 text-[13px] text-[#2c3038] outline-none transition-colors placeholder:text-[#9aa1ab] focus:border-[#2f6bff]"
                            />
                        </div>

                        <div className="flex gap-3 sm:contents">
                            <button
                                type="button"
                                className="flex flex-1 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#e0e3e8] bg-white px-4 py-2.5 text-[13px] text-[#2c3038] transition-colors hover:bg-[#f5f7fa] sm:order-first sm:flex-none"
                            >
                                <SlidersHorizontal className="h-4 w-4 text-[#6b7280]" />
                                Фильтр
                            </button>

                            <button
                                type="button"
                                className="flex flex-1 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#22b24c] px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#1d9c42] sm:flex-none"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Обновить
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 space-y-4">
                        {orders.map((order) => (
                            /* Ниже lg заявка и её бригада — одна карточка: две
                               отдельные читались как два несвязанных блока. */
                            <div
                                key={order.number}
                                className="overflow-hidden rounded-xl border border-[#e8eaee] bg-white lg:grid lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-4 lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent"
                            >
                                <OrderCard order={order} badge={config.badge} />
                                <ExecutorsPanel order={order} config={config} />
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
}
