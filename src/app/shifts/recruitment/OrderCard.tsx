"use client";

/**
 * Карточка заявки — левая колонка строки заказа.
 *
 * Нижняя полоса с датой, временем, ставкой и суммой на десктопе идёт
 * в четыре колонки с вертикальными разделителями, на телефоне
 * перестраивается в сетку 2×2: четыре колонки по 90 px нечитаемы.
 */

import { useState } from "react";
import { ChevronDown, ChevronUp, FileText, Pencil, Play, Share2, User } from "lucide-react";
import type { OrderRequest } from "./data";

function MetaRow({ label, value, link }: { label: string; value: string; link?: boolean }) {
    return (
        <div className="flex items-start gap-3 py-[3px]">
            <span className="w-[62px] shrink-0 text-[13px] text-[#6b7280]">{label}</span>
            <span
                className={`flex-1 text-right text-[13px] leading-[1.35] ${
                    link ? "text-[#2f6bff]" : "text-[#2c3038]"
                }`}
            >
                {value}
            </span>
        </div>
    );
}

function StatCell({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="px-1 py-2 text-center">
            {/* 10 px — размер, при котором «Время заказа:» ложится в одну
                строку, а «Ставка Ед. измерения:» переносится, как в оригинале. */}
            <div className="text-[10px] leading-tight text-[#6b7280]">{label}</div>
            <div className="mt-0.5 text-[13px] font-medium text-[#2c3038]">{children}</div>
        </div>
    );
}

export function OrderCard({ order }: { order: OrderRequest }) {
    const [descriptionOpen, setDescriptionOpen] = useState(false);

    return (
        <section className="flex flex-col rounded-xl border border-[#e8eaee] bg-white px-4 py-4">
            <header className="flex items-center gap-2">
                <h2 className="text-[14px] font-bold text-[#2c3038]">Заявка № {order.number}</h2>
                <span className="text-[12px] text-[#9aa1ab]">ID</span>
                <button
                    type="button"
                    aria-label="Редактировать заявку"
                    className="text-[#6b7280] transition-colors hover:text-[#2f6bff]"
                >
                    <Pencil className="h-[15px] w-[15px]" />
                </button>
                <button
                    type="button"
                    aria-label="Поделиться заявкой"
                    className="text-[#6b7280] transition-colors hover:text-[#2f6bff]"
                >
                    <Share2 className="h-[15px] w-[15px]" />
                </button>
            </header>

            <div className="mt-3 text-[13px] text-[#2c3038]">{order.company}</div>

            <div className="mt-3 flex items-center gap-3">
                <span className="text-[13px] text-[#6b7280]">Статус</span>
                <span className="rounded-md bg-[#fdf0dd] px-2 py-[3px] text-[12px] font-medium text-[#c9792a]">
                    {order.status}
                </span>
            </div>

            <div className="mt-3 flex items-start gap-2">
                <FileText className="mt-px h-4 w-4 shrink-0 text-[#2f6bff]" />
                <h3 className="text-[13.5px] font-bold leading-[1.35] text-[#2c3038]">
                    {order.title}
                </h3>
            </div>

            <div className="mt-3">
                <MetaRow label="Телефон" value={order.phone} link />
                <MetaRow label="Адрес" value={order.address} />
                <MetaRow label="Объект" value={order.facility} />
            </div>

            <button
                type="button"
                onClick={() => setDescriptionOpen((v) => !v)}
                aria-expanded={descriptionOpen}
                className="mt-3 flex items-center justify-center gap-1 self-center text-[13px] text-[#4a4f57] transition-colors hover:text-[#2f6bff]"
            >
                Описание
                {descriptionOpen ? (
                    <ChevronUp className="h-4 w-4" />
                ) : (
                    <ChevronDown className="h-4 w-4" />
                )}
            </button>
            {descriptionOpen && (
                <p className="mt-2 text-[12.5px] leading-snug text-[#6b7280]">
                    Описание к заказу не заполнено.
                </p>
            )}

            <div className="mt-3 border-t border-[#eef0f3] pt-3">
                <button
                    type="button"
                    className="flex items-center gap-2 rounded-lg border border-[#2f6bff] px-4 py-2 text-[13px] font-medium text-[#2f6bff] transition-colors hover:bg-[#f2f6ff]"
                >
                    Начать работу
                    <Play className="h-[13px] w-[13px]" />
                </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[#eef0f3] pt-3 text-[13px] text-[#2c3038]">
                <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-[#6b7280]" />
                    {order.filled}/{order.required}
                </span>
                <span className="text-[#6b7280]">
                    Резерв: <span className="text-[#2c3038]">{order.reserve}</span>
                </span>
                <span className="text-[#6b7280]">
                    Вышли:{" "}
                    {order.attended > 0 ? (
                        <button
                            type="button"
                            className="text-[#2f6bff] underline underline-offset-2"
                        >
                            {order.attended}
                        </button>
                    ) : (
                        <span className="text-[#2c3038]">{order.attended}</span>
                    )}
                </span>
            </div>

            <div className="mt-3 grid grid-cols-2 border-t border-[#eef0f3] pt-3 sm:grid-cols-4 sm:divide-x sm:divide-[#eef0f3]">
                <StatCell label="Дата:">{order.date}</StatCell>
                <StatCell label="Время заказа:">
                    <span className="block">{order.timeFrom}</span>
                    <span className="block">{order.timeTo}</span>
                </StatCell>
                <StatCell label="Ставка Ед. измерения:">{order.rate}</StatCell>
                <StatCell label="За заказ:">{order.total}</StatCell>
            </div>
        </section>
    );
}
