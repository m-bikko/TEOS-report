"use client";

/**
 * Центральная колонка: форма выбранного узла.
 * Блок action_payload перерисовывается под выбранный action_type.
 */

import { ChevronRight, Info, Lock } from "lucide-react";
import {
    ACTION_HINT,
    ACTION_LABEL,
    APP_SCREENS,
    NODE_TYPE_LABEL,
    childrenOf,
    defaultPayload,
    pathTo,
    type ActionPayload,
    type ActionType,
    type NodeType,
    type SupportChatNode,
    type SupportChatSettings,
} from "../_support-shared/chatTree";
import { ICON_NAMES, NodeIcon } from "../_support-shared/icons";
import { formatDate } from "../_support-shared/mockData";

const ACTION_TYPES: ActionType[] = ["NONE", "ESCALATE", "OPEN_LINK", "OPEN_SCREEN", "CALL_CENTER"];

interface Props {
    node: SupportChatNode | null;
    nodes: SupportChatNode[];
    settings: SupportChatSettings;
    onChange: (patch: Partial<SupportChatNode>) => void;
}

export function NodeEditor({ node, nodes, settings, onChange }: Props) {
    if (!node) {
        return (
            <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                Выберите узел в дереве слева
            </div>
        );
    }

    const crumbs = pathTo(nodes, node.id);
    const childCount = childrenOf(nodes, node.id, true).length;
    const typeLocked = childCount > 0;

    const setType = (nodeType: NodeType): void => {
        if (nodeType === "ANSWER" && typeLocked) return;
        onChange({ nodeType, body: nodeType === "ANSWER" ? (node.body ?? "") : node.body });
    };

    const setActionType = (actionType: ActionType): void => {
        onChange({ actionType, actionPayload: defaultPayload(actionType, settings) });
    };

    const patchPayload = (patch: Partial<ActionPayload>): void => {
        onChange({ actionPayload: { ...node.actionPayload, ...patch } as ActionPayload });
    };

    return (
        <div className="flex-1 overflow-y-auto">
            <div className="px-5 py-3 border-b border-border">
                <div className="flex items-center gap-1 flex-wrap">
                    {crumbs.map((c, i) => (
                        <span key={c.id} className="flex items-center gap-1">
                            {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/50" />}
                            <span
                                className={`text-[11px] ${
                                    i === crumbs.length - 1
                                        ? "font-medium text-foreground"
                                        : "text-muted-foreground"
                                }`}
                            >
                                {c.title || "Без заголовка"}
                            </span>
                        </span>
                    ))}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 font-mono">{node.id}</div>
            </div>

            <div className="px-5 py-4 space-y-4 max-w-2xl">
                <Field label="Тип узла">
                    <div className="flex gap-2">
                        {(["MENU", "ANSWER"] as NodeType[]).map((t) => {
                            const disabled = t === "ANSWER" && typeLocked;
                            return (
                                <button
                                    key={t}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => setType(t)}
                                    className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                                        node.nodeType === t
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border hover:bg-muted"
                                    } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                                >
                                    {NODE_TYPE_LABEL[t]}
                                    <span className="block text-[10px] font-normal opacity-70 mt-0.5">
                                        {t === "MENU" ? "раскрывает следующий уровень" : "конечный автоответ"}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    {typeLocked && (
                        <Hint icon={<Lock className="h-3 w-3" />}>
                            Нельзя сделать ответом: внутри {childCount} вложенных пунктов. Сначала
                            перенесите или удалите их.
                        </Hint>
                    )}
                </Field>

                <Field label="Заголовок — то, что пользователь видит кнопкой">
                    <input
                        value={node.title}
                        onChange={(e) => onChange({ title: e.target.value })}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
                        placeholder="Например: Не пришли деньги за смену"
                    />
                </Field>

                {node.nodeType === "ANSWER" && (
                    <Field label="Текст автоответа">
                        <textarea
                            value={node.body ?? ""}
                            onChange={(e) => onChange({ body: e.target.value })}
                            rows={5}
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs leading-relaxed resize-y"
                            placeholder="Что именно должен прочитать пользователь"
                        />
                        <Hint icon={<Info className="h-3 w-3" />}>
                            Сообщение придёт с пометкой «Автоответ» — пользователь будет понимать, что
                            это не живой оператор.
                        </Hint>
                    </Field>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <Field label="Иконка">
                        <div className="flex items-center gap-2">
                            <div className="h-9 w-9 rounded-md border border-border flex items-center justify-center shrink-0">
                                <NodeIcon name={node.icon} className="h-4 w-4 text-primary" />
                            </div>
                            <select
                                value={node.icon ?? ""}
                                onChange={(e) => onChange({ icon: e.target.value || null })}
                                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-xs"
                            >
                                <option value="">Без иконки</option>
                                {ICON_NAMES.map((n) => (
                                    <option key={n} value={n}>
                                        {n}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </Field>

                    <Field label="Видимость">
                        <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={node.isActive}
                                onChange={(e) => onChange({ isActive: e.target.checked })}
                                className="h-3.5 w-3.5"
                            />
                            <span className="text-xs">
                                {node.isActive ? "Показывается в приложении" : "Скрыт от пользователей"}
                            </span>
                        </label>
                    </Field>
                </div>

                <Field label="Действие под ответом">
                    <select
                        value={node.actionType}
                        onChange={(e) => setActionType(e.target.value as ActionType)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
                    >
                        {ACTION_TYPES.map((t) => (
                            <option key={t} value={t}>
                                {ACTION_LABEL[t]}
                            </option>
                        ))}
                    </select>
                    <Hint icon={<Info className="h-3 w-3" />}>{ACTION_HINT[node.actionType]}</Hint>
                </Field>

                <PayloadForm payload={node.actionPayload} settings={settings} onPatch={patchPayload} />

                <div className="pt-2 border-t border-border text-[10px] text-muted-foreground">
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
                <select
                    value={payload.category}
                    onChange={(e) => onPatch({ category: e.target.value as "b2b" | "executor" })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
                >
                    <option value="executor">Исполнитель</option>
                    <option value="b2b">B2B</option>
                </select>
            </Field>
        );
    }

    if (payload.kind === "OPEN_LINK") {
        return (
            <div className="grid grid-cols-2 gap-4">
                <Field label="Подпись кнопки">
                    <input
                        value={payload.label}
                        onChange={(e) => onPatch({ label: e.target.value })}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
                    />
                </Field>
                <Field label="Ссылка">
                    <input
                        value={payload.url}
                        onChange={(e) => onPatch({ url: e.target.value })}
                        placeholder="https://"
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
                    />
                </Field>
            </div>
        );
    }

    if (payload.kind === "OPEN_SCREEN") {
        return (
            <div className="grid grid-cols-2 gap-4">
                <Field label="Подпись кнопки">
                    <input
                        value={payload.label}
                        onChange={(e) => onPatch({ label: e.target.value })}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
                    />
                </Field>
                <Field label="Экран приложения">
                    <select
                        value={payload.screen}
                        onChange={(e) => onPatch({ screen: e.target.value })}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
                    >
                        {APP_SCREENS.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                </Field>
            </div>
        );
    }

    return (
        <Field label="Номер контакт-центра">
            <input
                value={payload.phone ?? ""}
                onChange={(e) => onPatch({ phone: e.target.value || null })}
                placeholder={`${settings.contactPhone} — из настроек чата`}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
            />
            <Hint icon={<Info className="h-3 w-3" />}>
                Оставьте пустым, чтобы номер подтягивался из настроек и менялся в одном месте.
            </Hint>
        </Field>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5 font-medium">
                {label}
            </div>
            {children}
        </div>
    );
}

function Hint({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="mt-1.5 flex items-start gap-1.5 text-[10px] text-muted-foreground leading-snug">
            <span className="shrink-0 mt-px">{icon}</span>
            <span>{children}</span>
        </div>
    );
}
