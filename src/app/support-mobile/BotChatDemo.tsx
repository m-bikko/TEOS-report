"use client";

/**
 * Интерактивный проход по дереву частых вопросов внутри рамки телефона.
 *
 * Статичные фреймы не показывают произвольную глубину вложенности — а это
 * суть фичи. Здесь по дереву можно реально кликать на любой уровень,
 * возвращаться назад и доходить до автоответа либо до живого оператора.
 *
 * Состояние — только пройденный путь и исход. Лента сообщений выводится
 * из пути чистой функцией, поэтому «Назад» — это просто path.slice(0, -1).
 */

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Bell, RotateCcw, Paperclip, Send, ChevronRight } from "lucide-react";
import {
    CHAT_TREE,
    DEFAULT_SETTINGS,
    TREE_NOW,
    actionLabel,
    childrenOf,
    findNode,
    pathTo,
} from "../_support-shared/chatTree";
import { BOT_AUTHOR_NAME, type ChatMessage } from "../_support-shared/mockData";
import { StatusBar } from "../_support-shared/PhoneFrame";
import { HandoffDivider, MessageBubble } from "../_support-shared/ChatBubbles";

type Outcome = null | "helped" | "escalated";

const USER_NAME = "Талгат Расулов";
const BASE_TIME = new Date(TREE_NOW).getTime();

/** Детерминированные отметки времени: без new Date() в рендере — иначе рассинхрон гидратации. */
function stamp(step: number): string {
    return new Date(BASE_TIME + step * 60_000).toISOString();
}

/** Лента сообщений целиком выводится из пройденного пути. */
function buildMessages(path: string[], outcome: Outcome): ChatMessage[] {
    const messages: ChatMessage[] = [];
    let step = 0;
    let id = 1;

    const levels: (string | null)[] = [null, ...path];

    for (let i = 0; i < levels.length; i++) {
        const parentId = levels[i];
        const parent = findNode(CHAT_TREE, parentId);
        const options = childrenOf(CHAT_TREE, parentId);

        // Лист: у выбранного узла нет детей — показываем автоответ.
        if (options.length === 0 && parent) {
            messages.push({
                id: id++,
                ticketId: 0,
                author: "bot",
                authorName: BOT_AUTHOR_NAME,
                text: parent.bodyRu ?? "",
                timestamp: stamp(step++),
                kind: "answer",
                nodeId: parent.id,
                actions:
                    parent.actionType === "NONE" || !parent.actionPayload
                        ? undefined
                        : [
                              {
                                  type: parent.actionType,
                                  label: actionLabel(parent.actionPayload, DEFAULT_SETTINGS),
                                  payload: parent.actionPayload,
                              },
                          ],
            });
            break;
        }

        messages.push({
            id: id++,
            ticketId: 0,
            author: "bot",
            authorName: BOT_AUTHOR_NAME,
            text: parent ? `Уточните вопрос по теме «${parent.titleRu}»:` : DEFAULT_SETTINGS.greetingRu,
            timestamp: stamp(step++),
            kind: "menu",
            nodeId: parent?.id,
            options: options.map((n) => ({ nodeId: n.id, title: n.titleRu, icon: n.icon })),
        });

        const picked = findNode(CHAT_TREE, levels[i + 1] ?? null);
        if (picked) {
            messages.push({
                id: id++,
                ticketId: 0,
                author: "user",
                authorName: USER_NAME,
                text: picked.titleRu,
                timestamp: stamp(step++),
                pickedNodeId: picked.id,
            });
        }
    }

    if (outcome === "helped") {
        messages.push({
            id: id++,
            ticketId: 0,
            author: "user",
            authorName: USER_NAME,
            text: DEFAULT_SETTINGS.btnHelpedRu,
            timestamp: stamp(step++),
        });
    }

    if (outcome === "escalated") {
        messages.push({
            id: id++,
            ticketId: 0,
            author: "user",
            authorName: USER_NAME,
            text: DEFAULT_SETTINGS.btnEscalateRu,
            timestamp: stamp(step++),
        });
        messages.push({
            id: id++,
            ticketId: 0,
            author: "support",
            authorName: "Айгуль (техподдержка)",
            text: "Здравствуйте! Вижу, что автоответ не подошёл. Уже смотрю вашу ситуацию — отвечу в течение 15 минут.",
            timestamp: stamp(step + 1),
        });
    }

    return messages;
}

export function BotChatDemo() {
    const [path, setPath] = useState<string[]>([]);
    const [outcome, setOutcome] = useState<Outcome>(null);

    const messages = buildMessages(path, outcome);
    const crumbs = pathTo(CHAT_TREE, path[path.length - 1] ?? null);
    const escalationIndex = messages.findIndex((m) => m.author === "support");

    // Настоящий чат всегда доскроллен к последнему сообщению.
    const feedRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const feed = feedRef.current;
        if (feed) feed.scrollTop = feed.scrollHeight;
    }, [path, outcome]);

    const reset = (): void => {
        setPath([]);
        setOutcome(null);
    };

    const goBack = (): void => {
        if (outcome) {
            setOutcome(null);
            return;
        }
        setPath((p) => p.slice(0, -1));
    };

    return (
        <div className="flex flex-col h-full bg-neutral-50">
            <StatusBar />

            <div className="px-3 pt-1 pb-2 border-b border-neutral-100 bg-white flex items-center gap-2">
                <button
                    type="button"
                    onClick={goBack}
                    disabled={path.length === 0 && !outcome}
                    className="shrink-0 disabled:opacity-30"
                    aria-label="Назад"
                >
                    <ArrowLeft className="h-4 w-4 text-black" />
                </button>
                <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-600 shrink-0">
                    ТП
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-black truncate">Техподдержка</div>
                    <div className="text-[10px] text-neutral-500">
                        {outcome === "escalated" ? "Оператор на линии" : "Отвечает помощник"}
                    </div>
                </div>
                <button type="button" onClick={reset} className="shrink-0" aria-label="Начать заново">
                    <RotateCcw className="h-3.5 w-3.5 text-neutral-400" />
                </button>
                <Bell className="h-4 w-4 text-neutral-400 shrink-0" />
            </div>

            {crumbs.length > 0 && (
                <div className="px-3 py-1.5 bg-white border-b border-neutral-100 flex items-center gap-1 flex-wrap">
                    {crumbs.map((c, i) => (
                        <span key={c.id} className="flex items-center gap-1">
                            {i > 0 && <ChevronRight className="h-2.5 w-2.5 text-neutral-300" />}
                            <span className="text-[9px] text-neutral-500">{c.titleRu}</span>
                        </span>
                    ))}
                </div>
            )}

            <div ref={feedRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                {messages.map((m, i) => (
                    <div key={m.id} className="space-y-2">
                        {i === escalationIndex && escalationIndex > 0 && (
                            <HandoffDivider at={m.timestamp} />
                        )}
                        <MessageBubble
                            message={m}
                            settings={DEFAULT_SETTINGS}
                            onPick={
                                m.kind === "menu" && i === messages.length - 1
                                    ? (nodeId) => setPath((p) => [...p, nodeId])
                                    : undefined
                            }
                            onHelped={
                                m.kind === "answer" && !outcome ? () => setOutcome("helped") : undefined
                            }
                            onEscalate={
                                m.kind === "answer" && !outcome
                                    ? () => setOutcome("escalated")
                                    : undefined
                            }
                        />
                    </div>
                ))}

                {outcome === "helped" && (
                    <div className="text-center text-[10px] text-neutral-500 bg-neutral-100 rounded-lg py-2 px-3">
                        Обращение закрыто автоответом. Оператор не подключался.
                    </div>
                )}
            </div>

            <div className="border-t border-neutral-200 bg-white px-3 py-2 pb-4">
                {outcome === "escalated" ? (
                    <div className="flex items-center gap-2">
                        <button className="h-9 w-9 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                            <Paperclip className="h-4 w-4 text-neutral-500" />
                        </button>
                        <div className="flex-1 rounded-full bg-neutral-100 px-3 py-2 text-xs text-neutral-400">
                            Введите сообщение…
                        </div>
                        <button className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <div className="text-center text-[10px] text-neutral-400 py-1.5">
                        {outcome === "helped"
                            ? "Нажмите ⟲ в шапке, чтобы пройти дерево заново"
                            : "Выберите пункт выше — или дойдите до ответа и позовите оператора"}
                    </div>
                )}
            </div>
        </div>
    );
}
