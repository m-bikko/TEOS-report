
"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { FilterState, ShiftRecord, getUniqueValues } from "@/lib/data"

interface FilterBarProps {
    data: ShiftRecord[];
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    metricMode: "hours" | "volume";
    onMetricModeChange: (mode: "hours" | "volume") => void;
}

import { Check, ChevronsUpDown, Clock, Package } from "lucide-react"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function FilterBar({ data, filters, onFilterChange, metricMode, onMetricModeChange }: FilterBarProps) {
    const companies = ["all", ...getUniqueValues(data, "company").map(String)];
    const cities = ["all", ...getUniqueValues(data, "branchCity").map(String)];
    const addresses = ["all", ...getUniqueValues(data, "branchAddress").map(String)];

    const updateFilter = (key: keyof FilterState, value: any) => {
        onFilterChange({ ...filters, [key]: value });
    };

    const ComboboxFilter = ({
        value,
        options,
        placeholder,
        searchPlaceholder,
        onChange
    }: {
        value: string,
        options: string[],
        placeholder: string,
        searchPlaceholder: string,
        onChange: (val: string) => void
    }) => {
        const [open, setOpen] = React.useState(false)

        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        <span className="truncate">
                            {value === "all"
                                ? placeholder
                                : options.find((opt) => opt === value) || value}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                    <Command>
                        <CommandInput placeholder={searchPlaceholder} />
                        <CommandList>
                            <CommandEmpty>Ничего не найдено.</CommandEmpty>
                            <CommandGroup>
                                {options.map((option) => (
                                    <CommandItem
                                        key={option}
                                        value={option}
                                        onSelect={(currentValue) => {
                                            onChange(currentValue === value ? "all" : currentValue)
                                            setOpen(false)
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === option ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <span className="truncate" title={option}>
                                            {option === "all" ? "Все" : option}
                                        </span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        )
    }

    return (
        <div className="flex flex-col gap-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
            <div className="flex flex-wrap gap-4 items-end">

                {/* Date Range Picker */}
                <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Период</span>
                    <div className="flex gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[240px] justify-start text-left font-normal",
                                        !filters.dateRange.from && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {filters.dateRange.from ? (
                                        format(filters.dateRange.from, "PPP", { locale: ru })
                                    ) : (
                                        <span>Начальная дата</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={filters.dateRange.from}
                                    onSelect={(date) => updateFilter("dateRange", { ...filters.dateRange, from: date })}
                                    initialFocus
                                    locale={ru}
                                />
                            </PopoverContent>
                        </Popover>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[240px] justify-start text-left font-normal",
                                        !filters.dateRange.to && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {filters.dateRange.to ? (
                                        format(filters.dateRange.to, "PPP", { locale: ru })
                                    ) : (
                                        <span>Конечная дата</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={filters.dateRange.to}
                                    onSelect={(date) => updateFilter("dateRange", { ...filters.dateRange, to: date })}
                                    initialFocus
                                    locale={ru}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* Company Filter */}
                <div className="flex flex-col gap-2 w-[200px] sm:w-[300px]">
                    <span className="text-sm font-medium">Кампания</span>
                    <ComboboxFilter
                        value={filters.company}
                        options={companies}
                        placeholder="Все кампании"
                        searchPlaceholder="Поиск кампании..."
                        onChange={(val) => updateFilter("company", val)}
                    />
                </div>

                {/* City Filter */}
                <div className="flex flex-col gap-2 w-[150px] sm:w-[200px]">
                    <span className="text-sm font-medium">Город</span>
                    <ComboboxFilter
                        value={filters.city}
                        options={cities}
                        placeholder="Все города"
                        searchPlaceholder="Поиск города..."
                        onChange={(val) => updateFilter("city", val)}
                    />
                </div>

                {/* Address Filter */}
                <div className="flex flex-col gap-2 w-[200px] sm:w-[300px]">
                    <span className="text-sm font-medium">Адрес Филлиала</span>
                    <ComboboxFilter
                        value={filters.address}
                        options={addresses}
                        placeholder="Все адреса"
                        searchPlaceholder="Поиск адреса..."
                        onChange={(val) => updateFilter("address", val)}
                    />
                </div>

                {/* Tariff Type Filter */}
                <div className="flex flex-col gap-2 w-[150px] sm:w-[200px]">
                    <span className="text-sm font-medium">Тип Тарифа</span>
                    <ComboboxFilter
                        value={filters.tariffType || "all"}
                        options={["all", ...getUniqueValues(data, "tariffType").map(String)]}
                        placeholder="Все типы"
                        searchPlaceholder="Поиск типа..."
                        onChange={(val) => updateFilter("tariffType", val)}
                    />
                </div>

            </div>

            <div className="flex justify-start border-t pt-4">
                <Tabs value={metricMode} onValueChange={(v) => onMetricModeChange(v as "hours" | "volume")}>
                    <TabsList>
                        <TabsTrigger value="hours" className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Часы (Тариф 1)
                        </TabsTrigger>
                        <TabsTrigger value="volume" className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Выработка (Остальные)
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
        </div>
    )
}
