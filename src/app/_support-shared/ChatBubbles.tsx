/**
 * Пузыри чата техподдержки: пользователь, автоответ бота, живой оператор.
 *
 * Ключевое правило интерфейса — пользователь всегда видит, кто ему отвечает:
 * у бота бейдж «Автоответ», у оператора «Техподдержка».
 *
 * Хуков нет: файл импортируется и серверной витриной, и клиентским демо,
 * и превью конструктора. Интерактивность включается передачей обработчиков.
 */

import {
    Bot,
    Headset,
    ChevronRight,
    CheckCheck,
    FileText,
    Image as ImageIcon,
    LinkIcon,
    ThumbsUp,
    LifeBuoy,
    ExternalLink,
    Smartphone,
    Phone,
} from "lucide-react";
import { NodeIcon } from "./icons";
import type { ChatMessage, MessageAction, MessageAuthor, MessageOption } from "./mockData";
import { formatShortTime } from "./mockData";
import type { ActionType, SupportChatSettings } from "./chatTree";

// ═══════════════════════════════════════════════════════════════════════
// Пометка автора
// ═══════════════════════════════════════════════════════════════════════

export function AuthorBadge({ author }: { author: MessageAuthor }) {
    if (author === "bot") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-200 px-1.5 py-[2px] text-[9px] font-semibold text-neutral-600">
                <Bot className="h-2.5 w-2.5" />
                Автоответ
            </span>
        );
    }
    if (author === "support") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-[2px] text-[9px] font-semibold text-emerald-700">
                <Headset className="h-2.5 w-2.5" />
                Техподдержка
            </span>
        );
    }
    return null;
}

const ACTION_ICON: Record<ActionType, React.ReactNode> = {
    NONE: null,
    ESCALATE: <LifeBuoy className="h-3.5 w-3.5 shrink-0" />,
    OPEN_LINK: <ExternalLink className="h-3.5 w-3.5 shrink-0" />,
    OPEN_SCREEN: <Smartphone className="h-3.5 w-3.5 shrink-0" />,
    CALL_CENTER: <Phone className="h-3.5 w-3.5 shrink-0" />,
};

// ═══════════════════════════════════════════════════════════════════════
// Меню бота
// ═══════════════════════════════════════════════════════════════════════

export function MenuOptions({
    options,
    onPick,
}: {
    options: MessageOption[];
    onPick?: (nodeId: string) => void;
}) {
    return (
        <div className="mt-2 space-y-1.5">
            {options.map((o) => (
                <button
                    key={o.nodeId}
                    type="button"
                    disabled={!onPick}
                    onClick={onPick ? () => onPick(o.nodeId) : undefined}
                    className={`w-full flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-left text-[11px] font-medium text-black transition-colors ${
                        onPick ? "hover:border-blue-400 hover:bg-blue-50 cursor-pointer" : "cursor-default"
                    }`}
                >
                    <NodeIcon name={o.icon} className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span className="flex-1 leading-snug">{o.title}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-neutral-300 shrink-0" />
                </button>
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// Кнопки под автоответом
// ═══════════════════════════════════════════════════════════════════════

export function AnswerControls({
    actions,
    settings,
    onHelped,
    onEscalate,
}: {
    actions?: MessageAction[];
    settings: SupportChatSettings;
    onHelped?: () => void;
    onEscalate?: () => void;
}) {
    const own = (actions ?? []).filter((a) => a.type !== "ESCALATE");
    const canEscalate = (actions ?? []).some((a) => a.type === "ESCALATE");

    return (
        <div className="mt-2 space-y-1.5">
            {own.map((a) => (
                <button
                    key={a.type + a.label}
                    type="button"
                    className="w-full flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-2.5 py-2 text-left text-[11px] font-medium text-blue-700"
                >
                    {ACTION_ICON[a.type]}
                    <span className="flex-1 leading-snug">{a.label}</span>
                </button>
            ))}

            <div className="flex gap-1.5 pt-0.5">
                <button
                    type="button"
                    onClick={onHelped}
                    className={`flex-1 flex items-center justify-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-2 text-[10px] font-semibold text-emerald-700 ${
                        onHelped ? "hover:bg-emerald-100 cursor-pointer" : "cursor-default"
                    }`}
                >
                    <ThumbsUp className="h-3 w-3 shrink-0" />
                    {settings.btnHelpedRu}
                </button>
                {canEscalate && (
                    <button
                        type="button"
                        onClick={onEscalate}
                        className={`flex-1 flex items-center justify-center gap-1 rounded-xl bg-blue-600 px-2 py-2 text-[10px] font-semibold text-white ${
                            onEscalate ? "hover:bg-blue-700 cursor-pointer" : "cursor-default"
                        }`}
                    >
                        <LifeBuoy className="h-3 w-3 shrink-0" />
                        {settings.btnEscalateRu}
                    </button>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// Разделитель передачи оператору
// ═══════════════════════════════════════════════════════════════════════

export function HandoffDivider({ at }: { at: string }) {
    return (
        <div className="flex items-center gap-2 py-1">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700 border border-emerald-100">
                <Headset className="h-2.5 w-2.5" />
                Передано оператору · {formatShortTime(at)}
            </span>
            <div className="flex-1 h-px bg-neutral-200" />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// Пузырь сообщения
// ═══════════════════════════════════════════════════════════════════════

export function MessageBubble({
    message,
    settings,
    onPick,
    onHelped,
    onEscalate,
}: {
    message: ChatMessage;
    settings: SupportChatSettings;
    onPick?: (nodeId: string) => void;
    onHelped?: () => void;
    onEscalate?: () => void;
}) {
    const isUser = message.author === "user";
    const isBot = message.author === "bot";

    const bubbleClass = isUser
        ? "bg-blue-600 text-white rounded-br-md"
        : isBot
          ? "bg-neutral-100 text-black border border-neutral-200 rounded-bl-md"
          : "bg-white text-black border border-neutral-200 rounded-bl-md";

    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
                {!isUser && (
                    <div className="flex items-center gap-1.5 px-2">
                        <AuthorBadge author={message.author} />
                        {message.author === "support" && (
                            <span className="text-[10px] text-neutral-400">{message.authorName}</span>
                        )}
                    </div>
                )}

                <div className={`rounded-2xl px-3 py-2 ${bubbleClass}`}>
                    {message.text && <div className="text-xs leading-relaxed">{message.text}</div>}

                    {message.kind === "menu" && message.options && (
                        <MenuOptions options={message.options} onPick={onPick} />
                    )}

                    {message.kind === "answer" && (
                        <AnswerControls
                            actions={message.actions}
                            settings={settings}
                            onHelped={onHelped}
                            onEscalate={onEscalate}
                        />
                    )}

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

                <div className="flex items-center gap-1 px-2 text-[10px] text-neutral-400">
                    <span>{formatShortTime(message.timestamp)}</span>
                    {isUser && <CheckCheck className="h-3 w-3 text-blue-500" />}
                </div>
            </div>
        </div>
    );
}
