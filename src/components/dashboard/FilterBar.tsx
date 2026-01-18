
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
}

export function FilterBar({ data, filters, onFilterChange }: FilterBarProps) {
    const companies = ["all", ...getUniqueValues(data, "company")];
    const cities = ["all", ...getUniqueValues(data, "branchCity")];
    const addresses = ["all", ...getUniqueValues(data, "branchAddress")];

    const updateFilter = (key: keyof FilterState, value: any) => {
        onFilterChange({ ...filters, [key]: value });
    };

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
                    <Select value={filters.company} onValueChange={(val) => updateFilter("company", val)}>
                        <SelectTrigger className="w-full">
                            <span className="truncate block text-left">
                                <SelectValue placeholder="Выберите кампанию" />
                            </span>
                        </SelectTrigger>
                        <SelectContent className="max-w-[300px]">
                            {companies.map((c) => (
                                <SelectItem key={String(c)} value={String(c)}>
                                    <span className="truncate block" title={String(c)}>
                                        {c === "all" ? "Все кампании" : c}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* City Filter */}
                <div className="flex flex-col gap-2 w-[150px] sm:w-[200px]">
                    <span className="text-sm font-medium">Город</span>
                    <Select value={filters.city} onValueChange={(val) => updateFilter("city", val)}>
                        <SelectTrigger className="w-full">
                            <span className="truncate block text-left">
                                <SelectValue placeholder="Выберите город" />
                            </span>
                        </SelectTrigger>
                        <SelectContent>
                            {cities.map((c) => (
                                <SelectItem key={String(c)} value={String(c)}>
                                    {c === "all" ? "Все города" : c}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Address Filter */}
                <div className="flex flex-col gap-2 w-[200px] sm:w-[300px]">
                    <span className="text-sm font-medium">Адресс Филлиала</span>
                    <Select value={filters.address} onValueChange={(val) => updateFilter("address", val)}>
                        <SelectTrigger className="w-full">
                            <span className="truncate block text-left">
                                <SelectValue placeholder="Выберите адрес" />
                            </span>
                        </SelectTrigger>
                        <SelectContent className="max-w-[300px]">
                            {addresses.map((c) => (
                                <SelectItem key={String(c)} value={String(c)}>
                                    <span className="truncate block" title={String(c)}>
                                        {c === "all" ? "Все адреса" : (String(c).length > 25 ? String(c).slice(0, 25) + "..." : c)}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

            </div>
        </div>
    )
}
