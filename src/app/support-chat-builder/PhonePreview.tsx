"use client";

/**
 * Правая колонка: как выбранный узел выглядит в мобильном приложении.
 * Использует те же пузыри, что и витрина /support-mobile, — расхождения
 * между конструктором и приложением невозможны by design.
 */

import { ChevronRight } from "lucide-react";
import {
    actionLabel,
    childrenOf,
    pathTo,
    TREE_NOW,
    type SupportChatNode,
    type SupportChatSettings,
} from "../_support-shared/chatTree";
import { BOT_AUTHOR_NAME, type ChatMessage } from "../_support-shared/mockData";
import { PhoneFrame, StatusBar } from "../_support-shared/PhoneFrame";
import { MessageBubble } from "../_support-shared/ChatBubbles";

export function PhonePreview({
    node,
    nodes,
    settings,
}: {
    node: SupportChatNode | null;
    nodes: SupportChatNode[];
    settings: SupportChatSettings;
}) {
    const crumbs = node ? pathTo(nodes, node.id) : [];
    const messages: ChatMessage[] = [];

    if (node) {
        messages.push({
            id: 1,
            ticketId: 0,
            author: "user",
            authorName: "Пользователь",
            text: node.title || "Без заголовка",
            timestamp: TREE_NOW,
        });

        if (node.nodeType === "MENU") {
            messages.push({
                id: 2,
                ticketId: 0,
                author: "bot",
                authorName: BOT_AUTHOR_NAME,
                text: `Уточните вопрос по теме «${node.title || "Без заголовка"}»:`,
                timestamp: TREE_NOW,
                kind: "menu",
                nodeId: node.id,
                options: childrenOf(nodes, node.id).map((n) => ({
                    nodeId: n.id,
                    title: n.title,
                    icon: n.icon,
                })),
            });
        } else {
            messages.push({
                id: 2,
                ticketId: 0,
                author: "bot",
                authorName: BOT_AUTHOR_NAME,
                text: node.body ?? "",
                timestamp: TREE_NOW,
                kind: "answer",
                nodeId: node.id,
                actions:
                    node.actionType === "NONE" || !node.actionPayload
                        ? undefined
                        : [
                              {
                                  type: node.actionType,
                                  label: actionLabel(node.actionPayload, settings),
                                  payload: node.actionPayload,
                              },
                          ],
            });
        }
    }

    return (
        <div className="w-[360px] shrink-0 border-l border-border bg-muted/30 overflow-y-auto">
            <div className="px-4 py-2.5 border-b border-border bg-card">
                <div className="text-xs font-semibold">Превью в приложении</div>
                <div className="text-[10px] text-muted-foreground">
                    {node?.isActive === false
                        ? "Узел выключен — в приложении не показывается"
                        : "Обновляется при выборе узла"}
                </div>
            </div>

            <div className="py-4 flex justify-center">
                <div className={node?.isActive === false ? "opacity-40" : ""}>
                    <PhoneFrame label="">
                        <div className="flex flex-col h-full bg-neutral-50">
                            <StatusBar />
                            <div className="px-3 pt-1 pb-2 border-b border-neutral-100 bg-white flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-600 shrink-0">
                                    ТП
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-semibold text-black">Техподдержка</div>
                                    <div className="text-[10px] text-neutral-500">Отвечает помощник</div>
                                </div>
                            </div>

                            {crumbs.length > 0 && (
                                <div className="px-3 py-1.5 bg-white border-b border-neutral-100 flex items-center gap-1 flex-wrap">
                                    {crumbs.map((c, i) => (
                                        <span key={c.id} className="flex items-center gap-1">
                                            {i > 0 && <ChevronRight className="h-2.5 w-2.5 text-neutral-300" />}
                                            <span className="text-[9px] text-neutral-500">
                                                {c.title || "Без заголовка"}
                                            </span>
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                                {messages.map((m) => (
                                    <MessageBubble key={m.id} message={m} settings={settings} />
                                ))}
                                {node?.nodeType === "MENU" &&
                                    childrenOf(nodes, node.id).length === 0 && (
                                        <div className="text-center text-[10px] text-red-500 bg-red-50 rounded-lg py-2 px-3">
                                            Пустое меню: пользователь упрётся в экран без вариантов
                                        </div>
                                    )}
                            </div>

                            <div className="border-t border-neutral-200 bg-white px-3 py-3 pb-4">
                                <div className="text-center text-[10px] text-neutral-500 bg-neutral-100 rounded-lg py-2 px-3">
                                    Выберите пункт из списка выше
                                </div>
                            </div>
                        </div>
                    </PhoneFrame>
                </div>
            </div>
        </div>
    );
}
