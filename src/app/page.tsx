
"use client"

import { useEffect, useState, useMemo } from "react"
import { FilterBar } from "@/components/dashboard/FilterBar"
import { KPIGrid } from "@/components/dashboard/KPIGrid"
import { ChartsSection } from "@/components/dashboard/ChartsSection"
import { ShiftRecord, FilterState, fetchAndParseData, filterData, calculateKPIs } from "@/lib/data"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const [data, setData] = useState<ShiftRecord[]>([])
  const [loading, setLoading] = useState(true)

  const [filters, setFilters] = useState<FilterState>({
    dateRange: {
      from: new Date(2025, 0, 1), // Jan 1, 2025
      to: new Date()
    },
    company: "all",
    city: "all",
    address: "all",
    tariffType: "all"
  });

  const [metricMode, setMetricMode] = useState<"hours" | "volume">("hours");

  useEffect(() => {
    async function loadData() {
      try {
        const records = await fetchAndParseData()
        setData(records)
      } catch (error) {
        console.error("Failed to load data", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])



  const filteredData = useMemo(() => {
    // 1. Basic Filters
    const basicFiltered = filterData(data, filters);

    // 2. Metric Mode Filter
    // "Hours" -> only TariffType 1
    // "Volume" -> everything EXCEPT TariffType 1
    return basicFiltered.filter(d => {
      if (metricMode === 'hours') {
        return String(d.tariffType) === '1';
      } else {
        return String(d.tariffType) !== '1';
      }
    });
  }, [data, filters, metricMode])

  const stats = useMemo(() => {
    return calculateKPIs(filteredData)
  }, [filteredData])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Загрузка данных...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Аналитика смен и выработки</h1>
          <p className="text-muted-foreground">
            Визуализация отчетов по сотрудникам, часам и объектам.
          </p>
        </div>

        <FilterBar
          data={data}
          filters={filters}
          onFilterChange={setFilters}
          metricMode={metricMode}
          onMetricModeChange={setMetricMode}
        />

        <KPIGrid stats={stats} metricMode={metricMode} />

        <div className="grid gap-4">
          <ChartsSection data={filteredData} metricMode={metricMode} />
        </div>

        <div className="text-xs text-muted-foreground mt-8 text-center">
          Всего записей: {filteredData.length} (из {data.length})
        </div>
      </div>
    </div>
  )
}
