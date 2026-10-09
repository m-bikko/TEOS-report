"use client";

/**
 * Карточка заявки — левая колонка строки заказа.
 *
 * Состав кнопок задаётся самим заказом, а не статусом: в «На согласовании»
 * у одной заявки есть «Скачать ЛУВР», у соседней нет.
 *
 * Нижняя полоса с датой, временем, ставкой и суммой на десктопе идёт
 * в четыре колонки с разделителями, на телефоне — сетка 2×2:
 * четыре колонки по 90 px нечитаемы.
 */

import { useState } from "react";
import {
    ChevronDown,
    ChevronUp,
    Download,
    FileText,
    Pencil,
    Play,
    Share2,
    Upload,
    User,
} from "lucide-react";
import { StatusPill } from "./ui";
import type { ButtonKey, Order, Pill } from "./types";

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

const SOLID = "flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium";
const OUTLINE = `${SOLID} border border-[#2f6bff] text-[#2f6bff] transition-colors hover:bg-[#f2f6ff]`;
const LINK = "flex items-center gap-1.5 text-[12px] font-medium text-[#2f6bff]";
const LINK_ICON =
    "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#e9f1ff] text-[#2f6bff]";

function CardButton({ kind }: { kind: ButtonKey }) {
    switch (kind) {
        case "start":
            return (
                <button type="button" className={OUTLINE}>
                    Начать работу
                    <Play className="h-[13px] w-[13px]" />
                </button>
            );
        case "finish":
            return (
                <button type="button" className={OUTLINE}>
                    Завершение заказа
                    <Play className="h-[13px] w-[13px]" />
                </button>
            );
        case "toPayment":
            return (
                <button type="button" className={OUTLINE}>
                    В оплату
                </button>
            );
        case "toPaymentMuted":
            return (
                <button
                    type="button"
                    className={`${SOLID} bg-[#eef0f3] text-[#6b7280] transition-colors hover:bg-[#e6e9ed]`}
                >
                    В оплату
                </button>
            );
        case "toApproval":
            return (
                <button type="button" className={OUTLINE}>
                    В согласование
                </button>
            );
        case "toArchive":
            return (
                <button
                    type="button"
                    className={`${SOLID} bg-[#fdeaea] text-[#d9453f] transition-colors hover:bg-[#fbdcdc]`}
                >
                    В архив
                </button>
            );
        case "attachLuvr":
            return (
                <button type="button" className={LINK}>
                    <span className={LINK_ICON}>
                        <Upload className="h-[13px] w-[13px]" />
                    </span>
                    Прикрепите ЛУВР
                </button>
            );
        case "downloadLuvr":
            return (
                <button type="button" className={LINK}>
                    <span className={LINK_ICON}>
                        <Download className="h-[13px] w-[13px]" />
                    </span>
                    Скачать ЛУВР
                </button>
            );
    }
}

/** Счётчик вида «Резерв: 1»: ненулевое значение в оригинале — синяя ссылка. */
function Counter({ label, value }: { label: string; value: number }) {
    return (
        <span className="text-[#6b7280]">
            {label}:{" "}
            {value > 0 ? (
                <button type="button" className="text-[#2f6bff] underline underline-offset-2">
                    {value}
                </button>
            ) : (
                <span className="text-[#2c3038]">{value}</span>
            )}
        </span>
    );
}

export function OrderCard({ order, badge }: { order: Order; badge: Pill }) {
    const [descriptionOpen, setDescriptionOpen] = useState(false);
    const understaffed = order.filled !== order.required;

    return (
        <section className="flex flex-col px-4 py-4 lg:rounded-xl lg:border lg:border-[#e8eaee] lg:bg-white">
            <header className="flex items-center gap-2">
                <h2 className="text-[14px] font-bold text-[#2c3038]">Заявка № {order.number}</h2>
                <span className="text-[12px] text-[#9aa1ab]">ID</span>
                {order.headerIcons.includes("edit") && (
                    <button
                        type="button"
                        aria-label="Редактировать заявку"
                        className="text-[#6b7280] transition-colors hover:text-[#2f6bff]"
                    >
                        <Pencil className="h-[15px] w-[15px]" />
                    </button>
                )}
                {order.headerIcons.includes("share") && (
                    <button
                        type="button"
                        aria-label="Поделиться заявкой"
                        className="text-[#6b7280] transition-colors hover:text-[#2f6bff]"
                    >
                        <Share2 className="h-[15px] w-[15px]" />
                    </button>
                )}
            </header>

            <div className="mt-3 text-[13px] text-[#2c3038]">{order.company}</div>

            <div className="mt-3 flex items-center gap-3">
                <span className="text-[13px] text-[#6b7280]">Статус</span>
                <StatusPill pill={badge} />
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

            {order.buttons.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 border-t border-[#eef0f3] pt-3">
                    {order.buttons.map((kind) => (
                        <CardButton key={kind} kind={kind} />
                    ))}
                </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[#eef0f3] pt-3 text-[13px] text-[#2c3038]">
                <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-[#6b7280]" />
                    {/* Дробь одним выражением: перенос строки в JSX даёт пробел перед «/». */}
                    <span>
                        <span className={understaffed ? "text-[#d9453f]" : undefined}>{order.filled}</span>/{order.required}
                    </span>
                </span>
                <Counter label="Резерв" value={order.reserve} />
                <Counter label="Вышли" value={order.attended} />
            </div>

            <div className="mt-3 grid grid-cols-2 border-t border-[#eef0f3] pt-3 sm:grid-cols-4 sm:divide-x sm:divide-[#eef0f3]">
                <StatCell label="Дата:">{order.date}</StatCell>
                <StatCell label="Время заказа:">
                    <span className="block">{order.timeFrom}</span>
                    {order.timeTo && <span className="block">{order.timeTo}</span>}
                </StatCell>
                <StatCell label="Ставка Ед. измерения:">{order.rate}</StatCell>
                <StatCell label="За заказ:">{order.total}</StatCell>
            </div>
        </section>
    );
}
