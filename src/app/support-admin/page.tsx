import Link from "next/link";
import {
    Bell,
    LogOut,
    Paperclip,
    Send,
    Search,
    Timer,
    ExternalLink,
    X,
    FileText,
    Image as ImageIcon,
    LinkIcon,
    CheckCheck,
    CheckCircle2,
    Clock,
    ArrowRight,
    Ticket as TicketIcon,
    TrendingUp,
    Filter,
} from "lucide-react";
import { Sidebar } from "../_support-shared/Sidebar";
import {
    TICKETS,
    STATUS_LABEL,
    STATUS_COLOR,
    CATEGORY_LABEL,
    CATEGORY_COLOR,
    formatShortTime,
    formatDate,
    formatElapsed,
    computeAvgCloseTime,
    Ticket,
    ChatMessage,
    TicketStatus,
    TicketCategory,
} from "../_support-shared/mockData";

/**
 * Demo: web-ERP канбан-доска техподдержки (для админа).
 * Все state показаны на одной странице: канбан с фильтром по категории,
 * метрики, открытый модал с чатом + timeline + кнопка «Обработка завершена».
 */
export default function SupportAdminPage() {
    const avgClose = computeAvgCloseTime(TICKETS);
    const waiting = TICKETS.filter((t) => t.status === "waiting");
    const inProgress = TICKETS.filter((t) => t.status === "in_progress");
    const closed = TICKETS.filter((t) => t.status === "closed");

    const activeChat = TICKETS.find((t) => t.status === "in_progress")!;

    return (
        <div className="min-h-screen bg-neutral-50 flex">
            <Sidebar activeKey="admin-support" />

            <main className="flex-1 min-w-0">
                <Header />

                <div className="p-4 space-y-4">
                    {/* KPI-ряд */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <MetricCard
                            label="Всего активных"
                            value={String(waiting.length + inProgress.length)}
                            hint={`Ожидают ${waiting.length} · В работе ${inProgress.length}`}
                            accent="#118DFF"
                            icon={<TicketIcon className="h-3.5 w-3.5" />}
                        />
                        <MetricCard
                            label="Ожидают ответа"
                            value={String(waiting.length)}
                            hint="Требуется реакция"
                            accent={STATUS_COLOR.waiting}
                            icon={<Clock className="h-3.5 w-3.5" />}
                        />
                        <MetricCard
                            label="Ср. время закрытия"
                            value={avgClose.label}
                            hint={`По ${closed.length} закрытым обращениям`}
                            accent="#3AA76D"
                            icon={<TrendingUp className="h-3.5 w-3.5" />}
                        />
                        <MetricCard
                            label="Закрыто (за всё время)"
                            value={String(closed.length)}
                            hint="Архив"
                            accent="#6B007B"
                            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                        />
                    </div>

                    {/* Фильтр категории */}
                    <div className="bg-white border border-border rounded-md p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground font-medium">
                                Категория:
                            </span>
                            <button className="text-xs px-3 py-1 rounded-full bg-primary text-primary-foreground font-medium">
                                Все ({TICKETS.length})
                            </button>
                            <CategoryPill
                                category="b2b"
                                count={TICKETS.filter((t) => t.category === "b2b").length}
                            />
                            <CategoryPill
                                category="executor"
                                count={TICKETS.filter((t) => t.category === "executor").length}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 w-[240px]">
                                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                    Поиск по обращениям
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Канбан-доска */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                        <KanbanColumn status="waiting" tickets={waiting} />
                        <KanbanColumn status="in_progress" tickets={inProgress} />
                        <KanbanColumn status="closed" tickets={closed} />
                    </div>

                    {/* Модал чата — админ view */}
                    <section className="space-y-2">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                            Модал чата — открыт (state «В работе», admin view)
                        </div>
                        <AdminChatModal ticket={activeChat} />
                    </section>

                    {/* Ещё пример — waiting → показать первое сообщение и кнопку "Взять в работу" */}
                    <section className="space-y-2">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                            Модал чата — новый тикет («Ожидает ответа»)
                        </div>
                        <AdminChatModal ticket={waiting[0]} />
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
            <div>
                <h1 className="text-base font-semibold">Техподдержка · Канбан-доска</h1>
                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                    <Link
                        href="/support-mobile"
                        className="hover:text-foreground flex items-center gap-1"
                    >
                        /support-mobile <ExternalLink className="h-3 w-3" />
                    </Link>
                    <Link
                        href="/support-user"
                        className="hover:text-foreground flex items-center gap-1"
                    >
                        /support-user <ExternalLink className="h-3 w-3" />
                    </Link>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <span className="absolute -top-1 -right-1 text-[9px] rounded-full bg-red-500 text-white h-4 w-4 flex items-center justify-center font-semibold">
                        3
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                        АС
                    </div>
                    <div className="text-xs">
                        <div className="font-medium">Айгуль С.</div>
                        <div className="text-muted-foreground">Админ техподдержки</div>
                    </div>
                </div>
                <LogOut className="h-4 w-4 text-muted-foreground" />
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// KPI cards
// ═══════════════════════════════════════════════════════════════════════

function MetricCard({
    label,
    value,
    hint,
    accent,
    icon,
}: {
    label: string;
    value: string;
    hint: string;
    accent: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="border border-border rounded-md bg-card p-3 relative overflow-hidden">
            <div
                className="absolute top-0 left-0 h-0.5 w-full"
                style={{ backgroundColor: accent }}
            />
            <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                    {label}
                </span>
                <span className="text-muted-foreground">{icon}</span>
            </div>
            <div className="text-2xl font-semibold leading-tight mt-1">{value}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// Category pill (filter)
// ═══════════════════════════════════════════════════════════════════════

function CategoryPill({
    category,
    count,
}: {
    category: TicketCategory;
    count: number;
}) {
    return (
        <button
            className="text-xs px-3 py-1 rounded-full border transition-colors inline-flex items-center gap-1.5"
            style={{
                borderColor: `${CATEGORY_COLOR[category]}40`,
                color: CATEGORY_COLOR[category],
            }}
        >
            <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: CATEGORY_COLOR[category] }}
            />
            {CATEGORY_LABEL[category]}
            <span className="text-muted-foreground">({count})</span>
        </button>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// Kanban column
// ═══════════════════════════════════════════════════════════════════════

function KanbanColumn({ status, tickets }: { status: TicketStatus; tickets: Ticket[] }) {
    return (
        <div className="bg-muted/20 border border-border rounded-md flex flex-col min-h-[400px]">
            <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: STATUS_COLOR[status] }}
                    />
                    <span className="text-xs font-semibold">{STATUS_LABEL[status]}</span>
                </div>
                <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{
                        backgroundColor: `${STATUS_COLOR[status]}18`,
                        color: STATUS_COLOR[status],
                    }}
                >
                    {tickets.length}
                </span>
            </div>

            <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {tickets.length === 0 ? (
                    <div className="text-center text-xs text-muted-foreground py-8">
                        Нет обращений
                    </div>
                ) : (
                    tickets.map((t) => <KanbanCard key={t.id} ticket={t} />)
                )}
            </div>
        </div>
    );
}

function KanbanCard({ ticket }: { ticket: Ticket }) {
    const elapsed = formatElapsed(ticket.statusChangedAt);
    return (
        <div className="bg-white border border-border rounded-md p-3 cursor-pointer hover:border-primary/40 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-primary">#{ticket.number}</span>
                    <span
                        className="text-[9px] px-1.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1"
                        style={{
                            backgroundColor: `${CATEGORY_COLOR[ticket.category]}15`,
                            color: CATEGORY_COLOR[ticket.category],
                        }}
                    >
                        <span
                            className="w-1 h-1 rounded-full"
                            style={{ backgroundColor: CATEGORY_COLOR[ticket.category] }}
                        />
                        {CATEGORY_LABEL[ticket.category]}
                    </span>
                </div>
                {ticket.unreadForAdmin > 0 && (
                    <span className="text-[9px] rounded-full bg-red-500 text-white h-4 w-4 flex items-center justify-center font-semibold">
                        {ticket.unreadForAdmin}
                    </span>
                )}
            </div>

            <div className="text-xs font-semibold text-foreground leading-snug mb-1">
                {ticket.title}
            </div>
            <div className="text-[11px] text-muted-foreground truncate mb-2">
                {ticket.lastMessage}
            </div>

            <div className="border-t border-border pt-2 flex items-center justify-between">
                <div className="text-[10px] text-muted-foreground">
                    <div className="truncate max-w-[130px]">{ticket.userName}</div>
                    {ticket.userCompany && (
                        <div className="truncate max-w-[130px] opacity-75">
                            {ticket.userCompany}
                        </div>
                    )}
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        В статусе
                    </div>
                    <div className="text-[11px] font-semibold inline-flex items-center gap-1">
                        <Timer className="h-3 w-3" />
                        {elapsed}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// Admin chat modal
// ═══════════════════════════════════════════════════════════════════════

function AdminChatModal({ ticket }: { ticket: Ticket }) {
    const isInProgress = ticket.status === "in_progress";
    const isWaiting = ticket.status === "waiting";

    return (
        <div className="bg-white border border-border rounded-md overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-[1fr_280px]">
            {/* Левая колонка: чат */}
            <div className="flex flex-col h-[620px] border-r border-border">
                {/* Header */}
                <div className="px-4 py-3 border-b border-border">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-primary">#{ticket.number}</span>
                            <span
                                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                style={{
                                    backgroundColor: `${STATUS_COLOR[ticket.status]}18`,
                                    color: STATUS_COLOR[ticket.status],
                                }}
                            >
                                {STATUS_LABEL[ticket.status]}
                            </span>
                            <span
                                className="text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1"
                                style={{
                                    backgroundColor: `${CATEGORY_COLOR[ticket.category]}15`,
                                    color: CATEGORY_COLOR[ticket.category],
                                }}
                            >
                                <span
                                    className="w-1 h-1 rounded-full"
                                    style={{ backgroundColor: CATEGORY_COLOR[ticket.category] }}
                                />
                                {CATEGORY_LABEL[ticket.category]}
                            </span>
                        </div>
                        <button className="text-muted-foreground hover:text-foreground">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="text-sm font-semibold">{ticket.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                        {ticket.userName}{ticket.userCompany ? ` · ${ticket.userCompany}` : ""} · {ticket.userPhone}
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/10">
                    {ticket.messages.map((m) => (
                        <WebMessage key={m.id} message={m} />
                    ))}
                </div>

                {/* Composer + actions */}
                <div className="border-t border-border bg-white px-4 py-3">
                    {isInProgress && (
                        <div className="rounded-md bg-emerald-50 border border-emerald-200 p-2.5 mb-2 flex items-center justify-between">
                            <div className="text-xs text-emerald-800">
                                Обращение в работе. При закрытии клиент увидит уведомление.
                            </div>
                            <button className="text-xs px-3 py-1.5 rounded-md text-white font-medium inline-flex items-center gap-1.5 shrink-0" style={{ backgroundColor: "#3AA76D" }}>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Обработка завершена
                            </button>
                        </div>
                    )}
                    {isWaiting && (
                        <div className="rounded-md bg-amber-50 border border-amber-200 p-2.5 mb-2 flex items-center justify-between">
                            <div className="text-xs text-amber-900">
                                Ответьте на сообщение — статус перейдёт в «В работе».
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <button className="h-9 w-9 rounded-md border border-border flex items-center justify-center text-muted-foreground">
                            <Paperclip className="h-4 w-4" />
                        </button>
                        <div className="flex-1 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">
                            Введите ответ клиенту…
                        </div>
                        <button className="h-9 w-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Правая колонка: метрики / история */}
            <aside className="p-3 space-y-3 bg-muted/10 overflow-y-auto">
                <div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1">
                        Клиент
                    </div>
                    <div className="text-xs font-semibold">{ticket.userName}</div>
                    {ticket.userCompany && (
                        <div className="text-[11px] text-muted-foreground">{ticket.userCompany}</div>
                    )}
                    <div className="text-[11px] text-muted-foreground">{ticket.userPhone}</div>
                </div>

                <div className="border-t border-border pt-3">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-2">
                        Секундомер
                    </div>
                    <div className="rounded-md bg-white border border-border p-3">
                        <div className="text-[10px] text-muted-foreground">
                            В статусе «{STATUS_LABEL[ticket.status]}»
                        </div>
                        <div className="text-lg font-bold inline-flex items-center gap-2 mt-1">
                            <Timer className="h-4 w-4 text-primary" />
                            {formatElapsed(ticket.statusChangedAt)}
                        </div>
                    </div>
                </div>

                <div className="border-t border-border pt-3">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-2">
                        История переходов
                    </div>
                    <div className="space-y-2">
                        {ticket.history.map((h, i) => {
                            const nextAt = ticket.history[i + 1]?.at ?? ticket.status === "closed" ? undefined : undefined;
                            const durationTo = ticket.history[i + 1]
                                ? formatElapsed(h.at, ticket.history[i + 1].at)
                                : formatElapsed(h.at);
                            const isCurrent = i === ticket.history.length - 1;
                            return (
                                <div key={i} className="flex items-start gap-2">
                                    <div className="flex flex-col items-center pt-0.5">
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: STATUS_COLOR[h.status] }}
                                        />
                                        {i < ticket.history.length - 1 && (
                                            <div className="w-px h-6 bg-border" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 pb-2">
                                        <div className="text-[11px] font-medium">
                                            {STATUS_LABEL[h.status]}
                                            {isCurrent && (
                                                <span className="text-[10px] text-muted-foreground ml-1">
                                                    (сейчас)
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">
                                            {formatDate(h.at)} · {formatShortTime(h.at)}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">
                                            длительность: {durationTo}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="border-t border-border pt-3">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-2">
                        Итоги по обращению
                    </div>
                    <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Открыто</span>
                            <span className="font-medium">{formatDate(ticket.createdAt)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">От создания до сейчас</span>
                            <span className="font-medium">{formatElapsed(ticket.createdAt)}</span>
                        </div>
                        {ticket.closedAt && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Всего в работе</span>
                                <span className="font-medium">
                                    {formatElapsed(ticket.createdAt, ticket.closedAt)}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Сообщений</span>
                            <span className="font-medium">{ticket.messages.length}</span>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    );
}

function WebMessage({ message }: { message: ChatMessage }) {
    const isUser = message.author === "user";
    return (
        <div className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[75%] flex flex-col ${isUser ? "items-start" : "items-end"} gap-1`}>
                <div className="text-[10px] text-muted-foreground px-2">{message.authorName}</div>
                <div
                    className={`rounded-lg px-3 py-2 ${
                        isUser
                            ? "bg-white border border-border"
                            : "bg-primary text-primary-foreground"
                    }`}
                >
                    <div className="text-xs leading-relaxed">{message.text}</div>
                    {message.attachments?.map((a, i) => (
                        <div
                            key={i}
                            className={`mt-2 rounded-md p-2 flex items-center gap-2 ${
                                isUser ? "bg-muted/40" : "bg-primary-foreground/15"
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
                                    <div className={`text-[10px] ${isUser ? "text-muted-foreground" : "opacity-80"}`}>
                                        {a.size}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-1 px-2 text-[10px] text-muted-foreground">
                    <span>{formatShortTime(message.timestamp)}</span>
                    {!isUser && <CheckCheck className="h-3 w-3 text-blue-500" />}
                </div>
            </div>
        </div>
    );
}
