"use client";

/**
 * Центральная колонка: форма выбранного узла в стилистике web-ERP.
 *
 * Контент двуязычный, поэтому текстовые поля идут парами ru/kz бок о бок:
 * так перевод не забывают, а пропуск сразу видно по метке «нет перевода».
 * Блок action_payload перерисовывается под выбранный action_type.
 */

import { ChevronRight, Lock, Trash2, Copy } from "lucide-react";
import {
    ACTION_HINT,
    ACTION_LABEL,
    APP_SCREENS,
    NODE_TYPE_LABEL,
    childrenOf,
    defaultPayload,
    isTranslated,
    pathTo,
    type ActionPayload,
    type ActionType,
    type NodeType,
    type SupportChatNode,
    type SupportChatSettings,
} from "../_support-shared/chatTree";
import { ICON_NAMES, NodeIcon } from "../_support-shared/icons";
import { formatDate } from "../_support-shared/mockData";
import {
    Button,
    Field,
    LangPair,
    Select,
    Switch,
    TextArea,
    TextInput,
} from "../_support-shared/brand";

const ACTION_TYPES: ActionType[] = ["NONE", "ESCALATE", "OPEN_LINK", "OPEN_SCREEN", "CALL_CENTER"];

interface Props {
    node: SupportChatNode | null;
    nodes: SupportChatNode[];
    settings: SupportChatSettings;
    onChange: (patch: Partial<SupportChatNode>) => void;
    onDuplicate: (id: string) => void;
    onDelete: (id: string) => void;
}

export function NodeEditor({ node, nodes, settings, onChange, onDuplicate, onDelete }: Props) {
    if (!node) {
        return (
            <div className="flex flex-1 items-center justify-center text-[13px] text-[#8a9099]">
                Выберите узел в дереве слева
            </div>
        );
    }

    const crumbs = pathTo(nodes, node.id);
    const childCount = childrenOf(nodes, node.id, true).length;
    const typeLocked = childCount > 0;
    const isAnswer = node.nodeType === "ANSWER";

    const setType = (nodeType: NodeType): void => {
        if (nodeType === "ANSWER" && typeLocked) return;
        onChange({ nodeType });
    };

    const setActionType = (actionType: ActionType): void => {
        onChange({ actionType, actionPayload: defaultPayload(actionType) });
    };

    const patchPayload = (patch: Partial<ActionPayload>): void => {
        onChange({ actionPayload: { ...node.actionPayload, ...patch } as ActionPayload });
    };

    return (
        <div className="@container flex-1 overflow-y-auto bg-white">
            {/* Хлебные крошки и действия над узлом */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e6e8ec] px-6 py-4">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1">
                        {crumbs.map((c, i) => (
                            <span key={c.id} className="flex items-center gap-1">
                                {i > 0 && <ChevronRight className="h-3 w-3 text-[#c3c8cf]" />}
                                <span
                                    className={`text-[12px] ${
                                        i === crumbs.length - 1
                                            ? "font-semibold text-[#222222]"
                                            : "text-[#8a9099]"
                                    }`}
                                >
                                    {c.titleRu || "Без заголовка"}
                                </span>
                            </span>
                        ))}
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-[#a8aeb6]">{node.id}</div>
                </div>

                <div className="flex shrink-0 gap-2">
                    <Button variant="outline" size="sm" onClick={() => onDuplicate(node.id)}>
                        <Copy className="h-3.5 w-3.5" />
                        Дублировать
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onDelete(node.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-[#ec2d30]" />
                        Удалить
                    </Button>
                </div>
            </div>

            <div className="max-w-4xl space-y-5 px-6 py-5">
                <Field label="Тип узла">
                    <div className="flex flex-col gap-2 @lg:flex-row">
                        {(["MENU", "ANSWER"] as NodeType[]).map((t) => {
                            const disabled = t === "ANSWER" && typeLocked;
                            const active = node.nodeType === t;
                            return (
                                <button
                                    key={t}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => setType(t)}
                                    className={`flex-1 rounded-lg border px-4 py-2.5 text-left transition-colors ${
                                        active
                                            ? "border-[#3563e9] bg-[#e8eefc]"
                                            : "border-[#e6e8ec] bg-white hover:bg-[#f6f7f9]"
                                    } ${disabled ? "cursor-not-allowed opacity-45" : ""}`}
                                >
                                    <span
                                        className={`block text-[13px] font-semibold ${
                                            active ? "text-[#3563e9]" : "text-[#222222]"
                                        }`}
                                    >
                                        {NODE_TYPE_LABEL[t]}
                                    </span>
                                    <span className="mt-0.5 block text-[12px] text-[#8a9099]">
                                        {t === "MENU"
                                            ? "раскрывает следующий уровень"
                                            : "конечный автоответ"}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    {typeLocked && (
                        <Hint icon={<Lock className="h-3.5 w-3.5" />}>
                            Нельзя сделать ответом: внутри {childCount} вложенных пунктов. Сначала
                            перенесите или удалите их.
                        </Hint>
                    )}
                </Field>

                <LangPair
                    label="Заголовок — то, что пользователь видит кнопкой"
                    required
                    ruFilled={node.titleRu.trim() !== ""}
                    kzFilled={node.titleKz.trim() !== ""}
                    ru={
                        <TextInput
                            value={node.titleRu}
                            invalid={node.titleRu.trim() === ""}
                            onChange={(e) => onChange({ titleRu: e.target.value })}
                            placeholder="Не пришли деньги за смену"
                        />
                    }
                    kz={
                        <TextInput
                            value={node.titleKz}
                            onChange={(e) => onChange({ titleKz: e.target.value })}
                            placeholder="Ауысым үшін ақша түспеді"
                        />
                    }
                />

                {isAnswer && (
                    <LangPair
                        label="Текст автоответа"
                        required
                        ruFilled={(node.bodyRu ?? "").trim() !== ""}
                        kzFilled={(node.bodyKz ?? "").trim() !== ""}
                        hint="Сообщение придёт с пометкой «Автоответ» — пользователь будет понимать, что это не живой оператор."
                        ru={
                            <TextArea
                                rows={6}
                                value={node.bodyRu ?? ""}
                                invalid={(node.bodyRu ?? "").trim() === ""}
                                onChange={(e) => onChange({ bodyRu: e.target.value })}
                                placeholder="Что именно должен прочитать пользователь"
                            />
                        }
                        kz={
                            <TextArea
                                rows={6}
                                value={node.bodyKz ?? ""}
                                onChange={(e) => onChange({ bodyKz: e.target.value })}
                                placeholder="Пайдаланушы не оқуы керек"
                            />
                        }
                    />
                )}

                <div className="grid gap-4 @2xl:grid-cols-2">
                    <Field label="Иконка">
                        <div className="flex items-center gap-2">
                            <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg bg-[#e8eefc]">
                                <NodeIcon name={node.icon} className="h-4 w-4 text-[#3563e9]" />
                            </span>
                            <div className="flex-1">
                                <Select
                                    value={node.icon ?? ""}
                                    onChange={(e) => onChange({ icon: e.target.value || null })}
                                >
                                    <option value="">Без иконки</option>
                                    {ICON_NAMES.map((n) => (
                                        <option key={n} value={n}>
                                            {n}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                        </div>
                    </Field>

                    <Field label="Видимость">
                        <Switch
                            checked={node.isActive}
                            onChange={(next) => onChange({ isActive: next })}
                            label={node.isActive ? "Показывается в приложении" : "Скрыт от пользователей"}
                            hint={
                                isTranslated(node)
                                    ? undefined
                                    : "Без казахского перевода покажется русский текст"
                            }
                        />
                    </Field>
                </div>

                <Field label="Действие под ответом" hint={ACTION_HINT[node.actionType]}>
                    <Select
                        value={node.actionType}
                        onChange={(e) => setActionType(e.target.value as ActionType)}
                    >
                        {ACTION_TYPES.map((t) => (
                            <option key={t} value={t}>
                                {ACTION_LABEL[t]}
                            </option>
                        ))}
                    </Select>
                </Field>

                <PayloadForm payload={node.actionPayload} settings={settings} onPatch={patchPayload} />

                <div className="border-t border-[#e6e8ec] pt-4 text-[12px] text-[#8a9099]">
                    Изменил: {node.updatedBy} · {formatDate(node.updatedAt)} · порядок в уровне:{" "}
                    {node.sortOrder + 1}
                </div>
            </div>
        </div>
    );
}

function PayloadForm({
    payload,
    settings,
    onPatch,
}: {
    payload: ActionPayload | null;
    settings: SupportChatSettings;
    onPatch: (patch: Partial<ActionPayload>) => void;
}) {
    if (!payload || payload.kind === "NONE") return null;

    if (payload.kind === "ESCALATE") {
        return (
            <Field label="Категория создаваемого обращения">
                <Select
                    value={payload.category}
                    onChange={(e) => onPatch({ category: e.target.value as "b2b" | "executor" })}
                >
                    <option value="executor">Исполнитель</option>
                    <option value="b2b">B2B</option>
                </Select>
            </Field>
        );
    }

    if (payload.kind === "CALL_CENTER") {
        return (
            <Field
                label="Номер контакт-центра"
                hint="Оставьте пустым, чтобы номер подтягивался из настроек и менялся в одном месте."
            >
                <TextInput
                    value={payload.phone ?? ""}
                    onChange={(e) => onPatch({ phone: e.target.value || null })}
                    placeholder={`${settings.contactPhone} — из настроек чата`}
                />
            </Field>
        );
    }

    // OPEN_LINK и OPEN_SCREEN: подпись кнопки двуязычная, цель — одна
    return (
        <div className="space-y-4 rounded-xl border border-[#e6e8ec] bg-[#f6f7f9]/60 p-4">
            <LangPair
                label="Подпись кнопки"
                ruFilled={payload.labelRu.trim() !== ""}
                kzFilled={payload.labelKz.trim() !== ""}
                ru={
                    <TextInput
                        value={payload.labelRu}
                        onChange={(e) => onPatch({ labelRu: e.target.value })}
                        className="bg-white"
                    />
                }
                kz={
                    <TextInput
                        value={payload.labelKz}
                        onChange={(e) => onPatch({ labelKz: e.target.value })}
                        className="bg-white"
                    />
                }
            />

            {payload.kind === "OPEN_LINK" ? (
                <Field label="Ссылка">
                    <TextInput
                        value={payload.url}
                        onChange={(e) => onPatch({ url: e.target.value })}
                        placeholder="https://"
                        className="bg-white"
                    />
                </Field>
            ) : (
                <Field label="Экран приложения">
                    <Select
                        value={payload.screen}
                        onChange={(e) => onPatch({ screen: e.target.value })}
                        className="bg-white"
                    >
                        {APP_SCREENS.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </Select>
                </Field>
            )}
        </div>
    );
}

function Hint({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="mt-2 flex items-start gap-1.5 text-[12px] leading-snug text-[#8a9099]">
            <span className="mt-px shrink-0">{icon}</span>
            <span>{children}</span>
        </div>
    );
}
