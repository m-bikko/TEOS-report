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
import { REGIONS, RegionCode } from "@/lib/v2/regions";

export interface FilterState {
    from: string | null;
    to: string | null;
    partnerIds: number[];
    cityIds: number[];
    companyIds: number[];
    branchIds: number[];
    tariffIds: number[];
    professionIds: number[];
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

interface MultiComboProps {
    label: string;
    values: number[];
    options: DimensionOption[];
    onChange: (ids: number[]) => void;
    disabled?: boolean;
    width?: string;
}

function MultiCombo({ label, values, options, onChange, disabled, width = "w-[220px]" }: MultiComboProps) {
    const [open, setOpen] = React.useState(false);

    const selectedOptions = React.useMemo(
        () => options.filter((o) => values.includes(o.id)),
        [options, values],
    );

    const display = React.useMemo(() => {
        if (selectedOptions.length === 0) return null;
        if (selectedOptions.length === 1) return selectedOptions[0].label;
        if (selectedOptions.length <= 3) return selectedOptions.map((o) => o.label).join(", ");
        return `Выбрано: ${selectedOptions.length}`;
    }, [selectedOptions]);

    const toggle = (id: number) => {
        if (values.includes(id)) onChange(values.filter((x) => x !== id));
        else onChange([...values, id]);
    };

    const clear = () => {
        onChange([]);
    };

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
                        title={selectedOptions.map((o) => o.label).join(", ") || undefined}
                        className={cn(
                            width,
                            "justify-between min-h-8 h-auto py-1 font-normal whitespace-normal text-left items-start",
                        )}
                    >
                        <span className="text-left flex-1 leading-tight break-words">
                            {display ?? <span className="text-muted-foreground">Все</span>}
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
                                    onSelect={clear}
                                    className="items-start"
                                >
                                    <span
                                        className={cn(
                                            "mr-2 mt-0.5 h-4 w-4 shrink-0 rounded border flex items-center justify-center",
                                            values.length === 0
                                                ? "bg-primary border-primary text-primary-foreground"
                                                : "border-input",
                                        )}
                                    >
                                        {values.length === 0 && <Check className="h-3 w-3" />}
                                    </span>
                                    <span>Все</span>
                                    {values.length > 0 && (
                                        <span className="ml-auto text-[11px] text-muted-foreground">
                                            снять {values.length}
                                        </span>
                                    )}
                                </CommandItem>
                                {options.map((o) => {
                                    const checked = values.includes(o.id);
                                    return (
                                        <CommandItem
                                            key={o.id}
                                            value={`${o.id}__${o.label}`}
                                            onSelect={() => toggle(o.id)}
                                            className="items-start"
                                        >
                                            <span
                                                className={cn(
                                                    "mr-2 mt-0.5 h-4 w-4 shrink-0 rounded border flex items-center justify-center",
                                                    checked
                                                        ? "bg-primary border-primary text-primary-foreground"
                                                        : "border-input",
                                                )}
                                            >
                                                {checked && <Check className="h-3 w-3" />}
                                            </span>
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <span className="whitespace-normal break-words leading-snug">
                                                    {o.label}
                                                </span>
                                                {o.extra && (
                                                    <span className="text-xs text-muted-foreground whitespace-normal break-words leading-snug">
                                                        {o.extra}
                                                    </span>
                                                )}
                                            </div>
                                        </CommandItem>
                                    );
                                })}
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

    const handleCompanyChange = (newCompanyIds: number[]) => {
        const next: FilterState = { ...filters, companyIds: newCompanyIds };
        if (filters.branchIds.length > 0 && dimensions && newCompanyIds.length > 0) {
            const branchesById = new Map(dimensions.branches.map((b) => [b.id, b]));
            next.branchIds = filters.branchIds.filter((bid) => {
                const b = branchesById.get(bid);
                return b?.companyId != null && newCompanyIds.includes(b.companyId);
            });
        }
        onChange(next);
    };

    const handleBranchChange = (newBranchIds: number[]) => {
        onChange({ ...filters, branchIds: newBranchIds });
    };

    const reset = () => {
        onChange({
            from: "2026-01-01",
            to: "2026-03-31",
            partnerIds: [],
            cityIds: [],
            companyIds: [],
            branchIds: [],
            tariffIds: [],
            professionIds: [],
            shiftStatuses: [5],
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
        .filter(
            (b) =>
                filters.companyIds.length === 0 ||
                (b.companyId != null && filters.companyIds.includes(b.companyId)),
        )
        .map((b) => ({ id: b.id, label: b.label, extra: b.extra }));

    const cityIdByTitle = React.useMemo(() => {
        const m = new Map<string, number>();
        for (const c of dimensions?.cities ?? []) m.set(c.label, c.id);
        return m;
    }, [dimensions]);

    const regionCityIds = React.useMemo(() => {
        const out = new Map<RegionCode, number[]>();
        for (const r of REGIONS) {
            const ids: number[] = [];
            for (const title of r.cities) {
                const id = cityIdByTitle.get(title);
                if (id != null) ids.push(id);
            }
            out.set(r.code, ids);
        }
        return out;
    }, [cityIdByTitle]);

    const activeRegions = React.useMemo<Set<RegionCode>>(() => {
        if (filters.cityIds.length === 0) return new Set();
        const selectedSet = new Set(filters.cityIds);
        const result = new Set<RegionCode>();
        for (const r of REGIONS) {
            const cityIds = regionCityIds.get(r.code) ?? [];
            if (cityIds.length === 0) continue;
            if (cityIds.every((id) => selectedSet.has(id))) result.add(r.code);
        }
        return result;
    }, [filters.cityIds, regionCityIds]);

    const toggleRegion = (code: RegionCode) => {
        const regionIds = regionCityIds.get(code) ?? [];
        if (regionIds.length === 0) return;
        const isActive = activeRegions.has(code);
        const current = new Set(filters.cityIds);
        if (isActive) {
            for (const id of regionIds) current.delete(id);
        } else {
            for (const id of regionIds) current.add(id);
        }
        onChange({ ...filters, cityIds: Array.from(current) });
    };

    const statusesActive = filters.shiftStatuses.length > 0;

    return (
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
            <div className="container mx-auto px-4 py-3 flex flex-wrap items-end gap-3">
                <DateInput label="С даты" value={filters.from} onChange={(v) => update("from", v)} />
                <DateInput label="По дату" value={filters.to} onChange={(v) => update("to", v)} />
                <MultiCombo
                    label="Партнёр"
                    values={filters.partnerIds}
                    options={dimensions?.partners ?? []}
                    onChange={(v) => update("partnerIds", v)}
                />
                <MultiCombo
                    label="Город"
                    values={filters.cityIds}
                    options={dimensions?.cities ?? []}
                    onChange={(v) => update("cityIds", v)}
                />
                <MultiCombo
                    label={companiesDisabled ? "Компания (branches.csv не загружен)" : "Компания"}
                    values={filters.companyIds}
                    options={dimensions?.companies ?? []}
                    onChange={handleCompanyChange}
                    disabled={companiesDisabled}
                    width="w-[260px]"
                />
                <MultiCombo
                    label={
                        branchesDisabled
                            ? "Точка (branches.csv не загружен)"
                            : filters.companyIds.length > 0
                                ? `Точка (${visibleBranches.length})`
                                : `Точка (все ${visibleBranches.length})`
                    }
                    values={filters.branchIds}
                    options={visibleBranches}
                    onChange={handleBranchChange}
                    disabled={branchesDisabled}
                    width="w-[260px]"
                />
                <MultiCombo
                    label="Тариф"
                    values={filters.tariffIds}
                    options={dimensions?.tariffs ?? []}
                    onChange={(v) => update("tariffIds", v)}
                />
                <MultiCombo
                    label="Профессия"
                    values={filters.professionIds}
                    options={dimensions?.professions ?? []}
                    onChange={(v) => update("professionIds", v)}
                    width="w-[160px]"
                />
                <Button variant="ghost" size="sm" onClick={reset} className="h-8 ml-auto">
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                    Сброс
                </Button>
            </div>
            <div className="container mx-auto px-4 pb-2 flex flex-wrap items-center gap-2">
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mr-1">
                    Регион:
                </span>
                {REGIONS.map((r) => {
                    const active = activeRegions.has(r.code);
                    const count = regionCityIds.get(r.code)?.length ?? 0;
                    return (
                        <button
                            key={r.code}
                            type="button"
                            onClick={() => toggleRegion(r.code)}
                            disabled={count === 0}
                            className={cn(
                                "text-xs px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1.5",
                                active
                                    ? "bg-primary text-primary-foreground border-transparent"
                                    : "border-border bg-background hover:bg-muted text-foreground",
                                count === 0 && "opacity-40 cursor-not-allowed",
                            )}
                        >
                            {r.label}
                            <span className="text-[10px] opacity-70">{count}</span>
                        </button>
                    );
                })}
                {activeRegions.size > 0 && (
                    <button
                        type="button"
                        onClick={() => onChange({ ...filters, cityIds: [] })}
                        className="text-[11px] text-muted-foreground hover:text-foreground ml-1 underline"
                    >
                        снять города
                    </button>
                )}
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
    if (filters.partnerIds.length > 0) params.set("partner", filters.partnerIds.join(","));
    if (filters.cityIds.length > 0) params.set("city", filters.cityIds.join(","));
    if (filters.companyIds.length > 0) params.set("company", filters.companyIds.join(","));
    if (filters.branchIds.length > 0) params.set("branch", filters.branchIds.join(","));
    if (filters.tariffIds.length > 0) params.set("tariff", filters.tariffIds.join(","));
    if (filters.professionIds.length > 0) params.set("profession", filters.professionIds.join(","));
    if (filters.shiftStatuses.length > 0) params.set("status", filters.shiftStatuses.join(","));
    return params.toString();
}
