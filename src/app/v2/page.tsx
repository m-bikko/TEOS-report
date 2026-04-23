"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Activity, BarChart3, Coins, Users, ExternalLink, Database, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    FilterBarV2,
    FilterState,
    DimensionsData,
    filtersToQuery,
} from "./components/FilterBarV2";
import { FunnelTab } from "./components/FunnelTab";
import { FinanceTab } from "./components/FinanceTab";
import { PartnersTab } from "./components/PartnersTab";
import { VacanciesTab } from "./components/VacanciesTab";

type TabKey = "funnel" | "finance" | "partners" | "vacancies";

export default function V2Page() {
    const [dimensions, setDimensions] = useState<DimensionsData | null>(null);
    const [filters, setFilters] = useState<FilterState>({
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

    const [tab, setTab] = useState<TabKey>("funnel");
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

    const [funnelData, setFunnelData] = useState<unknown>(null);
    const [financeData, setFinanceData] = useState<unknown>(null);
    const [partnersData, setPartnersData] = useState<unknown>(null);
    const [vacanciesData, setVacanciesData] = useState<unknown>(null);

    const [funnelLoading, setFunnelLoading] = useState(false);
    const [financeLoading, setFinanceLoading] = useState(false);
    const [partnersLoading, setPartnersLoading] = useState(false);
    const [vacanciesLoading, setVacanciesLoading] = useState(false);

    useEffect(() => {
        fetch("/api/v2/dimensions")
            .then((r) => r.json())
            .then((d: DimensionsData) => {
                setDimensions(d);
            })
            .catch((e) => console.error("dimensions fetch failed", e));
    }, []);

    const q = filtersToQuery(filters);

    const loadFunnel = useCallback(() => {
        setFunnelLoading(true);
        fetch(`/api/v2/funnel?${q}`)
            .then((r) => r.json())
            .then(setFunnelData)
            .finally(() => setFunnelLoading(false));
    }, [q]);

    const loadFinance = useCallback(() => {
        setFinanceLoading(true);
        const extra = selectedUserId != null ? `&user=${selectedUserId}` : "";
        fetch(`/api/v2/finance?${q}${extra}`)
            .then((r) => r.json())
            .then(setFinanceData)
            .finally(() => setFinanceLoading(false));
    }, [q, selectedUserId]);

    const loadPartners = useCallback(() => {
        setPartnersLoading(true);
        fetch(`/api/v2/partners?${q}`)
            .then((r) => r.json())
            .then(setPartnersData)
            .finally(() => setPartnersLoading(false));
    }, [q]);

    const loadVacancies = useCallback(() => {
        setVacanciesLoading(true);
        fetch(`/api/v2/vacancies?${q}`)
            .then((r) => r.json())
            .then(setVacanciesData)
            .finally(() => setVacanciesLoading(false));
    }, [q]);

    useEffect(() => {
        if (!dimensions) return;
        if (tab === "funnel") loadFunnel();
        if (tab === "finance") loadFinance();
        if (tab === "partners") loadPartners();
        if (tab === "vacancies") loadVacancies();
    }, [tab, dimensions, loadFunnel, loadFinance, loadPartners, loadVacancies]);

    return (
        <div className="min-h-screen bg-background">
            <div className="border-b border-border bg-card">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">TEOS Аналитика V2</h1>
                        <p className="text-xs text-muted-foreground">
                            Power BI-стиль · CSV-датасеты из <code className="text-[10px] bg-muted px-1 py-0.5 rounded">second-part/</code>
                        </p>
                    </div>
                    <Link
                        href="/"
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                        Перейти к V1 (API-версия) <ExternalLink className="h-3 w-3" />
                    </Link>
                </div>
            </div>

            <FilterBarV2 dimensions={dimensions} filters={filters} onChange={setFilters} />

            <div className="container mx-auto px-4 py-4">
                <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
                    <TabsList>
                        <TabsTrigger value="funnel" className="gap-1.5">
                            <Activity className="h-3.5 w-3.5" /> Воронка смен
                        </TabsTrigger>
                        <TabsTrigger value="finance" className="gap-1.5">
                            <Coins className="h-3.5 w-3.5" /> Финансы юзеров
                        </TabsTrigger>
                        <TabsTrigger value="partners" className="gap-1.5">
                            <Users className="h-3.5 w-3.5" /> Партнёры
                        </TabsTrigger>
                        <TabsTrigger value="vacancies" className="gap-1.5">
                            <BarChart3 className="h-3.5 w-3.5" /> Вакансии
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="funnel" className="mt-4">
                        <FunnelTab
                            data={funnelData as Parameters<typeof FunnelTab>[0]["data"]}
                            loading={funnelLoading}
                        />
                    </TabsContent>

                    <TabsContent value="finance" className="mt-4">
                        <FinanceTab
                            data={financeData as Parameters<typeof FinanceTab>[0]["data"]}
                            loading={financeLoading}
                            onUserSelect={setSelectedUserId}
                            selectedUserId={selectedUserId}
                        />
                    </TabsContent>

                    <TabsContent value="partners" className="mt-4">
                        <PartnersTab
                            data={partnersData as Parameters<typeof PartnersTab>[0]["data"]}
                            loading={partnersLoading}
                        />
                    </TabsContent>

                    <TabsContent value="vacancies" className="mt-4">
                        <VacanciesTab
                            data={vacanciesData as Parameters<typeof VacanciesTab>[0]["data"]}
                            loading={vacanciesLoading}
                        />
                    </TabsContent>
                </Tabs>

                {dimensions && (
                    <div className="mt-6 text-[11px] text-muted-foreground border-t pt-3 flex flex-wrap gap-3 items-center justify-center">
                        <Database className="h-3 w-3" />
                        <span>{dimensions.counts.shifts.toLocaleString("ru-RU")} смен</span>
                        <span>· {dimensions.counts.shiftUsers.toLocaleString("ru-RU")} назначений</span>
                        <span>· {dimensions.counts.balanceLog.toLocaleString("ru-RU")} транзакций</span>
                        <span>· {dimensions.counts.vacancies.toLocaleString("ru-RU")} вакансий</span>
                        <span>· {dimensions.counts.partners} партнёров</span>
                        <span>· {dimensions.counts.companies} компаний</span>
                        <span>· {dimensions.counts.cities} городов</span>
                        {!dimensions.hasBranches && (
                            <span className="text-amber-600 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                branches.csv не загружен — фильтр по компании отключён
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
