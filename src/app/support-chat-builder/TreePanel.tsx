"use client";

/**
 * Левая колонка конструктора: дерево-черновик.
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
    Copy,
    Trash2,
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
    type SupportChatNode,
    type ValidationIssue,
} from "../_support-shared/chatTree";
import { NodeIcon } from "../_support-shared/icons";

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
    onDuplicate: (id: string) => void;
    onDelete: (id: string) => void;
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
    onDuplicate,
    onDelete,
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
        <div className="flex flex-col h-full border-r border-border bg-card">
            <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
                <div>
                    <div className="text-xs font-semibold">Дерево частых вопросов</div>
                    <div className="text-[10px] text-muted-foreground">
                        {nodes.length} узлов · перетаскиванием меняется вложенность
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => onAddChild(null)}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-medium hover:bg-muted"
                >
                    <Plus className="h-3 w-3" />
                    Раздел
                </button>
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
                    const hasWarning = nodeIssues.some((i) => i.level === "warning");
                    const isDropTarget = dropTarget?.id === node.id;

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
                            className={`group relative flex items-center gap-1 pr-2 py-1.5 cursor-pointer border-l-2 transition-colors ${
                                isSelected
                                    ? "bg-primary/10 border-primary"
                                    : "border-transparent hover:bg-muted/60"
                            } ${dragId === node.id ? "opacity-40" : ""} ${
                                isDropTarget && dropTarget?.zone === "inside"
                                    ? "ring-1 ring-inset ring-primary rounded-sm"
                                    : ""
                            }`}
                            style={{ paddingLeft: 6 + depth * 14 }}
                        >
                            {isDropTarget && dropTarget?.zone === "before" && (
                                <div className="absolute left-0 right-0 top-0 h-0.5 bg-primary" />
                            )}
                            {isDropTarget && dropTarget?.zone === "after" && (
                                <div className="absolute left-0 right-0 bottom-0 h-0.5 bg-primary" />
                            )}

                            <GripVertical className="h-3 w-3 text-muted-foreground/40 shrink-0 cursor-grab" />

                            {kids.length > 0 ? (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleExpand(node.id);
                                    }}
                                    className="shrink-0"
                                >
                                    {expanded.has(node.id) ? (
                                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                    ) : (
                                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                    )}
                                </button>
                            ) : (
                                <span className="w-3 shrink-0" />
                            )}

                            {node.nodeType === "MENU" ? (
                                <MessagesSquare className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                            ) : (
                                <MessageSquareText className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            )}

                            {node.icon && (
                                <NodeIcon name={node.icon} className="h-3 w-3 text-muted-foreground shrink-0" />
                            )}

                            <span
                                className={`flex-1 text-[11px] truncate ${
                                    node.isActive ? "" : "text-muted-foreground line-through"
                                } ${isSelected ? "font-medium" : ""}`}
                            >
                                {node.title || "Без заголовка"}
                            </span>

                            {node.actionType === "ESCALATE" && (
                                <span className="text-[8px] px-1 py-px rounded bg-blue-100 text-blue-700 font-medium shrink-0">
                                    оператор
                                </span>
                            )}
                            {hasError && <AlertCircle className="h-3 w-3 text-red-500 shrink-0" />}
                            {!hasError && hasWarning && (
                                <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                            )}

                            <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                                <IconBtn title="Выше" onClick={() => onNudge(node.id, -1)}>
                                    <ArrowUp className="h-3 w-3" />
                                </IconBtn>
                                <IconBtn title="Ниже" onClick={() => onNudge(node.id, 1)}>
                                    <ArrowDown className="h-3 w-3" />
                                </IconBtn>
                                <IconBtn title="Вложенный пункт" onClick={() => onAddChild(node.id)}>
                                    <CornerDownRight className="h-3 w-3" />
                                </IconBtn>
                                <IconBtn title="Дублировать" onClick={() => onDuplicate(node.id)}>
                                    <Copy className="h-3 w-3" />
                                </IconBtn>
                                <IconBtn
                                    title={node.isActive ? "Выключить" : "Включить"}
                                    onClick={() => onToggleActive(node.id)}
                                >
                                    {node.isActive ? (
                                        <Eye className="h-3 w-3" />
                                    ) : (
                                        <EyeOff className="h-3 w-3" />
                                    )}
                                </IconBtn>
                                <IconBtn title="Удалить" danger onClick={() => onDelete(node.id)}>
                                    <Trash2 className="h-3 w-3" />
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
    danger,
    children,
}: {
    title: string;
    onClick: () => void;
    danger?: boolean;
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
            className={`h-5 w-5 rounded flex items-center justify-center hover:bg-background ${
                danger ? "text-red-500" : "text-muted-foreground"
            }`}
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
            <div className="border-t border-border px-3 py-2 text-[10px] text-emerald-600 font-medium">
                Замечаний нет — дерево можно публиковать
            </div>
        );
    }

    return (
        <div className="border-t border-border max-h-44 overflow-y-auto">
            <div className="px-3 py-1.5 text-[10px] font-semibold sticky top-0 bg-card border-b border-border">
                {errors.length > 0 && <span className="text-red-600">{errors.length} ошибок</span>}
                {errors.length > 0 && warnings.length > 0 && <span className="text-muted-foreground"> · </span>}
                {warnings.length > 0 && (
                    <span className="text-amber-600">{warnings.length} предупреждений</span>
                )}
            </div>
            {[...errors, ...warnings].map((issue, i) => (
                <button
                    key={i}
                    type="button"
                    onClick={() => issue.nodeId && onSelect(issue.nodeId)}
                    className="w-full text-left px-3 py-1.5 flex items-start gap-1.5 hover:bg-muted/60"
                >
                    {issue.level === "error" ? (
                        <AlertCircle className="h-3 w-3 text-red-500 shrink-0 mt-px" />
                    ) : (
                        <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-px" />
                    )}
                    <span className="text-[10px] leading-snug text-muted-foreground">{issue.message}</span>
                </button>
            ))}
        </div>
    );
}
