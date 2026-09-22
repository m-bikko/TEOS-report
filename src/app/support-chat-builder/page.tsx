"use client";

/**
 * Демо: конструктор дерева частых вопросов чата техподдержки (web-ERP).
 *
 * Покрывает задачи бэкенда BE-01…BE-06:
 *   BE-01 — модель узлов, версий и настроек;
 *   BE-03 — CRUD черновика с валидацией (циклы, ANSWER без потомков);
 *   BE-04 — перенос узлов одним патчем parent_id/sort_order;
 *   BE-05 — настройки чата;
 *   BE-06 — импорт/экспорт в формате контракта.
 *
 * Состояние живёт в памяти вкладки: это демо-стенд, ничего не персистится.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
    Upload,
    X,
    ArrowRightLeft,
    AlertCircle,
    ExternalLink,
    Smartphone,
} from "lucide-react";
import { Sidebar } from "../_support-shared/Sidebar";
import {
    CHAT_TREE,
    CHAT_VERSIONS,
    DEFAULT_SETTINGS,
    applyPatches,
    childrenOf,
    countErrors,
    descendantsOf,
    findNode,
    makeNode,
    reorder,
    validateTree,
    type ReorderPatch,
    type SupportChatNode,
    type SupportChatSettings,
    type SupportChatVersion,
} from "../_support-shared/chatTree";
import { TreePanel } from "./TreePanel";
import { NodeEditor } from "./NodeEditor";
import { PhonePreview } from "./PhonePreview";
import { SettingsTab } from "./SettingsTab";
import { VersionsTab } from "./VersionsTab";
import { ImportExportTab } from "./ImportExportTab";

type TabKey = "tree" | "settings" | "versions" | "io";

const TABS: { key: TabKey; label: string }[] = [
    { key: "tree", label: "Дерево" },
    { key: "settings", label: "Настройки" },
    { key: "versions", label: "Версии" },
    { key: "io", label: "Импорт-экспорт" },
];

const EDITOR_NAME = "Айгуль Сериккызы";

/** Сколько узлов отличается от опубликованной версии. */
function diffCount(draft: SupportChatNode[], published: SupportChatNode[]): number {
    const publishedById = new Map(published.map((n) => [n.id, n]));
    let changed = 0;

    for (const node of draft) {
        const before = publishedById.get(node.id);
        if (!before) {
            changed++;
            continue;
        }
        const same =
            before.title === node.title &&
            before.body === node.body &&
            before.icon === node.icon &&
            before.isActive === node.isActive &&
            before.nodeType === node.nodeType &&
            before.parentId === node.parentId &&
            before.sortOrder === node.sortOrder &&
            before.actionType === node.actionType &&
            JSON.stringify(before.actionPayload) === JSON.stringify(node.actionPayload);
        if (!same) changed++;
    }

    const draftIds = new Set(draft.map((n) => n.id));
    for (const node of published) {
        if (!draftIds.has(node.id)) changed++;
    }

    return changed;
}

export default function SupportChatBuilderPage() {
    const [nodes, setNodes] = useState<SupportChatNode[]>(CHAT_TREE);
    const [settings, setSettings] = useState<SupportChatSettings>(DEFAULT_SETTINGS);
    const [versions, setVersions] = useState<SupportChatVersion[]>(CHAT_VERSIONS);
    const [selectedId, setSelectedId] = useState<string | null>(CHAT_TREE[0]?.id ?? null);
    const [expanded, setExpanded] = useState<Set<string>>(
        () => new Set(CHAT_TREE.filter((n) => n.parentId === null).map((n) => n.id)),
    );
    const [tab, setTab] = useState<TabKey>("tree");
    const [lastPatch, setLastPatch] = useState<ReorderPatch[]>([]);

    const issues = useMemo(() => validateTree(nodes), [nodes]);
    const errorCount = countErrors(issues);

    const published = versions.find((v) => v.status === "PUBLISHED");
    const pendingChanges = useMemo(
        () => diffCount(nodes, published?.snapshot ?? []),
        [nodes, published],
    );

    const selected = findNode(nodes, selectedId);

    // ── Операции над черновиком ──────────────────────────────────────────

    const touch = (node: SupportChatNode): SupportChatNode => ({
        ...node,
        updatedBy: EDITOR_NAME,
        updatedAt: new Date().toISOString(),
    });

    const updateNode = (id: string, patch: Partial<SupportChatNode>): void => {
        setNodes((prev) => prev.map((n) => (n.id === id ? touch({ ...n, ...patch }) : n)));
    };

    const addChild = (parentId: string | null): void => {
        const siblings = childrenOf(nodes, parentId, true);
        const node = makeNode(parentId, siblings.length, EDITOR_NAME);

        setNodes((prev) =>
            // Родитель, ставший контейнером, обязан быть меню.
            [
                ...(parentId
                    ? prev.map((n) => (n.id === parentId ? { ...n, nodeType: "MENU" as const } : n))
                    : prev),
                node,
            ],
        );
        setSelectedId(node.id);
        if (parentId) setExpanded((prev) => new Set(prev).add(parentId));
    };

    /** Копирует узел вместе со всем поддеревом, выдавая копиям новые id. */
    const duplicateNode = (id: string): void => {
        const source = findNode(nodes, id);
        if (!source) return;

        const subtree = [source, ...descendantsOf(nodes, id)];
        const suffix = Date.now().toString(16);
        const idMap = new Map<string, string>();
        subtree.forEach((n, i) => idMap.set(n.id, `copy-${i}-${suffix}`));

        const siblings = childrenOf(nodes, source.parentId, true);
        const stamp = new Date().toISOString();
        const copies: SupportChatNode[] = subtree.map((n) => ({
            ...n,
            id: idMap.get(n.id) as string,
            parentId: n.id === id ? n.parentId : (idMap.get(n.parentId ?? "") ?? n.parentId),
            title: n.id === id ? `${n.title} (копия)` : n.title,
            sortOrder: n.id === id ? siblings.length : n.sortOrder,
            updatedBy: EDITOR_NAME,
            updatedAt: stamp,
        }));

        setNodes((prev) => [...prev, ...copies]);
        setSelectedId(idMap.get(id) ?? null);
    };

    /** Удаляет узел вместе с потомками — как restrictOnDelete на бэке не даст осиротеть. */
    const deleteNode = (id: string): void => {
        const doomed = new Set([id, ...descendantsOf(nodes, id).map((n) => n.id)]);
        const rest = nodes.filter((n) => !doomed.has(n.id));
        setNodes(rest);
        if (selectedId && doomed.has(selectedId)) setSelectedId(rest[0]?.id ?? null);
    };

    const toggleActive = (id: string): void => {
        setNodes((prev) => prev.map((n) => (n.id === id ? touch({ ...n, isActive: !n.isActive }) : n)));
    };

    /** BE-04: перенос одним патчем, без промежуточных состояний дерева. */
    const moveNode = (nodeId: string, newParentId: string | null, newIndex: number): void => {
        const patches = reorder(nodes, nodeId, newParentId, newIndex);
        if (patches.length === 0) return;

        const moved = applyPatches(nodes, patches, EDITOR_NAME);
        // Узел, получивший вложенность, перестаёт быть ответом.
        setNodes(
            newParentId
                ? moved.map((n) => (n.id === newParentId ? { ...n, nodeType: "MENU" as const } : n))
                : moved,
        );
        setLastPatch(patches);
        if (newParentId) setExpanded((prev) => new Set(prev).add(newParentId));
    };

    const nudge = (id: string, direction: -1 | 1): void => {
        const node = findNode(nodes, id);
        if (!node) return;
        const siblings = childrenOf(nodes, node.parentId, true);
        const pos = siblings.findIndex((n) => n.id === id);
        const target = pos + direction;
        if (target < 0 || target >= siblings.length) return;
        moveNode(id, node.parentId, target);
    };

    const toggleExpand = (id: string): void => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const publish = (): void => {
        if (errorCount > 0 || pendingChanges === 0) return;
        const nextVersion = Math.max(...versions.map((v) => v.version)) + 1;
        setVersions((prev) => [
            {
                id: nextVersion,
                version: nextVersion,
                status: "PUBLISHED",
                publishedAt: new Date().toISOString(),
                publishedBy: EDITOR_NAME,
                nodeCount: nodes.length,
                snapshot: nodes,
            },
            ...prev.map((v) => ({ ...v, status: "ARCHIVED" as const })),
        ]);
    };

    const restoreVersion = (version: SupportChatVersion): void => {
        setNodes(version.snapshot);
        setSelectedId(version.snapshot[0]?.id ?? null);
        setTab("tree");
    };

    // ── Разметка ─────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar activeKey="chat-builder" />

            <div className="flex-1 min-w-0 flex flex-col h-screen">
                <header className="border-b border-border bg-card px-5 py-2.5 flex items-center gap-4 shrink-0">
                    <div className="min-w-0">
                        <div className="text-[10px] text-muted-foreground">
                            Техподдержка › Конструктор чата
                        </div>
                        <h1 className="text-sm font-semibold truncate">Дерево частых вопросов</h1>
                    </div>

                    <div className="flex items-center gap-2 ml-auto shrink-0">
                        <Link
                            href="/support-mobile"
                            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                        >
                            <Smartphone className="h-3 w-3" />
                            Как видит пользователь
                            <ExternalLink className="h-2.5 w-2.5" />
                        </Link>

                        <span
                            className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                                pendingChanges > 0
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-muted text-muted-foreground"
                            }`}
                        >
                            {pendingChanges > 0
                                ? `Черновик · ${pendingChanges} изм.`
                                : `Совпадает с v${published?.version ?? "—"}`}
                        </span>

                        {errorCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-medium bg-red-100 text-red-700">
                                <AlertCircle className="h-3 w-3" />
                                {errorCount} ошибок
                            </span>
                        )}

                        <button
                            type="button"
                            onClick={publish}
                            disabled={errorCount > 0 || pendingChanges === 0}
                            title={
                                errorCount > 0
                                    ? "Сначала исправьте ошибки валидации"
                                    : pendingChanges === 0
                                      ? "Черновик не отличается от опубликованной версии"
                                      : "Опубликовать новую версию"
                            }
                            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Upload className="h-3.5 w-3.5" />
                            Опубликовать
                        </button>
                    </div>
                </header>

                <nav className="border-b border-border bg-card px-5 flex gap-1 shrink-0">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => setTab(t.key)}
                            className={`px-3 py-2 text-xs border-b-2 transition-colors ${
                                tab === t.key
                                    ? "border-primary text-primary font-medium"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </nav>

                {tab === "tree" && (
                    <div className="flex-1 min-h-0 flex">
                        <div className="w-[320px] shrink-0">
                            <TreePanel
                                nodes={nodes}
                                selectedId={selectedId}
                                expanded={expanded}
                                issues={issues}
                                onSelect={setSelectedId}
                                onToggleExpand={toggleExpand}
                                onMove={moveNode}
                                onAddChild={addChild}
                                onDuplicate={duplicateNode}
                                onDelete={deleteNode}
                                onToggleActive={toggleActive}
                                onNudge={nudge}
                            />
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col">
                            {lastPatch.length > 0 && (
                                <div className="border-b border-border bg-blue-50/60 px-5 py-2 flex items-start gap-2">
                                    <ArrowRightLeft className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-px" />
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[10px] font-medium text-blue-800">
                                            Перенос ушёл бы одним запросом — PATCH /admin/support-chat/reorder
                                        </div>
                                        <div className="text-[10px] font-mono text-blue-700/80 truncate">
                                            {JSON.stringify(lastPatch)}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setLastPatch([])}
                                        aria-label="Скрыть"
                                        className="shrink-0 text-blue-600"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            )}
                            <NodeEditor
                                node={selected}
                                nodes={nodes}
                                settings={settings}
                                onChange={(patch) => selectedId && updateNode(selectedId, patch)}
                            />
                        </div>

                        <PhonePreview node={selected} nodes={nodes} settings={settings} />
                    </div>
                )}

                {tab === "settings" && (
                    <SettingsTab
                        settings={settings}
                        onChange={(patch) => setSettings((prev) => ({ ...prev, ...patch }))}
                    />
                )}

                {tab === "versions" && <VersionsTab versions={versions} onRestore={restoreVersion} />}

                {tab === "io" && (
                    <ImportExportTab
                        nodes={nodes}
                        settings={settings}
                        onImport={(imported, importedSettings) => {
                            setNodes(imported);
                            setSettings(importedSettings);
                            setSelectedId(imported[0]?.id ?? null);
                        }}
                    />
                )}
            </div>
        </div>
    );
}
