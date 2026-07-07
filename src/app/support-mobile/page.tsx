import Link from "next/link";
import { ArrowLeft, Paperclip, Send, Search, Plus, Bell, Battery, Wifi, Signal, ChevronRight, FileText, Image as ImageIcon, LinkIcon, CheckCheck, Home, MessageSquare, User, Briefcase } from "lucide-react";
import { TICKETS, STATUS_LABEL, STATUS_COLOR, formatShortTime, formatDate } from "../_support-shared/mockData";

/**
 * Демо мобильного экрана техподдержки (для исполнителя-юзера).
 * Показаны 4 состояния бок-о-бок в фреймах телефона:
 *   1. Список обращений
 *   2. Активный чат с новым сообщением
 *   3. Чат с прикреплённым файлом
 *   4. Закрытое обращение (read-only)
 */

export default function SupportMobilePage() {
    const activeTicket = TICKETS.find((t) => t.id === 3)!;
    const closedTicket = TICKETS.find((t) => t.id === 5)!;
    const userTickets = TICKETS.filter((t) => t.category === "executor");

    return (
        <div className="min-h-screen bg-neutral-100 py-8">
            <div className="container mx-auto px-4 mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold">Мобильное приложение · Техподдержка</h1>
                    <p className="text-xs text-muted-foreground">
                        Демо-скрины экранов чата с техподдержкой (мок-данные). Все state в одной верстке.
                    </p>
                </div>
                <div className="flex gap-3 text-xs">
                    <Link href="/support-user" className="text-primary hover:underline">/support-user →</Link>
                    <Link href="/support-admin" className="text-primary hover:underline">/support-admin →</Link>
                </div>
            </div>

            <div className="container mx-auto px-4 flex gap-8 flex-wrap justify-center">
                <PhoneFrame label="1. Список моих обращений">
                    <ListScreen tickets={userTickets} />
                </PhoneFrame>

                <PhoneFrame label="2. Активный чат">
                    <ChatScreen ticket={activeTicket} readOnly={false} showTyping />
                </PhoneFrame>

                <PhoneFrame label="3. Прикрепления и ссылки">
                    <ChatScreen ticket={activeTicket} readOnly={false} showAttachmentComposer />
                </PhoneFrame>

                <PhoneFrame label="4. Закрытое обращение (read-only)">
                    <ChatScreen ticket={closedTicket} readOnly />
                </PhoneFrame>

                <PhoneFrame label="5. Новое обращение">
                    <NewTicketScreen />
                </PhoneFrame>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// Phone frame
// ═══════════════════════════════════════════════════════════════════════

function PhoneFrame({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center gap-3">
            <div
                className="relative bg-black rounded-[42px] p-2 shadow-2xl"
                style={{ width: 320, height: 660 }}
            >
                <div className="w-full h-full bg-white rounded-[34px] overflow-hidden relative flex flex-col">
                    {/* Notch */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 h-5 w-24 bg-black rounded-full z-10" />
                    {children}
                </div>
            </div>
            <div className="text-xs text-muted-foreground font-medium">{label}</div>
        </div>
    );
}

function StatusBar() {
    return (
        <div className="flex items-center justify-between px-6 pt-3 pb-1 text-[11px] font-semibold text-black">
            <span>9:41</span>
            <div className="flex items-center gap-1">
                <Signal className="h-3 w-3" />
                <Wifi className="h-3 w-3" />
                <Battery className="h-4 w-4" />
            </div>
        </div>
    );
}

function BottomTabBar({ active }: { active: "home" | "orders" | "messages" | "profile" }) {
    const items: { key: typeof active; icon: React.ReactNode; label: string }[] = [
        { key: "home", icon: <Home className="h-5 w-5" />, label: "Объявления" },
        { key: "orders", icon: <Briefcase className="h-5 w-5" />, label: "Мои заказы" },
        { key: "messages", icon: <MessageSquare className="h-5 w-5" />, label: "Сообщения" },
        { key: "profile", icon: <User className="h-5 w-5" />, label: "Профиль" },
    ];
    return (
        <div className="border-t border-neutral-200 bg-white px-2 py-2 pb-4 flex items-center justify-around">
            {items.map((it) => (
                <div
                    key={it.key}
                    className={`flex flex-col items-center gap-0.5 ${
                        it.key === active ? "text-blue-600" : "text-neutral-400"
                    }`}
                >
                    {it.icon}
                    <span className="text-[9px] font-medium">{it.label}</span>
                </div>
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// Screen 1: List of tickets
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
// Screen 2/3/4: Chat
// ═══════════════════════════════════════════════════════════════════════

function ChatScreen({
    ticket,
    readOnly,
    showTyping,
    showAttachmentComposer,
}: {
    ticket: (typeof TICKETS)[number];
    readOnly: boolean;
    showTyping?: boolean;
    showAttachmentComposer?: boolean;
}) {
    return (
        <div className="flex flex-col h-full bg-neutral-50">
            <StatusBar />
            <div className="px-3 pt-1 pb-2 border-b border-neutral-100 bg-white flex items-center gap-2">
                <ArrowLeft className="h-4 w-4 text-black shrink-0" />
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
                    А
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-black truncate">Айгуль (техподдержка)</div>
                    <div className="text-[10px] flex items-center gap-1">
                        {readOnly ? (
                            <span className="text-neutral-400">Обращение закрыто</span>
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

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                {ticket.messages.map((m) => (
                    <MessageBubble key={m.id} message={m} />
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

            {readOnly ? (
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

function MessageBubble({ message }: { message: (typeof TICKETS)[number]["messages"][number] }) {
    const isUser = message.author === "user";
    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
                {!isUser && (
                    <div className="text-[10px] text-neutral-400 px-2">{message.authorName}</div>
                )}
                <div
                    className={`rounded-2xl px-3 py-2 ${
                        isUser
                            ? "bg-blue-600 text-white rounded-br-md"
                            : "bg-white text-black border border-neutral-200 rounded-bl-md"
                    }`}
                >
                    <div className="text-xs leading-relaxed">{message.text}</div>
                    {message.attachments?.map((a, i) => (
                        <div
                            key={i}
                            className={`mt-2 rounded-lg p-2 flex items-center gap-2 ${
                                isUser ? "bg-blue-500/40" : "bg-neutral-100"
                            }`}
                        >
                            {a.kind === "image" ? (
                                <ImageIcon className="h-3.5 w-3.5 shrink-0" />
                            ) : a.kind === "link" ? (
                                <LinkIcon className="h-3.5 w-3.5 shrink-0" />
                            ) : (
                                <FileText className="h-3.5 w-3.5 shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                                <div className="text-[10px] font-medium truncate">{a.name}</div>
                                {a.size && (
                                    <div className={`text-[9px] ${isUser ? "opacity-80" : "text-neutral-500"}`}>
                                        {a.size}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <div className={`flex items-center gap-1 px-2 text-[10px] ${isUser ? "text-neutral-400" : "text-neutral-400"}`}>
                    <span>{formatShortTime(message.timestamp)}</span>
                    {isUser && <CheckCheck className="h-3 w-3 text-blue-500" />}
                </div>
            </div>
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
// Screen 5: New ticket
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
