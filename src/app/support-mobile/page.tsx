import Link from "next/link";
import {
    ArrowLeft,
    Paperclip,
    Send,
    Search,
    Plus,
    Bell,
    ChevronRight,
    Image as ImageIcon,
    Bot,
} from "lucide-react";
import { TICKETS, STATUS_LABEL, STATUS_COLOR, formatShortTime, formatDate } from "../_support-shared/mockData";
import { DEFAULT_SETTINGS, CHAT_TREE, pathTo } from "../_support-shared/chatTree";
import { PhoneFrame, StatusBar, BottomTabBar } from "../_support-shared/PhoneFrame";
import { MessageBubble, HandoffDivider } from "../_support-shared/ChatBubbles";
import { BotChatDemo } from "./BotChatDemo";

/**
 * Демо мобильных экранов техподдержки (для исполнителя-юзера).
 * Состояния показаны бок-о-бок в рамках телефона:
 *   1. Список обращений
 *   2. Живое демо дерева частых вопросов (интерактив)
 *   3-5. Шаги дерева: стартовое меню → вложенный уровень → автоответ
 *   6. Эскалация: тот же тред подхватывает живой оператор
 *   7-10. Переписка с оператором, прикрепления, закрытое обращение, форма
 */

export default function SupportMobilePage() {
    const activeTicket = TICKETS.find((t) => t.id === 3)!;
    const closedTicket = TICKETS.find((t) => t.id === 5)!;
    const botTicket = TICKETS.find((t) => t.id === 7)!;
    const userTickets = TICKETS.filter((t) => t.category === "executor");

    return (
        <div className="min-h-screen bg-neutral-100 py-8">
            <div className="container mx-auto px-4 mb-6 flex items-start justify-between gap-6">
                <div>
                    <h1 className="text-lg font-semibold">Мобильное приложение · Техподдержка</h1>
                    <p className="text-xs text-muted-foreground max-w-2xl">
                        Демо-скрины чата с техподдержкой на мок-данных. Обращение начинается с дерева
                        частых вопросов: ответы бота помечены «Автоответ», ответы живого оператора —
                        «Техподдержка». Дерево редактируется в ERP.
                    </p>
                </div>
                <div className="flex gap-3 text-xs shrink-0 pt-1">
                    <Link href="/support-chat-builder" className="text-primary hover:underline">
                        /support-chat-builder →
                    </Link>
                    <Link href="/support-user" className="text-primary hover:underline">/support-user →</Link>
                    <Link href="/support-admin" className="text-primary hover:underline">/support-admin →</Link>
                </div>
            </div>

            <div className="container mx-auto px-4 flex gap-8 flex-wrap justify-center">
                <PhoneFrame label="1. Список моих обращений">
                    <ListScreen tickets={userTickets} />
                </PhoneFrame>

                <PhoneFrame label="2. Живое демо: дерево кликабельно" accent>
                    <BotChatDemo />
                </PhoneFrame>

                <PhoneFrame label="3. Дерево: стартовое меню">
                    <ChatScreen ticket={botTicket} readOnly to={1} composer="tree" />
                </PhoneFrame>

                <PhoneFrame label="4. Дерево: вложенный уровень">
                    <ChatScreen ticket={botTicket} readOnly from={1} to={5} composer="tree" showCrumbs />
                </PhoneFrame>

                <PhoneFrame label="5. Автоответ и кнопки исхода">
                    <ChatScreen ticket={botTicket} readOnly from={5} to={7} composer="tree" showCrumbs />
                </PhoneFrame>

                <PhoneFrame label="6. Эскалация: подключился оператор">
                    <ChatScreen ticket={botTicket} readOnly={false} from={6} showCrumbs />
                </PhoneFrame>

                <PhoneFrame label="7. Переписка с оператором">
                    <ChatScreen ticket={activeTicket} readOnly={false} showTyping />
                </PhoneFrame>

                <PhoneFrame label="8. Прикрепления и ссылки">
                    <ChatScreen ticket={activeTicket} readOnly={false} showAttachmentComposer />
                </PhoneFrame>

                <PhoneFrame label="9. Закрытое обращение (read-only)">
                    <ChatScreen ticket={closedTicket} readOnly />
                </PhoneFrame>

                <PhoneFrame label="10. Обращение вручную, мимо дерева">
                    <NewTicketScreen />
                </PhoneFrame>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// Экран 1: список обращений
// ═══════════════════════════════════════════════════════════════════════

function ListScreen({ tickets }: { tickets: typeof TICKETS }) {
    return (
        <div className="flex flex-col h-full">
            <StatusBar />
            <div className="px-4 pt-2 pb-3 border-b border-neutral-100 flex items-center justify-between">
                <div>
                    <div className="text-xs text-neutral-500">Мои обращения</div>
                    <div className="text-lg font-bold text-black">Техподдержка</div>
                </div>
                <button className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                    <Plus className="h-4 w-4" />
                </button>
            </div>

            <div className="px-4 py-2 border-b border-neutral-100">
                <div className="flex items-center gap-2 rounded-lg bg-neutral-100 px-3 py-2">
                    <Search className="h-3.5 w-3.5 text-neutral-400" />
                    <span className="text-xs text-neutral-400">Поиск обращений</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {tickets.map((t, i) => (
                    <div
                        key={t.id}
                        className={`px-4 py-3 border-b border-neutral-100 ${i === 0 ? "bg-blue-50/50" : ""}`}
                    >
                        <div className="flex items-start gap-2">
                            <div
                                className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                                style={{ backgroundColor: STATUS_COLOR[t.status] }}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between gap-2">
                                    <div className="text-xs font-semibold text-black truncate">{t.title}</div>
                                    <div className="text-[10px] text-neutral-400 shrink-0">
                                        {formatShortTime(t.messages[t.messages.length - 1].timestamp)}
                                    </div>
                                </div>
                                <div className="text-[11px] text-neutral-500 truncate mt-0.5">
                                    {t.lastMessage}
                                </div>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span
                                        className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                                        style={{
                                            backgroundColor: `${STATUS_COLOR[t.status]}15`,
                                            color: STATUS_COLOR[t.status],
                                        }}
                                    >
                                        {STATUS_LABEL[t.status]}
                                    </span>
                                    {t.resolvedByBot && (
                                        <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-neutral-200 text-neutral-600">
                                            <Bot className="h-2.5 w-2.5" />
                                            Автоответ
                                        </span>
                                    )}
                                    <span className="text-[9px] text-neutral-400">#{t.number}</span>
                                </div>
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 text-neutral-300 shrink-0 mt-1" />
                        </div>
                    </div>
                ))}
            </div>

            <BottomTabBar active="messages" />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// Экраны чата
// ═══════════════════════════════════════════════════════════════════════

function ChatScreen({
    ticket,
    readOnly,
    showTyping,
    showAttachmentComposer,
    showCrumbs,
    from,
    to,
    composer,
}: {
    ticket: (typeof TICKETS)[number];
    readOnly: boolean;
    showTyping?: boolean;
    showAttachmentComposer?: boolean;
    showCrumbs?: boolean;
    /**
     * Окно сообщений [from, to) — витрина показывает шаги дерева покадрово.
     * Именно окно, а не первые N: экран телефона короче всей переписки,
     * и с начала ленты интересная часть кадра оказалась бы ниже сгиба.
     */
    from?: number;
    to?: number;
    /** "tree" — вместо поля ввода подсказка, что идёт разговор с помощником. */
    composer?: "tree";
}) {
    const messages = ticket.messages.slice(from ?? 0, to);
    const firstSupportIndex = messages.findIndex((m) => m.author === "support");
    const hasBot = messages.some((m) => m.author === "bot");

    const lastPicked = [...messages].reverse().find((m) => m.pickedNodeId)?.pickedNodeId ?? null;
    const crumbs = showCrumbs ? pathTo(CHAT_TREE, lastPicked) : [];

    return (
        <div className="flex flex-col h-full bg-neutral-50">
            <StatusBar />
            <div className="px-3 pt-1 pb-2 border-b border-neutral-100 bg-white flex items-center gap-2">
                <ArrowLeft className="h-4 w-4 text-black shrink-0" />
                <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        hasBot && firstSupportIndex === -1
                            ? "bg-neutral-200 text-neutral-600"
                            : "bg-blue-100 text-blue-600"
                    }`}
                >
                    {hasBot && firstSupportIndex === -1 ? "ТП" : "А"}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-black truncate">
                        {hasBot && firstSupportIndex === -1 ? "Техподдержка" : "Айгуль (техподдержка)"}
                    </div>
                    <div className="text-[10px] flex items-center gap-1">
                        {readOnly && !hasBot ? (
                            <span className="text-neutral-400">Обращение закрыто</span>
                        ) : hasBot && firstSupportIndex === -1 ? (
                            <span className="text-neutral-500">Отвечает помощник</span>
                        ) : (
                            <>
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                                <span className="text-neutral-500">В сети</span>
                            </>
                        )}
                    </div>
                </div>
                <Bell className="h-4 w-4 text-neutral-400 shrink-0" />
            </div>

            <div className="px-3 py-2 border-b border-neutral-100 bg-white">
                <div className="text-[10px] text-neutral-400 uppercase tracking-wide">#{ticket.number}</div>
                <div className="text-xs font-medium text-black">{ticket.title}</div>
                <div className="flex items-center gap-1.5 mt-1">
                    <span
                        className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{
                            backgroundColor: `${STATUS_COLOR[ticket.status]}15`,
                            color: STATUS_COLOR[ticket.status],
                        }}
                    >
                        {STATUS_LABEL[ticket.status]}
                    </span>
                    <span className="text-[9px] text-neutral-400">
                        создано {formatDate(ticket.createdAt)}
                    </span>
                </div>
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

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                {messages.map((m, i) => (
                    <div key={m.id} className="space-y-2">
                        {/* Разделитель уместен только там, где тред начинал бот. */}
                        {hasBot && i === firstSupportIndex && firstSupportIndex > 0 && (
                            <HandoffDivider at={m.timestamp} />
                        )}
                        <MessageBubble message={m} settings={DEFAULT_SETTINGS} />
                    </div>
                ))}
                {showTyping && (
                    <div className="flex items-end gap-1">
                        <div className="bg-white rounded-2xl rounded-bl-md px-3 py-2 border border-neutral-200">
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-pulse" />
                                <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-pulse" style={{ animationDelay: "0.2s" }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-pulse" style={{ animationDelay: "0.4s" }} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {composer === "tree" ? (
                <div className="border-t border-neutral-200 bg-white px-3 py-3 pb-4">
                    <div className="text-center text-[10px] text-neutral-500 bg-neutral-100 rounded-lg py-2 px-3">
                        Выберите пункт из списка выше
                    </div>
                </div>
            ) : readOnly ? (
                <div className="border-t border-neutral-200 bg-white px-3 py-3 pb-4">
                    <div className="text-center text-[11px] text-neutral-500 bg-neutral-100 rounded-lg py-2 px-3">
                        Обращение закрыто. Отправка сообщений недоступна.
                    </div>
                </div>
            ) : showAttachmentComposer ? (
                <div className="border-t border-neutral-200 bg-white px-3 py-2 pb-4">
                    <div className="rounded-lg bg-neutral-100 p-2 mb-2 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-blue-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-medium text-black truncate">receipt-june.png</div>
                            <div className="text-[10px] text-neutral-500">86 КБ · готов к отправке</div>
                        </div>
                        <button className="text-[10px] text-red-500">✕</button>
                    </div>
                    <Composer />
                </div>
            ) : (
                <div className="border-t border-neutral-200 bg-white px-3 py-2 pb-4">
                    <Composer />
                </div>
            )}
        </div>
    );
}

function Composer() {
    return (
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
    );
}

// ═══════════════════════════════════════════════════════════════════════
// Экран: обращение вручную
// ═══════════════════════════════════════════════════════════════════════

function NewTicketScreen() {
    return (
        <div className="flex flex-col h-full bg-neutral-50">
            <StatusBar />
            <div className="px-4 pt-2 pb-3 border-b border-neutral-100 bg-white flex items-center gap-3">
                <ArrowLeft className="h-4 w-4 text-black" />
                <div className="text-sm font-bold text-black">Новое обращение</div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-[10px] text-blue-700 leading-relaxed">
                    Форма открывается из пункта «{DEFAULT_SETTINGS.fallbackTextRu.slice(0, 28)}…» в конце
                    дерева — когда подходящей ветки не нашлось.
                </div>

                <div>
                    <div className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1 font-medium">
                        Тема обращения
                    </div>
                    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-xs text-black">
                        Не могу подписать АВР
                    </div>
                </div>

                <div>
                    <div className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1 font-medium">
                        Категория
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg border-2 border-blue-600 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-600 text-center">
                            Оплата
                        </div>
                        <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-500 text-center">
                            Профиль
                        </div>
                        <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-500 text-center">
                            Смены
                        </div>
                        <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-500 text-center">
                            Другое
                        </div>
                    </div>
                </div>

                <div>
                    <div className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1 font-medium">
                        Описание проблемы
                    </div>
                    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-xs text-neutral-400 min-h-[100px]">
                        Опишите проблему подробнее…
                    </div>
                </div>

                <div>
                    <div className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1 font-medium">
                        Прикрепить файл
                    </div>
                    <div className="rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 px-3 py-4 text-xs text-neutral-500 text-center flex flex-col items-center gap-1">
                        <Paperclip className="h-4 w-4" />
                        Скриншот, фото или документ
                    </div>
                </div>
            </div>

            <div className="border-t border-neutral-200 bg-white px-4 py-3 pb-4">
                <button className="w-full rounded-lg bg-blue-600 text-white py-3 text-sm font-semibold">
                    Отправить обращение
                </button>
            </div>
        </div>
    );
}
