/**
 * Мелкие примитивы раздела «Заказы»: чекбокс, плашка статуса, рейтинг.
 * Без хуков, поэтому импортируются и в серверных, и в клиентских файлах.
 */

import { Star } from "lucide-react";
import type { Pill, Tone } from "./types";

const TONE: Record<Tone, string> = {
    amber: "bg-[#fdf0dd] text-[#c9792a]",
    green: "bg-[#e3f6e9] text-[#2f8c4e]",
    blue: "bg-[#e9f1ff] text-[#2f6bff]",
    gray: "bg-[#eef0f3] text-[#6b7280]",
    red: "bg-[#fdeaea] text-[#d9453f]",
    plain: "text-[#2c3038]",
};

/** Плашка статуса. Тон plain — без подложки: так выглядит «Отмененные». */
export function StatusPill({ pill, className = "" }: { pill: Pill; className?: string }) {
    const base =
        pill.tone === "plain"
            ? "text-[12px]"
            : "rounded-md px-2 py-[3px] text-[12px] font-medium";
    return <span className={`${base} ${TONE[pill.tone]} ${className}`}>{pill.label}</span>;
}

const CHECK_SVG =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E\")";

export function Checkbox({
    checked,
    onChange,
    label,
}: {
    checked: boolean;
    onChange: () => void;
    label: string;
}) {
    return (
        <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            aria-label={label}
            className="h-[18px] w-[18px] cursor-pointer appearance-none rounded-[5px] border border-[#cbd0d7] bg-white transition-colors checked:border-[#2f6bff] checked:bg-[#2f6bff] checked:bg-[length:12px] checked:bg-center checked:bg-no-repeat"
            style={checked ? { backgroundImage: CHECK_SVG } : undefined}
        />
    );
}

export function Rating({ value }: { value: number }) {
    return (
        <span className="flex items-center gap-1.5">
            <Star className="h-[15px] w-[15px] shrink-0 fill-[#f5b301] text-[#f5b301]" />
            <span className="text-[#2c3038]">{value}</span>
        </span>
    );
}
