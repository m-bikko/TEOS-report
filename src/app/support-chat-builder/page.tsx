"use client";

/**
 * Демо: конструктор дерева частых вопросов чата техподдержки (web-ERP).
 *
 * Оформление — по брендбуку TEOS и скриншотам реального ERP: Open Sans,
 * синий #3563e9, серые подложки полей, системные цвета только на состояниях.
 *
 * Покрывает задачи бэкенда:
 *   BE-01 — модель узлов и настроек, двуязычный контент;
 *   BE-03 — CRUD черновика с валидацией (циклы, ANSWER без потомков);
 *   BE-04 — перенос узлов одним патчем parent_id/sort_order;
 *   BE-05 — настройки чата.
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
    ListTree,
} from "lucide-react";
import { Sidebar } from "../_support-shared/Sidebar";
import {
    CHAT_TREE,
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
} from "../_support-shared/chatTree";
import { Button, PillTabs } from "../_support-shared/brand";
import { TreePanel } from "./TreePanel";
import { NodeEditor } from "./NodeEditor";
import { PhonePreview } from "./PhonePreview";
import { SettingsTab } from "./SettingsTab";

type TabKey = "tree" | "settings";

const TABS: { key: TabKey; label: string }[] = [
    { key: "tree", label: "Дерево" },
    { key: "settings", label: "Настройки" },
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
            before.titleRu === node.titleRu &&
            before.titleKz === node.titleKz &&
            before.bodyRu === node.bodyRu &&
            before.bodyKz === node.bodyKz &&
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
    /** Снимок последней опубликованной версии — от него считается черновик. */
    const [published, setPublished] = useState<SupportChatNode[]>(CHAT_TREE);
    const [version, setVersion] = useState(3);
    const [selectedId, setSelectedId] = useState<string | null>(CHAT_TREE[0]?.id ?? null);
    const [expanded, setExpanded] = useState<Set<string>>(
        () => new Set(CHAT_TREE.filter((n) => n.parentId === null).map((n) => n.id)),
    );
    const [tab, setTab] = useState<TabKey>("tree");
    const [lastPatch, setLastPatch] = useState<ReorderPatch[]>([]);

    const issues = useMemo(() => validateTree(nodes), [nodes]);
    const errorCount = countErrors(issues);
    const pendingChanges = useMemo(() => diffCount(nodes, published), [nodes, published]);
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

        setNodes((prev) => [
            // Родитель, ставший контейнером, обязан быть меню.
            ...(parentId
                ? prev.map((n) => (n.id === parentId ? { ...n, nodeType: "MENU" as const } : n))
                : prev),
            node,
        ]);
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
            titleRu: n.id === id ? `${n.titleRu} (копия)` : n.titleRu,
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
        setPublished(nodes);
        setVersion((v) => v + 1);
    };

    // ── Разметка ─────────────────────────────────────────────────────────

    return (
        <div className="flex min-h-screen bg-[#f6f7f9] font-sans text-[#222222]">
            <Sidebar activeKey="chat-builder" />

            <div className="flex h-screen min-w-0 flex-1 flex-col">
                <header className="flex shrink-0 items-center gap-4 border-b border-[#e6e8ec] bg-white px-6 py-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[#e8eefc] text-[#3563e9]">
                        <ListTree className="h-5 w-5" />
                    </span>

                    <div className="min-w-0">
                        <div className="text-[11px] text-[#8a9099]">Техподдержка › Конструктор чата</div>
                        <h1 className="truncate text-[17px] font-bold">Дерево частых вопросов</h1>
                    </div>

                    <div className="ml-auto flex shrink-0 items-center gap-3">
                        <Link
                            href="/support-mobile"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#3563e9] hover:underline"
                        >
                            <Smartphone className="h-3.5 w-3.5" />
                            Как видит пользователь
                            <ExternalLink className="h-3 w-3" />
                        </Link>

                        <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                pendingChanges > 0
                                    ? "bg-[#fff0db] text-[#b56c00]"
                                    : "bg-[#dbf1e8] text-[#07733a]"
                            }`}
                        >
                            {pendingChanges > 0
                                ? `Черновик · ${pendingChanges} изм.`
                                : `Опубликовано · v${version}`}
                        </span>

                        {errorCount > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#fce0e0] px-2.5 py-1 text-[11px] font-semibold text-[#ec2d30]">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {errorCount} ошибок
                            </span>
                        )}

                        <Button
                            onClick={publish}
                            disabled={errorCount > 0 || pendingChanges === 0}
                            title={
                                errorCount > 0
                                    ? "Сначала исправьте ошибки валидации"
                                    : pendingChanges === 0
                                      ? "Черновик не отличается от опубликованной версии"
                                      : "Опубликовать новую версию"
                            }
                        >
                            <Upload className="h-4 w-4" />
                            Опубликовать
                        </Button>
                    </div>
                </header>

                <nav className="shrink-0 border-b border-[#e6e8ec] bg-white px-6 py-2">
                    <PillTabs tabs={TABS} active={tab} onChange={setTab} />
                </nav>

                {tab === "tree" ? (
                    <div className="flex min-h-0 flex-1">
                        <div className="w-[296px] shrink-0">
                            <TreePanel
                                nodes={nodes}
                                selectedId={selectedId}
                                expanded={expanded}
                                issues={issues}
                                onSelect={setSelectedId}
                                onToggleExpand={toggleExpand}
                                onMove={moveNode}
                                onAddChild={addChild}
                                onToggleActive={toggleActive}
                                onNudge={nudge}
                            />
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col">
                            {lastPatch.length > 0 && (
                                <div className="flex items-start gap-2 border-b border-[#e6e8ec] bg-[#e2eafb] px-6 py-2.5">
                                    <ArrowRightLeft className="mt-px h-4 w-4 shrink-0 text-[#2d7bef]" />
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[11.5px] font-semibold text-[#1d4fa8]">
                                            Перенос ушёл бы одним запросом — PATCH /admin/support-chat/reorder
                                        </div>
                                        <div className="truncate font-mono text-[11px] text-[#2d7bef]">
                                            {JSON.stringify(lastPatch)}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setLastPatch([])}
                                        aria-label="Скрыть"
                                        className="shrink-0 text-[#2d7bef]"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            )}
                            <NodeEditor
                                node={selected}
                                nodes={nodes}
                                settings={settings}
                                onChange={(patch) => selectedId && updateNode(selectedId, patch)}
                                onDuplicate={duplicateNode}
                                onDelete={deleteNode}
                            />
                        </div>

                        <PhonePreview node={selected} nodes={nodes} settings={settings} />
                    </div>
                ) : (
                    <SettingsTab
                        settings={settings}
                        onChange={(patch) => setSettings((prev) => ({ ...prev, ...patch }))}
                    />
                )}
            </div>
        </div>
    );
}
