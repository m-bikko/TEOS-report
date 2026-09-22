/**
 * Разрешённые иконки узлов дерева. В БД хранится имя (колонка `icon`),
 * здесь — соответствие имени компоненту lucide.
 * Эмодзи не используем — только SVG-иконки.
 */

import {
    CalendarClock,
    Wallet,
    FileText,
    UserCog,
    HelpCircle,
    CreditCard,
    ShieldCheck,
    Truck,
    Clock,
    MapPin,
    type LucideIcon,
} from "lucide-react";

export const NODE_ICONS: Record<string, LucideIcon> = {
    CalendarClock,
    Wallet,
    FileText,
    UserCog,
    CreditCard,
    ShieldCheck,
    Truck,
    Clock,
    MapPin,
    HelpCircle,
};

export const ICON_NAMES: string[] = Object.keys(NODE_ICONS);

export function NodeIcon({
    name,
    className,
}: {
    name: string | null;
    className?: string;
}) {
    const Icon = (name && NODE_ICONS[name]) || HelpCircle;
    return <Icon className={className} />;
}
