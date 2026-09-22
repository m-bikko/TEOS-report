/**
 * Рамка телефона и системные полоски. Используется и на витрине
 * /support-mobile, и в превью конструктора /support-chat-builder.
 * Хуков нет — компонент можно импортировать и с сервера, и из клиента.
 */

import { Battery, Wifi, Signal, Home, Briefcase, MessageSquare, User } from "lucide-react";

export function PhoneFrame({
    label,
    children,
    accent,
}: {
    label: string;
    children: React.ReactNode;
    accent?: boolean;
}) {
    return (
        <div className="flex flex-col items-center gap-3">
            <div
                className={`relative rounded-[42px] p-2 shadow-2xl ${accent ? "bg-blue-600" : "bg-black"}`}
                style={{ width: 320, height: 660 }}
            >
                <div className="w-full h-full bg-white rounded-[34px] overflow-hidden relative flex flex-col">
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 h-5 w-24 bg-black rounded-full z-10" />
                    {children}
                </div>
            </div>
            <div
                className={`text-xs font-medium ${accent ? "text-blue-600" : "text-muted-foreground"}`}
            >
                {label}
            </div>
        </div>
    );
}

export function StatusBar() {
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

export function BottomTabBar({
    active,
}: {
    active: "home" | "orders" | "messages" | "profile";
}) {
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
