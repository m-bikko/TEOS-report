"use client";

/**
 * Правая колонка строки заказа: панель действий над бригадой и состав смены.
 *
 * Часть действий в боевом ERP погашена, пока ничего не отмечено, — здесь
 * это воспроизведено буквально: они оживают после первой галочки.
 *
 * Таблица остаётся таблицей от md и выше. Ниже она разворачивается в список
 * карточек: семь колонок в 375 px превращаются в нечитаемую кашу,
 * а горизонтальный скролл в таблице внутри скроллящейся страницы ловится плохо.
 */

import { useState } from "react";
import {
    History,
    LogIn,
    MessageSquareText,
    SquarePlus,
    SquareX,
    Star,
    Trash2,
    UserCog,
} from "lucide-react";
import type { Executor } from "./data";

interface ToolbarAction {
    icon: React.ReactNode;
    label: string;
    /** Действие работает только над отмеченными строками. */
    needsSelection?: boolean;
}

const TOOLBAR_ICON = "h-[15px] w-[15px] shrink-0";

const ACTIONS: ToolbarAction[] = [
    { icon: <SquarePlus className={TOOLBAR_ICON} />, label: "Готов" },
    { icon: <SquarePlus className={TOOLBAR_ICON} />, label: "Добавить" },
    { icon: <SquarePlus className={TOOLBAR_ICON} />, label: "Добавить из другого заказа" },
    { icon: <SquareX className={TOOLBAR_ICON} />, label: "В черный список" },
    { icon: <UserCog className={TOOLBAR_ICON} />, label: "Назначить бригадиром", needsSelection: true },
    {
        icon: <MessageSquareText className={TOOLBAR_ICON} />,
        label: "Отправить сообщение",
        needsSelection: true,
    },
    { icon: <History className={TOOLBAR_ICON} />, label: "История изменений" },
    { icon: <LogIn className={TOOLBAR_ICON} />, label: "Пригласить в заказ", needsSelection: true },
    { icon: <Trash2 className={TOOLBAR_ICON} />, label: "Удалить", needsSelection: true },
    { icon: <Trash2 className={TOOLBAR_ICON} />, label: "Удалить со штрафом", needsSelection: true },
];

const HEAD_CELL =
    "border-r border-[#e8eaee] px-4 py-3 text-[13px] font-medium text-[#2c3038] last:border-r-0";
const BODY_CELL = "border-r border-[#e8eaee] px-4 py-3 text-[13px] last:border-r-0";

function Checkbox({
    checked,
    onChange,
    label,
}: {
    checked: boolean;
    onChange: () => void;
    label: string;
}) {
    return (
        <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            aria-label={label}
            className="h-[18px] w-[18px] cursor-pointer appearance-none rounded-[5px] border border-[#cbd0d7] bg-white transition-colors checked:border-[#2f6bff] checked:bg-[#2f6bff] checked:bg-[length:12px] checked:bg-center checked:bg-no-repeat"
            style={
                checked
                    ? {
                          backgroundImage:
                              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E\")",
                      }
                    : undefined
            }
        />
    );
}

function Rating({ value }: { value: number }) {
    return (
        <span className="flex items-center gap-1.5">
            <Star className="h-[15px] w-[15px] fill-[#f5b301] text-[#f5b301]" />
            <span className="text-[#2c3038]">{value}</span>
        </span>
    );
}

export function ExecutorsPanel({ executors }: { executors: Executor[] }) {
    const [selected, setSelected] = useState<Set<number>>(new Set());

    const toggle = (id: number): void => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const allChecked = executors.length > 0 && selected.size === executors.length;
    const toggleAll = (): void => {
        setSelected(allChecked ? new Set() : new Set(executors.map((e) => e.id)));
    };

    return (
        <section className="flex min-w-0 flex-col rounded-xl border border-[#e8eaee] bg-white">
            {/* Панель действий. На узком экране прокручивается вбок, порядок сохранён. */}
            <div className="flex items-center gap-4 overflow-x-auto px-4 py-3 [scrollbar-width:thin]">
                {ACTIONS.map((action, i) => {
                    const disabled = action.needsSelection === true && selected.size === 0;
                    return (
                        <button
                            key={`${action.label}-${i}`}
                            type="button"
                            disabled={disabled}
                            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[13px] transition-colors ${
                                disabled
                                    ? "cursor-default text-[#b9bec6]"
                                    : "text-[#2c3038] hover:text-[#2f6bff]"
                            }`}
                        >
                            {action.icon}
                            {action.label}
                        </button>
                    );
                })}
            </div>

            {/* От md — таблица как в боевом ERP */}
            <div className="hidden px-4 pb-4 md:block">
                <table className="w-full border-collapse overflow-hidden rounded-lg border border-[#e8eaee] text-left">
                    <thead className="bg-white">
                        <tr className="border-b border-[#e8eaee]">
                            <th className={`${HEAD_CELL} w-[60px]`}>
                                <Checkbox
                                    checked={allChecked}
                                    onChange={toggleAll}
                                    label="Отметить всех исполнителей"
                                />
                            </th>
                            <th className={`${HEAD_CELL} w-[110px]`}>ID</th>
                            <th className={HEAD_CELL}>ФИО исполнителя</th>
                            <th className={`${HEAD_CELL} w-[180px]`}>Телефон</th>
                            <th className={`${HEAD_CELL} w-[150px]`}>Гражданство</th>
                            <th className={`${HEAD_CELL} w-[120px]`}>Рейтинг</th>
                            <th className={`${HEAD_CELL} w-[130px]`}>Статус</th>
                        </tr>
                    </thead>
                    <tbody>
                        {executors.map((ex) => (
                            <tr key={ex.id} className="border-b border-[#e8eaee] last:border-b-0">
                                <td className={BODY_CELL}>
                                    <Checkbox
                                        checked={selected.has(ex.id)}
                                        onChange={() => toggle(ex.id)}
                                        label={`Отметить исполнителя ${ex.id}`}
                                    />
                                </td>
                                <td className={`${BODY_CELL} text-[#2c3038]`}>{ex.id}</td>
                                <td className={`${BODY_CELL} text-[#2c3038]`}>{ex.name}</td>
                                <td className={`${BODY_CELL} text-[#2c3038]`}>{ex.phone}</td>
                                <td className={`${BODY_CELL} text-[#2c3038]`}>{ex.citizenship}</td>
                                <td className={BODY_CELL}>
                                    <Rating value={ex.rating} />
                                </td>
                                <td className={`${BODY_CELL} text-[#2c3038]`}>{ex.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Ниже md — тот же состав карточками */}
            <div className="space-y-2 px-4 pb-4 md:hidden">
                <label className="flex items-center gap-2.5 pb-1 text-[13px] text-[#4a4f57]">
                    <Checkbox
                        checked={allChecked}
                        onChange={toggleAll}
                        label="Отметить всех исполнителей"
                    />
                    Отметить всех
                </label>

                {executors.map((ex) => (
                    <div
                        key={ex.id}
                        className="rounded-lg border border-[#e8eaee] px-3 py-3 text-[13px]"
                    >
                        <div className="flex items-start gap-2.5">
                            <span className="pt-px">
                                <Checkbox
                                    checked={selected.has(ex.id)}
                                    onChange={() => toggle(ex.id)}
                                    label={`Отметить исполнителя ${ex.id}`}
                                />
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="font-medium text-[#2c3038]">{ex.name}</div>
                                <div className="mt-0.5 text-[12px] text-[#6b7280]">ID {ex.id}</div>
                            </div>
                            <Rating value={ex.rating} />
                        </div>

                        <dl className="mt-2.5 space-y-1 border-t border-[#eef0f3] pt-2.5">
                            <div className="flex justify-between gap-3">
                                <dt className="text-[#6b7280]">Телефон</dt>
                                <dd className="text-[#2c3038]">{ex.phone}</dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-[#6b7280]">Гражданство</dt>
                                <dd className="text-[#2c3038]">{ex.citizenship}</dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-[#6b7280]">Статус</dt>
                                <dd className="text-[#2c3038]">{ex.status || "—"}</dd>
                            </div>
                        </dl>
                    </div>
                ))}
            </div>
        </section>
    );
}
