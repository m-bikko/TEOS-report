"use client";

/**
 * Левая колонка конструктора: дерево-черновик в стилистике web-ERP.
 *
 * Перетаскивание — на нативном HTML5 drag-and-drop, без новых зависимостей.
 * Зоны сброса внутри строки: верхние 25% — вставить выше, нижние 25% — ниже,
 * середина — сделать вложенным. Каждый сброс превращается в патч для BE-04.
 * Стрелки вверх/вниз оставлены как доступная альтернатива перетаскиванию.
 */

import { useState } from "react";
import {
    ChevronDown,
    ChevronRight,
    CornerDownRight,
    Eye,
    EyeOff,
    Plus,
    ArrowUp,
    ArrowDown,
    AlertTriangle,
    AlertCircle,
    GripVertical,
    MessagesSquare,
    MessageSquareText,
} from "lucide-react";
import {
    childrenOf,
    flattenVisible,
    isTranslated,
    type SupportChatNode,
    type ValidationIssue,
} from "../_support-shared/chatTree";
import { NodeIcon } from "../_support-shared/icons";
import { Button } from "../_support-shared/brand";

type DropZone = "before" | "after" | "inside";

interface Props {
    nodes: SupportChatNode[];
    selectedId: string | null;
    expanded: Set<string>;
    issues: ValidationIssue[];
    onSelect: (id: string) => void;
    onToggleExpand: (id: string) => void;
    onMove: (nodeId: string, newParentId: string | null, newIndex: number) => void;
    onAddChild: (parentId: string | null) => void;
    onToggleActive: (id: string) => void;
    onNudge: (id: string, direction: -1 | 1) => void;
}

export function TreePanel({
    nodes,
    selectedId,
    expanded,
    issues,
    onSelect,
    onToggleExpand,
    onMove,
    onAddChild,
    onToggleActive,
    onNudge,
}: Props) {
    const [dragId, setDragId] = useState<string | null>(null);
    const [dropTarget, setDropTarget] = useState<{ id: string; zone: DropZone } | null>(null);

    const rows = flattenVisible(nodes, expanded);
    const issueByNode = new Map<string, ValidationIssue[]>();
    for (const issue of issues) {
        if (!issue.nodeId) continue;
        const list = issueByNode.get(issue.nodeId) ?? [];
        list.push(issue);
        issueByNode.set(issue.nodeId, list);
    }

    const untranslated = nodes.filter((n) => !isTranslated(n)).length;

    const zoneFromEvent = (e: React.DragEvent<HTMLDivElement>): DropZone => {
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = (e.clientY - rect.top) / rect.height;
        if (ratio < 0.25) return "before";
        if (ratio > 0.75) return "after";
        return "inside";
    };

    const handleDrop = (target: SupportChatNode, zone: DropZone): void => {
        if (!dragId || dragId === target.id) return;

        if (zone === "inside") {
            const siblings = childrenOf(nodes, target.id, true).filter((n) => n.id !== dragId);
            onMove(dragId, target.id, siblings.length);
        } else {
            const siblings = childrenOf(nodes, target.parentId, true).filter((n) => n.id !== dragId);
            const pos = siblings.findIndex((n) => n.id === target.id);
            if (pos === -1) return;
            onMove(dragId, target.parentId, zone === "before" ? pos : pos + 1);
        }

        setDragId(null);
        setDropTarget(null);
    };

    return (
        <div className="flex h-full flex-col border-r border-[#e6e8ec] bg-white">
            <div className="flex items-center justify-between gap-2 border-b border-[#e6e8ec] px-4 py-3">
                <div className="min-w-0">
                    <div className="text-[13px] font-bold text-[#222222]">Дерево вопросов</div>
                    <div className="text-[11px] text-[#8a9099]">
                        {nodes.length} узлов
                        {untranslated > 0 && (
                            <span className="text-[#b56c00]"> · {untranslated} без перевода</span>
                        )}
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => onAddChild(null)}>
                    <Plus className="h-3.5 w-3.5" />
                    Раздел
                </Button>
            </div>

            <div
                className="flex-1 overflow-y-auto py-1"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                    // сброс в пустую область — перенос в корень, в конец
                    if (dragId) {
                        const roots = childrenOf(nodes, null, true).filter((n) => n.id !== dragId);
                        onMove(dragId, null, roots.length);
                    }
                    setDragId(null);
                    setDropTarget(null);
                }}
            >
                {rows.map(({ node, depth }) => {
                    const kids = childrenOf(nodes, node.id, true);
                    const isSelected = node.id === selectedId;
                    const nodeIssues = issueByNode.get(node.id) ?? [];
                    const hasError = nodeIssues.some((i) => i.level === "error");
                    const isDropTarget = dropTarget?.id === node.id;
                    const translated = isTranslated(node);

                    return (
                        <div
                            key={node.id}
                            draggable
                            onDragStart={(e) => {
                                e.stopPropagation();
                                setDragId(node.id);
                            }}
                            onDragEnd={() => {
                                setDragId(null);
                                setDropTarget(null);
                            }}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!dragId || dragId === node.id) return;
                                setDropTarget({ id: node.id, zone: zoneFromEvent(e) });
                            }}
                            onDragLeave={() => {
                                if (dropTarget?.id === node.id) setDropTarget(null);
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDrop(node, zoneFromEvent(e));
                            }}
                            onClick={() => onSelect(node.id)}
                            className={`group relative mx-2 flex cursor-pointer items-center gap-1.5 rounded-lg py-2 pr-2 transition-colors ${
                                isSelected ? "bg-[#e8eefc]" : "hover:bg-[#f6f7f9]"
                            } ${dragId === node.id ? "opacity-40" : ""} ${
                                isDropTarget && dropTarget?.zone === "inside"
                                    ? "ring-1 ring-inset ring-[#3563e9]"
                                    : ""
                            }`}
                            style={{ paddingLeft: 8 + depth * 14 }}
                        >
                            {isDropTarget && dropTarget?.zone === "before" && (
                                <div className="absolute inset-x-0 top-0 h-0.5 rounded bg-[#3563e9]" />
                            )}
                            {isDropTarget && dropTarget?.zone === "after" && (
                                <div className="absolute inset-x-0 bottom-0 h-0.5 rounded bg-[#3563e9]" />
                            )}

                            <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-[#c3c8cf]" />

                            {kids.length > 0 ? (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleExpand(node.id);
                                    }}
                                    className="shrink-0"
                                    aria-label={expanded.has(node.id) ? "Свернуть" : "Развернуть"}
                                >
                                    {expanded.has(node.id) ? (
                                        <ChevronDown className="h-3.5 w-3.5 text-[#8a9099]" />
                                    ) : (
                                        <ChevronRight className="h-3.5 w-3.5 text-[#8a9099]" />
                                    )}
                                </button>
                            ) : (
                                <span className="w-3.5 shrink-0" />
                            )}

                            {node.nodeType === "MENU" ? (
                                <MessagesSquare className="h-4 w-4 shrink-0 text-[#3563e9]" />
                            ) : (
                                <MessageSquareText className="h-4 w-4 shrink-0 text-[#07bb4f]" />
                            )}

                            {node.icon && (
                                <NodeIcon name={node.icon} className="h-3.5 w-3.5 shrink-0 text-[#8a9099]" />
                            )}

                            <span
                                className={`flex-1 truncate text-[12.5px] ${
                                    node.isActive ? "text-[#222222]" : "text-[#a8aeb6] line-through"
                                } ${isSelected ? "font-semibold" : ""}`}
                            >
                                {node.titleRu || "Без заголовка"}
                            </span>

                            {!translated && (
                                <span
                                    title="Нет казахского перевода"
                                    className="shrink-0 rounded bg-[#fff0db] px-1 text-[9px] font-bold text-[#b56c00]"
                                >
                                    KZ
                                </span>
                            )}
                            {node.actionType === "ESCALATE" && (
                                <span className="shrink-0 rounded bg-[#e8eefc] px-1.5 py-px text-[9px] font-semibold text-[#3563e9]">
                                    оператор
                                </span>
                            )}
                            {hasError && <AlertCircle className="h-3.5 w-3.5 shrink-0 text-[#ec2d30]" />}

                            <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
                                <IconBtn title="Выше" onClick={() => onNudge(node.id, -1)}>
                                    <ArrowUp className="h-3 w-3" />
                                </IconBtn>
                                <IconBtn title="Ниже" onClick={() => onNudge(node.id, 1)}>
                                    <ArrowDown className="h-3 w-3" />
                                </IconBtn>
                                <IconBtn title="Вложенный пункт" onClick={() => onAddChild(node.id)}>
                                    <CornerDownRight className="h-3 w-3" />
                                </IconBtn>
                                <IconBtn
                                    title={node.isActive ? "Скрыть" : "Показать"}
                                    onClick={() => onToggleActive(node.id)}
                                >
                                    {node.isActive ? (
                                        <Eye className="h-3 w-3" />
                                    ) : (
                                        <EyeOff className="h-3 w-3" />
                                    )}
                                </IconBtn>
                            </div>
                        </div>
                    );
                })}
            </div>

            <IssuesPanel issues={issues} onSelect={onSelect} />
        </div>
    );
}

function IconBtn({
    title,
    onClick,
    children,
}: {
    title: string;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className="flex h-6 w-6 items-center justify-center rounded text-[#5d646d] transition-colors hover:bg-white"
        >
            {children}
        </button>
    );
}

function IssuesPanel({
    issues,
    onSelect,
}: {
    issues: ValidationIssue[];
    onSelect: (id: string) => void;
}) {
    const errors = issues.filter((i) => i.level === "error");
    const warnings = issues.filter((i) => i.level === "warning");

    if (issues.length === 0) {
        return (
            <div className="border-t border-[#e6e8ec] bg-[#dbf1e8] px-4 py-2.5 text-[12px] font-semibold text-[#07733a]">
                Замечаний нет — дерево можно публиковать
            </div>
        );
    }

    return (
        <div className="max-h-48 overflow-y-auto border-t border-[#e6e8ec]">
            <div className="sticky top-0 border-b border-[#e6e8ec] bg-white px-4 py-2 text-[11px] font-bold">
                {errors.length > 0 && <span className="text-[#ec2d30]">{errors.length} ошибок</span>}
                {errors.length > 0 && warnings.length > 0 && (
                    <span className="text-[#c3c8cf]"> · </span>
                )}
                {warnings.length > 0 && (
                    <span className="text-[#b56c00]">{warnings.length} предупреждений</span>
                )}
            </div>
            {[...errors, ...warnings].map((issue, i) => (
                <button
                    key={i}
                    type="button"
                    onClick={() => issue.nodeId && onSelect(issue.nodeId)}
                    className="flex w-full items-start gap-2 px-4 py-2 text-left transition-colors hover:bg-[#f6f7f9]"
                >
                    {issue.level === "error" ? (
                        <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0 text-[#ec2d30]" />
                    ) : (
                        <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0 text-[#ff9900]" />
                    )}
                    <span className="text-[11.5px] leading-snug text-[#5d646d]">{issue.message}</span>
                </button>
            ))}
        </div>
    );
}
