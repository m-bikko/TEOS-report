"use client";

import * as React from "react";
import { CalendarIcon, ChevronsUpDown, Check, RotateCcw } from "lucide-react";
import { SHIFT_STATUS, SHIFT_STATUS_ORDER, STATUS_COLORS } from "@/lib/v2/enums";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { DimensionOption, BranchDimensionOption } from "@/lib/v2/types";

export interface FilterState {
    from: string | null;
    to: string | null;
    partnerId: number | null;
    cityId: number | null;
    companyId: number | null;
    branchId: number | null;
    tariffId: number | null;
    professionId: number | null;
    shiftStatuses: number[];
}

export interface DimensionsData {
    partners: DimensionOption[];
    cities: DimensionOption[];
    companies: DimensionOption[];
    branches: BranchDimensionOption[];
    tariffs: DimensionOption[];
    professions: DimensionOption[];
    hasBranches: boolean;
    minDate: string | null;
    maxDate: string | null;
    counts: {
        partners: number;
        cities: number;
        companies: number;
        tariffs: number;
        vacancies: number;
        shifts: number;
        shiftUsers: number;
        balanceLog: number;
        branches: number;
    };
}

interface FilterBarV2Props {
    dimensions: DimensionsData | null;
    filters: FilterState;
    onChange: (next: FilterState) => void;
}

interface ComboProps {
    label: string;
    value: number | null;
    options: DimensionOption[];
    onChange: (id: number | null) => void;
    disabled?: boolean;
    width?: string;
}

function Combo({ label, value, options, onChange, disabled, width = "w-[220px]" }: ComboProps) {
    const [open, setOpen] = React.useState(false);
    const selected = value != null ? options.find((o) => o.id === value) : null;

    return (
        <div className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                {label}
            </span>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={disabled}
                        title={selected?.label}
                        className={cn(
                            width,
                            "justify-between min-h-8 h-auto py-1 font-normal whitespace-normal text-left items-start",
                        )}
                    >
                        <span className="text-left flex-1 leading-tight break-words">
                            {selected ? selected.label : <span className="text-muted-foreground">Все</span>}
                        </span>
                        <ChevronsUpDown className="ml-1 mt-0.5 h-3.5 w-3.5 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[360px] p-0" align="start">
                    <Command>
                        <CommandInput placeholder={`Поиск: ${label.toLowerCase()}...`} />
                        <CommandList className="max-h-[360px]">
                            <CommandEmpty>Ничего не найдено</CommandEmpty>
                            <CommandGroup>
                                <CommandItem
                                    value="__all__"
                                    onSelect={() => {
                                        onChange(null);
                                        setOpen(false);
                                    }}
                                    className="items-start"
                                >
                                    <Check className={cn("mr-2 mt-0.5 h-4 w-4 shrink-0", value === null ? "opacity-100" : "opacity-0")} />
                                    <span>Все</span>
                                </CommandItem>
                                {options.map((o) => (
                                    <CommandItem
                                        key={o.id}
                                        value={`${o.id}__${o.label}`}
                                        onSelect={() => {
                                            onChange(o.id);
                                            setOpen(false);
                                        }}
                                        className="items-start"
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 mt-0.5 h-4 w-4 shrink-0",
                                                value === o.id ? "opacity-100" : "opacity-0",
                                            )}
                                        />
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="whitespace-normal break-words leading-snug">{o.label}</span>
                                            {o.extra && (
                                                <span className="text-xs text-muted-foreground whitespace-normal break-words leading-snug">
                                                    {o.extra}
                                                </span>
                                            )}
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}

interface DateInputProps {
    label: string;
    value: string | null;
    onChange: (v: string | null) => void;
}

function DateInput({ label, value, onChange }: DateInputProps) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                {label}
            </span>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                            "w-[160px] justify-start h-8 font-normal",
                            !value && "text-muted-foreground",
                        )}
                    >
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {value ? format(parseISO(value), "dd.MM.yyyy", { locale: ru }) : "не задано"}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={value ? parseISO(value) : undefined}
                        onSelect={(date) => onChange(date ? format(date, "yyyy-MM-dd") : null)}
                        locale={ru}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}

export function FilterBarV2({ dimensions, filters, onChange }: FilterBarV2Props) {
    const update = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
        onChange({ ...filters, [key]: value });
    };

    const handleCompanyChange = (newCompanyId: number | null) => {
        const next: FilterState = { ...filters, companyId: newCompanyId };
        if (filters.branchId != null && dimensions) {
            const branch = dimensions.branches.find((b) => b.id === filters.branchId);
            if (branch && branch.companyId !== newCompanyId && newCompanyId != null) {
                next.branchId = null;
            }
        }
        onChange(next);
    };

    const handleBranchChange = (newBranchId: number | null) => {
        const next: FilterState = { ...filters, branchId: newBranchId };
        if (newBranchId != null && dimensions) {
            const branch = dimensions.branches.find((b) => b.id === newBranchId);
            if (branch?.companyId != null) next.companyId = branch.companyId;
        }
        onChange(next);
    };

    const reset = () => {
        onChange({
            from: dimensions?.minDate ?? null,
            to: dimensions?.maxDate ?? null,
            partnerId: null,
            cityId: null,
            companyId: null,
            branchId: null,
            tariffId: null,
            professionId: null,
            shiftStatuses: [],
        });
    };

    const toggleStatus = (code: number) => {
        const has = filters.shiftStatuses.includes(code);
        const next = has
            ? filters.shiftStatuses.filter((c) => c !== code)
            : [...filters.shiftStatuses, code];
        onChange({ ...filters, shiftStatuses: next });
    };

    const companiesDisabled = !dimensions?.hasBranches;
    const branchesDisabled = !dimensions?.hasBranches;

    const visibleBranches: DimensionOption[] = (dimensions?.branches ?? [])
        .filter((b) => filters.companyId == null || b.companyId === filters.companyId)
        .map((b) => ({ id: b.id, label: b.label, extra: b.extra }));

    const statusesActive = filters.shiftStatuses.length > 0;

    return (
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
            <div className="container mx-auto px-4 py-3 flex flex-wrap items-end gap-3">
                <DateInput label="С даты" value={filters.from} onChange={(v) => update("from", v)} />
                <DateInput label="По дату" value={filters.to} onChange={(v) => update("to", v)} />
                <Combo
                    label="Партнёр"
                    value={filters.partnerId}
                    options={dimensions?.partners ?? []}
                    onChange={(v) => update("partnerId", v)}
                />
                <Combo
                    label="Город"
                    value={filters.cityId}
                    options={dimensions?.cities ?? []}
                    onChange={(v) => update("cityId", v)}
                />
                <Combo
                    label={companiesDisabled ? "Компания (branches.csv не загружен)" : "Компания"}
                    value={filters.companyId}
                    options={dimensions?.companies ?? []}
                    onChange={handleCompanyChange}
                    disabled={companiesDisabled}
                    width="w-[260px]"
                />
                <Combo
                    label={
                        branchesDisabled
                            ? "Точка (branches.csv не загружен)"
                            : filters.companyId != null
                                ? `Точка (${visibleBranches.length})`
                                : `Точка (все ${visibleBranches.length})`
                    }
                    value={filters.branchId}
                    options={visibleBranches}
                    onChange={handleBranchChange}
                    disabled={branchesDisabled}
                    width="w-[260px]"
                />
                <Combo
                    label="Тариф"
                    value={filters.tariffId}
                    options={dimensions?.tariffs ?? []}
                    onChange={(v) => update("tariffId", v)}
                />
                <Combo
                    label="Профессия"
                    value={filters.professionId}
                    options={dimensions?.professions ?? []}
                    onChange={(v) => update("professionId", v)}
                    width="w-[160px]"
                />
                <Button variant="ghost" size="sm" onClick={reset} className="h-8 ml-auto">
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                    Сброс
                </Button>
            </div>
            <div className="container mx-auto px-4 pb-3 flex flex-wrap items-center gap-2">
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mr-1">
                    Статус смен:
                </span>
                {SHIFT_STATUS_ORDER.map((code) => {
                    const active = filters.shiftStatuses.includes(code);
                    return (
                        <button
                            key={code}
                            type="button"
                            onClick={() => toggleStatus(code)}
                            className={cn(
                                "text-xs px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1.5",
                                active
                                    ? "text-white border-transparent"
                                    : "border-border bg-background hover:bg-muted text-foreground",
                            )}
                            style={
                                active
                                    ? { backgroundColor: STATUS_COLORS[code] }
                                    : undefined
                            }
                        >
                            <span
                                className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    active ? "bg-white/90" : "",
                                )}
                                style={active ? undefined : { backgroundColor: STATUS_COLORS[code] }}
                            />
                            {SHIFT_STATUS[code]}
                        </button>
                    );
                })}
                {statusesActive && (
                    <button
                        type="button"
                        onClick={() => onChange({ ...filters, shiftStatuses: [] })}
                        className="text-[11px] text-muted-foreground hover:text-foreground ml-1 underline"
                    >
                        снять все
                    </button>
                )}
            </div>
        </div>
    );
}

export function filtersToQuery(filters: FilterState): string {
    const params = new URLSearchParams();
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (filters.partnerId != null) params.set("partner", String(filters.partnerId));
    if (filters.cityId != null) params.set("city", String(filters.cityId));
    if (filters.companyId != null) params.set("company", String(filters.companyId));
    if (filters.branchId != null) params.set("branch", String(filters.branchId));
    if (filters.tariffId != null) params.set("tariff", String(filters.tariffId));
    if (filters.shiftStatuses.length > 0) params.set("status", filters.shiftStatuses.join(","));
    if (filters.professionId != null) params.set("profession", String(filters.professionId));
    return params.toString();
}
