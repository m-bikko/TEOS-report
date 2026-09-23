"use client";

/**
 * Компоненты интерфейса TEOS по брендбуку и скриншотам web-ERP.
 *
 * Палитра — из раздела «02 Colours» брендбука. Системные цвета применяются
 * только к состояниям интерфейса, декоративно их использовать нельзя.
 * Шрифт везде Open Sans, он уже подключён в layout как --font-open-sans.
 *
 * Свитча на присланных скриншотах не было — его вид выведен из остальных
 * элементов: те же радиусы, тот же синий и та же серая подложка полей.
 */

import { Check, ChevronDown } from "lucide-react";

export const BRAND = {
    /** Core */
    blue: "#3563e9",
    blueHover: "#2a51c4",
    blueTint: "#e8eefc",
    ink: "#222222",
    orange: "#f56c23",
    surface: "#f6f7f9",

    /** System — только для состояний */
    success: "#07bb4f",
    successTint: "#dbf1e8",
    warning: "#ff9900",
    warningTint: "#fff0db",
    error: "#ec2d30",
    errorTint: "#fce0e0",
    info: "#2d7bef",
    infoTint: "#e2eafb",

    /** Производные нейтрали для линий и подписей */
    line: "#e6e8ec",
    muted: "#8a9099",
    mutedStrong: "#5d646d",
} as const;

// ═══════════════════════════════════════════════════════════════════════
// Поле с подписью
// ═══════════════════════════════════════════════════════════════════════

export function Field({
    label,
    required,
    hint,
    error,
    children,
}: {
    label?: string;
    required?: boolean;
    hint?: React.ReactNode;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            {label && (
                <label className="mb-1.5 block text-[13px] font-semibold text-[#222222]">
                    {label}
                    {required && <span className="ml-0.5 text-[#ec2d30]">*</span>}
                </label>
            )}
            {children}
            {error && <p className="mt-1 text-[12px] text-[#ec2d30]">{error}</p>}
            {!error && hint && <p className="mt-1 text-[12px] text-[#8a9099]">{hint}</p>}
        </div>
    );
}

const controlBase =
    "w-full rounded-lg bg-[#f6f7f9] px-3.5 py-2.5 text-[13px] text-[#222222] placeholder:text-[#a8aeb6] " +
    "border transition-colors outline-none focus:border-[#3563e9] focus:bg-white " +
    "focus:ring-2 focus:ring-[#3563e9]/15";

export function TextInput({
    invalid,
    className = "",
    ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
    return (
        <input
            {...rest}
            className={`${controlBase} ${invalid ? "border-[#ec2d30]" : "border-transparent"} ${className}`}
        />
    );
}

export function TextArea({
    invalid,
    className = "",
    ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
    return (
        <textarea
            {...rest}
            className={`${controlBase} resize-y leading-relaxed ${
                invalid ? "border-[#ec2d30]" : "border-transparent"
            } ${className}`}
        />
    );
}

export function Select({
    className = "",
    children,
    ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <div className="relative">
            <select
                {...rest}
                className={`${controlBase} appearance-none border-transparent pr-9 ${className}`}
            >
                {children}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a9099]" />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// Переключатель
// ═══════════════════════════════════════════════════════════════════════

export function Switch({
    checked,
    onChange,
    label,
    hint,
}: {
    checked: boolean;
    onChange: (next: boolean) => void;
    label: string;
    hint?: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className="flex w-full items-center gap-3 rounded-lg bg-[#f6f7f9] px-3.5 py-2.5 text-left transition-colors hover:bg-[#eff1f4]"
        >
            <span
                className={`relative inline-flex h-[22px] w-[38px] shrink-0 rounded-full transition-colors ${
                    checked ? "bg-[#3563e9]" : "bg-[#d3d8df]"
                }`}
            >
                <span
                    className={`absolute top-[3px] h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
                        checked ? "left-[19px]" : "left-[3px]"
                    }`}
                />
            </span>
            <span className="min-w-0">
                <span className="block text-[13px] font-medium text-[#222222]">{label}</span>
                {hint && <span className="block text-[12px] text-[#8a9099]">{hint}</span>}
            </span>
        </button>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// Кнопки
// ═══════════════════════════════════════════════════════════════════════

type Variant = "primary" | "outline" | "ghost" | "success" | "danger";

const VARIANTS: Record<Variant, string> = {
    primary: "bg-[#3563e9] text-white hover:bg-[#2a51c4] disabled:bg-[#b8c5f4]",
    outline: "border border-[#e6e8ec] bg-white text-[#222222] hover:bg-[#f6f7f9]",
    ghost: "text-[#5d646d] hover:bg-[#f6f7f9]",
    success: "bg-[#07bb4f] text-white hover:bg-[#06a446]",
    danger: "bg-[#ec2d30] text-white hover:bg-[#d32629]",
};

export function Button({
    variant = "primary",
    size = "md",
    className = "",
    children,
    ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: "sm" | "md";
}) {
    const sizing = size === "sm" ? "px-3 py-1.5 text-[12px]" : "px-4 py-2.5 text-[13px]";
    return (
        <button
            {...rest}
            className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${sizing} ${className}`}
        >
            {children}
        </button>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// Вкладки-пилюли
// ═══════════════════════════════════════════════════════════════════════

export function PillTabs<T extends string>({
    tabs,
    active,
    onChange,
}: {
    tabs: { key: T; label: string }[];
    active: T;
    onChange: (key: T) => void;
}) {
    return (
        <div className="flex gap-1">
            {tabs.map((t) => (
                <button
                    key={t.key}
                    type="button"
                    onClick={() => onChange(t.key)}
                    className={`rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors ${
                        active === t.key
                            ? "bg-[#e8eefc] text-[#3563e9]"
                            : "text-[#5d646d] hover:bg-[#f6f7f9]"
                    }`}
                >
                    {t.label}
                </button>
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// Шапка карточки, как в модалях ERP
// ═══════════════════════════════════════════════════════════════════════

export function CardHeader({
    icon,
    title,
    subtitle,
    right,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    right?: React.ReactNode;
}) {
    return (
        <div className="flex items-center gap-3 border-b border-[#e6e8ec] px-5 py-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[#e8eefc] text-[#3563e9]">
                {icon}
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-[17px] font-bold text-[#222222]">{title}</span>
                {subtitle && <span className="block text-[13px] text-[#8a9099]">{subtitle}</span>}
            </span>
            {right}
        </div>
    );
}

/** Выделенная панель с пунктирной рамкой — как «Текущий баланс» в ERP. */
export function HighlightPanel({
    label,
    value,
    right,
}: {
    label: string;
    value: React.ReactNode;
    right?: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border border-dashed border-[#3563e9]/45 bg-[#eaf2fe] px-4 py-3.5">
            <div className="flex items-start justify-between gap-3">
                <span className="text-[13px] font-semibold text-[#222222]">{label}</span>
                {right}
            </div>
            <div className="mt-1 text-[22px] font-bold text-[#3563e9]">{value}</div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// Языковая метка и пара полей
// ═══════════════════════════════════════════════════════════════════════

export function LangChip({ lang, filled }: { lang: string; filled: boolean }) {
    return (
        <span
            className={`inline-flex h-[18px] items-center gap-1 rounded px-1.5 text-[10px] font-bold tracking-wide ${
                filled ? "bg-[#e8eefc] text-[#3563e9]" : "bg-[#fff0db] text-[#b56c00]"
            }`}
        >
            {filled && <Check className="h-2.5 w-2.5" />}
            {lang}
        </span>
    );
}

/**
 * Пара полей ru/kz бок о бок. Контент двуязычный, поэтому редактор всегда
 * показывает оба языка рядом — иначе перевод забывают заполнить.
 */
export function LangPair({
    label,
    required,
    hint,
    ruFilled,
    kzFilled,
    ru,
    kz,
}: {
    label: string;
    required?: boolean;
    hint?: React.ReactNode;
    ruFilled: boolean;
    kzFilled: boolean;
    ru: React.ReactNode;
    kz: React.ReactNode;
}) {
    return (
        <div>
            <div className="mb-1.5 flex items-center gap-2">
                <span className="text-[13px] font-semibold text-[#222222]">
                    {label}
                    {required && <span className="ml-0.5 text-[#ec2d30]">*</span>}
                </span>
            </div>
            <div className="grid gap-3 @2xl:grid-cols-2">
                <div>
                    <div className="mb-1 flex items-center gap-1.5">
                        <LangChip lang="RU" filled={ruFilled} />
                    </div>
                    {ru}
                </div>
                <div>
                    <div className="mb-1 flex items-center gap-1.5">
                        <LangChip lang="KZ" filled={kzFilled} />
                        {!kzFilled && (
                            <span className="text-[11px] text-[#b56c00]">нет перевода</span>
                        )}
                    </div>
                    {kz}
                </div>
            </div>
            {hint && <p className="mt-1.5 text-[12px] text-[#8a9099]">{hint}</p>}
        </div>
    );
}
