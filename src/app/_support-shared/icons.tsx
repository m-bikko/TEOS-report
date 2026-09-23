/**
 * Разрешённые иконки узлов дерева. В БД хранится имя (колонка `icon`),
 * здесь — соответствие имени компоненту lucide.
 * Эмодзи не используем — только SVG-иконки.
 *
 * Те же иконки лежат файлами в `public/icons/nodes/` для клиентов, которые
 * не собирают React: мобильное приложение и вёрстка писем. Путь к файлу
 * считает nodeIconPath(). Пополняя список здесь, выгрузите файл туда же —
 * иначе клиент по имени из БД получит пустоту. Подробности: public/icons/README.md
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

/** Имя иконки в БД — PascalCase, файл — kebab-case. */
export function nodeIconPath(name: string | null): string {
    const known = name && name in NODE_ICONS ? name : "HelpCircle";
    const kebab = known.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
    return `/icons/nodes/${kebab}.svg`;
}

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
