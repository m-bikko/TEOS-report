"use client";

/**
 * Правая колонка строки заказа: действия над бригадой и её состав.
 *
 * Набор колонок и действий приходит из STATUS_CONFIG — это и есть вся разница
 * между шестью подразделами. Часть действий в боевом ERP погашена, пока ничего
 * не отмечено; здесь это воспроизведено буквально.
 *
 * Таблица остаётся таблицей от md и выше. Ниже она разворачивается в список
 * карточек: до двенадцати колонок в 375 px превращаются в кашу, а
 * горизонтальный скролл внутри скроллящейся страницы ловится плохо.
 */

import { useState } from "react";
import {
    Clock,
    CreditCard,
    History,
    LogIn,
    MessageSquareText,
    Minus,
    Pencil,
    SquarePlus,
    SquareX,
    Trash2,
    UserCog,
} from "lucide-react";
import { Checkbox, Rating, StatusPill } from "./ui";
import {
    ACTION_LABEL,
    COLUMN_LABEL,
    NEEDS_SELECTION,
    type ActionKey,
    type ColumnKey,
    type Executor,
    type Order,
    type StatusConfig,
} from "./types";

const TOOLBAR_ICON = "h-[15px] w-[15px] shrink-0";

const ACTION_ICON: Record<ActionKey, React.ReactNode> = {
    ready: <SquarePlus className={TOOLBAR_ICON} />,
    add: <SquarePlus className={TOOLBAR_ICON} />,
    addFromOrder: <SquarePlus className={TOOLBAR_ICON} />,
    blacklist: <SquareX className={TOOLBAR_ICON} />,
    foreman: <UserCog className={TOOLBAR_ICON} />,
    message: <MessageSquareText className={TOOLBAR_ICON} />,
    history: <History className={TOOLBAR_ICON} />,
    invite: <LogIn className={TOOLBAR_ICON} />,
    remove: <Trash2 className={TOOLBAR_ICON} />,
    removeFine: <Trash2 className={TOOLBAR_ICON} />,
    pay: <CreditCard className={TOOLBAR_ICON} />,
    refund: <Minus className={TOOLBAR_ICON} />,
};

/** Ширины колонок подобраны под оригинал; «ФИО» тянется по остатку. */
const COLUMN_WIDTH: Partial<Record<ColumnKey, string>> = {
    select: "w-[60px]",
    name: "min-w-[200px]",
    id: "min-w-[100px]",
    phone: "min-w-[170px]",
    kaspi: "min-w-[180px]",
    citizenship: "min-w-[140px]",
    rating: "min-w-[110px]",
    status: "min-w-[120px]",
    output: "min-w-[140px]",
    surcharge: "min-w-[170px]",
    amount: "min-w-[110px]",
    total: "min-w-[110px]",
    wallet: "min-w-[110px]",
    avr: "min-w-[190px]",
    receipt: "min-w-[150px]",
    payment: "min-w-[160px]",
};

const HEAD_CELL =
    "border-r border-[#e8eaee] px-4 py-3 text-[13px] font-medium text-[#2c3038] last:border-r-0";
const BODY_CELL = "border-r border-[#e8eaee] px-4 py-3 text-[13px] last:border-r-0";

/** Значение одной ячейки. Редактируемые поля рисуются как в оригинале. */
function Cell({
    column,
    executor,
    editable,
}: {
    column: ColumnKey;
    executor: Executor;
    editable: boolean;
}) {
    switch (column) {
        case "rating":
            return executor.rating == null ? null : <Rating value={executor.rating} />;
        case "status":
            return executor.status ? <StatusPill pill={executor.status} /> : null;
        case "avr":
            return executor.avr ? <StatusPill pill={executor.avr} /> : null;
        case "receipt":
            return executor.receipt ? <StatusPill pill={executor.receipt} /> : null;
        case "payment":
            return executor.payment ? <StatusPill pill={executor.payment} /> : null;
        case "output":
            if (!editable) return <span className="text-[#2c3038]">{executor.output}</span>;
            return (
                <span className="inline-flex items-center justify-between gap-2 rounded-lg border border-[#cbd0d7] bg-white px-3 py-1.5 text-[#2c3038]">
                    {executor.output}
                    <Clock className="h-[15px] w-[15px] text-[#6b7280]" />
                </span>
            );
        case "surcharge":
            if (!editable) return <span className="text-[#2c3038]">{executor.surcharge}</span>;
            return (
                <span className="flex items-center gap-2">
                    <Pencil className="h-[14px] w-[14px] text-[#9aa1ab]" />
                    <span className="text-[#2c3038]">{executor.surcharge}</span>
                </span>
            );
        case "id":
            return <span className="text-[#2c3038]">{executor.id}</span>;
        case "name":
            return <span className="text-[#2c3038]">{executor.name}</span>;
        case "select":
            return null;
        default:
            return <span className="text-[#2c3038]">{executor[column] ?? ""}</span>;
    }
}

/** Есть ли что показывать в ячейке — на телефоне пустое значение заменяем прочерком. */
function isFilled(column: Exclude<ColumnKey, "select">, executor: Executor): boolean {
    const value = executor[column];
    if (value == null) return false;
    if (typeof value === "string") return value.trim() !== "";
    return true;
}

function Toolbar({
    actions,
    extra,
    align,
    hasSelection,
}: {
    actions: ActionKey[];
    extra: ActionKey[];
    align: "left" | "right";
    hasSelection: boolean;
}) {
    return (
        <div
            className={`flex items-center gap-4 overflow-x-auto px-4 py-3 [scrollbar-width:thin] ${
                align === "right" ? "justify-start md:justify-end" : ""
            }`}
        >
            {actions.map((key) => {
                const disabled = (NEEDS_SELECTION.has(key) || extra.includes(key)) && !hasSelection;
                return (
                    <button
                        key={key}
                        type="button"
                        disabled={disabled}
                        className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[13px] transition-colors ${
                            disabled
                                ? "cursor-default text-[#b9bec6]"
                                : "text-[#2c3038] hover:text-[#2f6bff]"
                        }`}
                    >
                        {ACTION_ICON[key]}
                        {ACTION_LABEL[key]}
                    </button>
                );
            })}
        </div>
    );
}

export function ExecutorsPanel({ order, config }: { order: Order; config: StatusConfig }) {
    const [selected, setSelected] = useState<Set<number>>(new Set());

    const { columns, actions, actionsAlign, tintedRows } = config;
    const editable = config.editableRows === true;
    const selectable = columns.includes("select");
    const dataColumns = columns.filter((c): c is Exclude<ColumnKey, "select"> => c !== "select");

    const toggle = (id: number): void => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const allChecked = order.executors.length > 0 && selected.size === order.executors.length;
    const toggleAll = (): void => {
        setSelected(allChecked ? new Set() : new Set(order.executors.map((e) => e.id)));
    };

    const rowTint = tintedRows ? "bg-[#f0f7fe]" : "";

    return (
        <section className="flex min-w-0 flex-col border-t border-[#e8eaee] lg:rounded-xl lg:border lg:bg-white">
            {actions.length > 0 && (
                <Toolbar
                    actions={actions}
                    extra={config.extraNeedsSelection ?? []}
                    align={actionsAlign}
                    hasSelection={selected.size > 0}
                />
            )}

            {/* От md — таблица как в боевом ERP. Колонок бывает двенадцать,
                поэтому в узком окне она прокручивается вбок. */}
            <div className={`hidden overflow-x-auto px-4 pb-4 md:block ${actions.length === 0 ? "pt-4" : ""}`}>
                <table className="w-full border-collapse overflow-hidden rounded-lg border border-[#e8eaee] text-left">
                    <thead>
                        <tr className="border-b border-[#e8eaee]">
                            {selectable && (
                                <th className={`${HEAD_CELL} ${COLUMN_WIDTH.select}`}>
                                    <Checkbox
                                        checked={allChecked}
                                        onChange={toggleAll}
                                        label="Отметить всех исполнителей"
                                    />
                                </th>
                            )}
                            {dataColumns.map((c) => (
                                <th key={c} className={`${HEAD_CELL} ${COLUMN_WIDTH[c] ?? ""}`}>
                                    {COLUMN_LABEL[c]}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {order.executors.map((ex) => (
                            <tr key={ex.id} className={`border-b border-[#e8eaee] ${rowTint}`}>
                                {selectable && (
                                    <td className={BODY_CELL}>
                                        <Checkbox
                                            checked={selected.has(ex.id)}
                                            onChange={() => toggle(ex.id)}
                                            label={`Отметить исполнителя ${ex.id}`}
                                        />
                                    </td>
                                )}
                                {dataColumns.map((c) => (
                                    <td key={c} className={BODY_CELL}>
                                        <Cell column={c} executor={ex} editable={editable} />
                                    </td>
                                ))}
                            </tr>
                        ))}

                        {order.totals && (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-10 text-[13px] text-[#2c3038]">
                                        <span>Итого</span>
                                        <span>{order.totals.hours}</span>
                                        <span>{order.totals.sum}</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Ниже md — тот же состав карточками */}
            <div className="space-y-2 px-4 pb-4 pt-1 md:hidden">
                {selectable && order.executors.length > 0 && (
                    <label className="flex items-center gap-2.5 pb-1 text-[13px] text-[#4a4f57]">
                        <Checkbox
                            checked={allChecked}
                            onChange={toggleAll}
                            label="Отметить всех исполнителей"
                        />
                        Отметить всех
                    </label>
                )}

                {order.executors.length === 0 && (
                    <p className="py-2 text-[13px] text-[#9aa1ab]">Исполнителей нет</p>
                )}

                {order.executors.map((ex) => (
                    <div
                        key={ex.id}
                        className={`rounded-lg border border-[#e8eaee] px-3 py-3 text-[13px] ${rowTint}`}
                    >
                        <div className="flex items-start gap-2.5">
                            {selectable && (
                                <span className="pt-px">
                                    <Checkbox
                                        checked={selected.has(ex.id)}
                                        onChange={() => toggle(ex.id)}
                                        label={`Отметить исполнителя ${ex.id}`}
                                    />
                                </span>
                            )}
                            <div className="min-w-0 flex-1">
                                <div className="font-medium text-[#2c3038]">{ex.name}</div>
                                <div className="mt-0.5 text-[12px] text-[#6b7280]">ID {ex.id}</div>
                            </div>
                            {ex.rating != null && <Rating value={ex.rating} />}
                        </div>

                        <dl className="mt-2.5 space-y-1 border-t border-[#eef0f3] pt-2.5">
                            {dataColumns
                                .filter((c) => c !== "id" && c !== "name" && c !== "rating")
                                .map((c) => (
                                    <div key={c} className="flex items-start justify-between gap-3">
                                        <dt className="shrink-0 text-[#6b7280]">
                                            {COLUMN_LABEL[c]}
                                        </dt>
                                        <dd className="text-right">
                                            {isFilled(c, ex) ? (
                                                <Cell column={c} executor={ex} editable={false} />
                                            ) : (
                                                <span className="text-[#9aa1ab]">—</span>
                                            )}
                                        </dd>
                                    </div>
                                ))}
                        </dl>
                    </div>
                ))}

                {order.totals && (
                    <div className="flex items-center justify-between gap-3 border-t border-[#eef0f3] pt-2.5 text-[13px] text-[#2c3038]">
                        <span>Итого</span>
                        <span>
                            {order.totals.hours} · {order.totals.sum}
                        </span>
                    </div>
                )}
            </div>
        </section>
    );
}
