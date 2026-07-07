import Link from "next/link";
import {
    Bell,
    LogOut,
    Paperclip,
    Send,
    Search,
    Plus,
    Filter,
    ArrowUpDown,
    RefreshCcw,
    ExternalLink,
    X,
    FileText,
    Image as ImageIcon,
    LinkIcon,
    ChevronRight,
    Lock,
    CheckCheck,
} from "lucide-react";
import { Sidebar } from "../_support-shared/Sidebar";
import {
    TICKETS,
    STATUS_LABEL,
    STATUS_COLOR,
    formatShortTime,
    formatDate,
    Ticket,
    ChatMessage,
} from "../_support-shared/mockData";

/**
 * Demo: web-ERP страница техподдержки для пользователя (клиент B2B / менеджер).
 * Все state показаны на одной странице: список тикетов, открытый модал с чатом,
 * закрытый модал (read-only), форма создания нового обращения.
 */
export default function SupportUserPage() {
    const myTickets = TICKETS.filter((t) => t.category === "b2b");
    const openTicket = myTickets.find((t) => t.status === "in_progress")!;
    const closedTicket = myTickets.find((t) => t.status === "closed")!;

    return (
        <div className="min-h-screen bg-neutral-50 flex">
            <Sidebar activeKey="user-support" />

            <main className="flex-1 min-w-0">
                <Header />

                <div className="p-4 space-y-4">
                    <TopBar />

                    {/* Список обращений */}
                    <section className="bg-white border border-border rounded-md overflow-hidden">
                        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                            <h2 className="text-sm font-semibold">Мои обращения</h2>
                            <span className="text-xs text-muted-foreground">
                                {myTickets.length} тикетов
                            </span>
                        </div>
                        <table className="w-full text-xs">
                            <thead className="bg-muted/30 text-muted-foreground">
                                <tr>
                                    <th className="text-left px-4 py-2 font-medium">Номер</th>
                                    <th className="text-left px-4 py-2 font-medium">Тема</th>
                                    <th className="text-left px-4 py-2 font-medium">Статус</th>
                                    <th className="text-left px-4 py-2 font-medium">Создано</th>
                                    <th className="text-left px-4 py-2 font-medium">Последнее сообщение</th>
                                    <th className="w-8"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {myTickets.map((t, i) => (
                                    <tr key={t.id} className={`border-t border-border ${i % 2 ? "bg-muted/10" : ""} hover:bg-primary/5 cursor-pointer`}>
                                        <td className="px-4 py-3 font-mono text-primary">#{t.number}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{t.title}</div>
                                            <div className="text-[11px] text-muted-foreground truncate max-w-[300px]">
                                                {t.lastMessage}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={t.status} />
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {formatDate(t.createdAt)}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {formatShortTime(
                                                t.messages[t.messages.length - 1].timestamp,
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    {/* Демо state'ов */}
                    <section className="space-y-2">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                            State'ы модального окна чата (показаны раскрытыми для дизайн-референса)
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            <ChatModal ticket={openTicket} readOnly={false} />
                            <ChatModal ticket={closedTicket} readOnly />
                        </div>
                    </section>

                    {/* Форма создания */}
                    <section>
                        <NewTicketDialog />
                    </section>
                </div>
            </main>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// Header
// ═══════════════════════════════════════════════════════════════════════

function Header() {
    return (
        <div className="border-b border-border bg-card px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs">
                <Link href="/support-mobile" className="text-muted-foreground hover:text-foreground flex items-center gap-1">
                    /support-mobile <ExternalLink className="h-3 w-3" />
                </Link>
                <Link href="/support-admin" className="text-muted-foreground hover:text-foreground flex items-center gap-1">
                    /support-admin <ExternalLink className="h-3 w-3" />
                </Link>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right text-xs">
                    <div className="text-muted-foreground">
                        Баланс: <span className="text-foreground font-semibold">426 787 ₸</span>
                    </div>
                    <div className="text-muted-foreground">Комиссия: 4 267,87 ₸</div>
                </div>
                <button className="rounded-md bg-primary text-primary-foreground text-xs px-3 py-1.5 font-medium">
                    Пополнить
                </button>
                <div className="relative">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <span className="absolute -top-1 -right-1 text-[9px] rounded-full bg-red-500 text-white h-4 w-4 flex items-center justify-center font-semibold">
                        3
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                        ИИ
                    </div>
                    <div className="text-xs">
                        <div className="font-medium">Иван Иванов</div>
                        <div className="text-muted-foreground">+7 (701) 554-44-54</div>
                    </div>
                </div>
                <LogOut className="h-4 w-4 text-muted-foreground" />
            </div>
        </div>
    );
}

function TopBar() {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <button className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-medium inline-flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Создать обращение
                </button>
                <button className="text-xs px-3 py-1.5 rounded-md border border-border bg-card inline-flex items-center gap-1.5">
                    <Filter className="h-3.5 w-3.5" />
                    Фильтр
                </button>
                <button className="text-xs px-3 py-1.5 rounded-md border border-border bg-card inline-flex items-center gap-1.5">
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    Сортировка
                </button>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 w-[260px]">
                    <Search className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Поиск по номеру или теме</span>
                </div>
                <button className="text-xs px-3 py-1.5 rounded-md text-white font-medium inline-flex items-center gap-1.5" style={{ backgroundColor: "#3AA76D" }}>
                    <RefreshCcw className="h-3.5 w-3.5" />
                    Обновить
                </button>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// Status badge
// ═══════════════════════════════════════════════════════════════════════

function StatusBadge({ status }: { status: Ticket["status"] }) {
    return (
        <span
            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{
                backgroundColor: `${STATUS_COLOR[status]}18`,
                color: STATUS_COLOR[status],
            }}
        >
            <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: STATUS_COLOR[status] }}
            />
            {STATUS_LABEL[status]}
        </span>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// Chat modal
// ═══════════════════════════════════════════════════════════════════════

function ChatModal({ ticket, readOnly }: { ticket: Ticket; readOnly: boolean }) {
    return (
        <div className="bg-white border border-border rounded-md overflow-hidden shadow-sm flex flex-col h-[560px]">
            <div className="px-4 py-3 border-b border-border flex items-start justify-between">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-primary">#{ticket.number}</span>
                        <StatusBadge status={ticket.status} />
                        {readOnly && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Lock className="h-3 w-3" />
                                только чтение
                            </span>
                        )}
                    </div>
                    <div className="text-sm font-semibold">{ticket.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                        Создано {formatDate(ticket.createdAt)} · {ticket.userName}
                    </div>
                </div>
                <button className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/10">
                {ticket.messages.map((m) => (
                    <WebMessage key={m.id} message={m} />
                ))}
            </div>

            {readOnly ? (
                <div className="border-t border-border bg-muted/20 px-4 py-3">
                    <div className="rounded-md bg-muted/40 border border-border py-2.5 px-3 text-center">
                        <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                            <Lock className="h-3 w-3" />
                            Обращение закрыто {formatDate(ticket.closedAt!)}. Отправка сообщений недоступна.
                        </div>
                    </div>
                </div>
            ) : (
                <div className="border-t border-border bg-white px-4 py-3">
                    <div className="rounded-md border border-border bg-muted/10 p-2 mb-2 flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-medium truncate">screenshot-24-06.png</div>
                            <div className="text-[10px] text-muted-foreground">248 КБ · будет отправлено</div>
                        </div>
                        <button className="text-[10px] text-red-500">✕</button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="h-9 w-9 rounded-md border border-border flex items-center justify-center text-muted-foreground">
                            <Paperclip className="h-4 w-4" />
                        </button>
                        <div className="flex-1 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">
                            Введите сообщение…
                        </div>
                        <button className="h-9 w-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function WebMessage({ message }: { message: ChatMessage }) {
    const isUser = message.author === "user";
    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] flex flex-col ${isUser ? "items-end" : "items-start"} gap-1`}>
                {!isUser && (
                    <div className="text-[10px] text-muted-foreground px-2">{message.authorName}</div>
                )}
                <div
                    className={`rounded-lg px-3 py-2 ${
                        isUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-white border border-border"
                    }`}
                >
                    <div className="text-xs leading-relaxed">{message.text}</div>
                    {message.attachments?.map((a, i) => (
                        <div
                            key={i}
                            className={`mt-2 rounded-md p-2 flex items-center gap-2 ${
                                isUser ? "bg-primary-foreground/15" : "bg-muted/40"
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
                                <div className="text-[11px] font-medium truncate">{a.name}</div>
                                {a.size && (
                                    <div className={`text-[10px] ${isUser ? "opacity-80" : "text-muted-foreground"}`}>
                                        {a.size}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-1 px-2 text-[10px] text-muted-foreground">
                    <span>{formatShortTime(message.timestamp)}</span>
                    {isUser && <CheckCheck className="h-3 w-3 text-blue-500" />}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// New ticket dialog
// ═══════════════════════════════════════════════════════════════════════

function NewTicketDialog() {
    return (
        <div className="bg-white border border-border rounded-md overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold">Новое обращение</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                        Опишите проблему — админ техподдержки увидит её на канбан-доске с пометкой «B2B»
                    </p>
                </div>
                <button className="text-muted-foreground">
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mb-1 block">
                        Тема
                    </label>
                    <div className="rounded-md border border-border px-3 py-2 text-xs">
                        Не проходит оплата через Prosper Pay
                    </div>
                </div>
                <div>
                    <label className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mb-1 block">
                        Категория
                    </label>
                    <div className="rounded-md border border-border px-3 py-2 text-xs flex items-center justify-between">
                        <span>Оплата</span>
                        <span className="text-muted-foreground">▾</span>
                    </div>
                </div>
                <div className="md:col-span-2">
                    <label className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mb-1 block">
                        Описание проблемы
                    </label>
                    <div className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground min-h-[90px]">
                        У нас с 10:00 не проходят выплаты через Prosper. Кассир видит ошибку 500…
                    </div>
                </div>
                <div className="md:col-span-2">
                    <label className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mb-1 block">
                        Прикрепить файлы / ссылки
                    </label>
                    <div className="rounded-md border-2 border-dashed border-border px-3 py-4 text-xs text-muted-foreground text-center flex flex-col items-center gap-1">
                        <Paperclip className="h-4 w-4" />
                        Скриншот, документ или ссылка на страницу
                    </div>
                </div>
            </div>

            <div className="border-t border-border bg-muted/10 px-4 py-3 flex items-center justify-end gap-2">
                <button className="text-xs px-3 py-1.5 rounded-md border border-border">
                    Отмена
                </button>
                <button className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-medium">
                    Отправить обращение
                </button>
            </div>
        </div>
    );
}
