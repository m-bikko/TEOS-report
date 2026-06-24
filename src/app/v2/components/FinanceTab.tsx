"use client";

import { useState } from "react";
import { Panel } from "./Panel";
import { KpiCard } from "./KpiCard";
import { fmtNumber, fmtMoney, fmtPct } from "./format";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
} from "recharts";
import { POWER_BI_COLORS } from "@/lib/v2/enums";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface FinanceData {
    kpis: {
        totalAccruals: number;
        totalDeductions: number;
        netPayout: number;
        fineCount: number;
        fineAmount: number;
        uniqueUsers: number;
        transactionCount: number;
    };
    topUsers: {
        userId: number;
        accruals: number;
        deductions: number;
        net: number;
        shifts: number;
        fines: number;
        currentBalance: number;
    }[];
    daily: { date: string; accruals: number; deductions: number; net: number }[];
    selectedUser: { date: string; balance: number; delta: number; comment: string | null }[] | null;
}

export function FinanceTab({
    data,
    loading,
    onUserSelect,
    selectedUserId,
}: {
    data: FinanceData | null;
    loading: boolean;
    onUserSelect: (userId: number | null) => void;
    selectedUserId: number | null;
}) {
    const [userInput, setUserInput] = useState("");

    if (loading) return <div className="p-6 text-center text-muted-foreground">Загрузка...</div>;
    if (!data) return <div className="p-6 text-center text-muted-foreground">Нет данных</div>;

    const submitUser = () => {
        const id = Number(userInput);
        if (Number.isFinite(id) && id > 0) onUserSelect(id);
    };

    const clearUser = () => {
        setUserInput("");
        onUserSelect(null);
    };

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-6 gap-3">
                <KpiCard
                    label="Начисления"
                    value={fmtMoney(data.kpis.totalAccruals)}
                    accentColor={POWER_BI_COLORS.green}
                />
                <KpiCard
                    label="Списания"
                    value={fmtMoney(data.kpis.totalDeductions)}
                    accentColor={POWER_BI_COLORS.red}
                />
                <KpiCard
                    label="Чистая выплата"
                    value={fmtMoney(data.kpis.netPayout)}
                    accentColor={POWER_BI_COLORS.primary}
                />
                <KpiCard
                    label="Штрафы"
                    value={fmtNumber(data.kpis.fineCount)}
                    subtitle={fmtMoney(data.kpis.fineAmount)}
                    accentColor={POWER_BI_COLORS.orange}
                />
                <KpiCard
                    label="Уникальных юзеров"
                    value={fmtNumber(data.kpis.uniqueUsers)}
                    accentColor={POWER_BI_COLORS.teal}
                />
                <KpiCard
                    label="Транзакций"
                    value={fmtNumber(data.kpis.transactionCount)}
                    accentColor={POWER_BI_COLORS.purple}
                />
            </div>

            <div className="grid grid-cols-12 gap-3">
                <Panel
                    className="col-span-8 h-[340px]"
                    title="Динамика выплат по дням"
                    subtitle="Начисления vs Списания"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.daily} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 10 }}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                                interval="preserveStartEnd"
                            />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "var(--card)",
                                    borderColor: "var(--border)",
                                    fontSize: 12,
                                }}
                                formatter={(v) => fmtMoney(Number(v) || 0)}
                            />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="accruals" name="Начисления" stackId="a" fill={POWER_BI_COLORS.green} />
                            <Bar dataKey="deductions" name="Списания" stackId="b" fill={POWER_BI_COLORS.red} />
                        </BarChart>
                    </ResponsiveContainer>
                </Panel>

                <Panel
                    className="col-span-4 h-[340px]"
                    title="Топ-20 заработавших"
                    subtitle="По чистой выплате"
                >
                    <div className="overflow-y-auto h-full text-xs">
                        <table className="w-full">
                            <thead className="sticky top-0 bg-card border-b">
                                <tr className="text-left text-muted-foreground">
                                    <th className="py-1 px-1 font-medium">User ID</th>
                                    <th className="py-1 px-1 font-medium text-right">Нетто</th>
                                    <th className="py-1 px-1 font-medium text-right">Смены</th>
                                    <th className="py-1 px-1 font-medium text-right">Штрафы</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.topUsers.map((u, i) => (
                                    <tr
                                        key={u.userId}
                                        onClick={() => {
                                            setUserInput(String(u.userId));
                                            onUserSelect(u.userId);
                                        }}
                                        className={`cursor-pointer hover:bg-muted/50 ${i % 2 ? "bg-muted/20" : ""} ${selectedUserId === u.userId ? "bg-primary/10" : ""}`}
                                    >
                                        <td className="py-1 px-1 font-mono">{u.userId}</td>
                                        <td className="py-1 px-1 text-right">{fmtMoney(u.net)}</td>
                                        <td className="py-1 px-1 text-right">{u.shifts}</td>
                                        <td className="py-1 px-1 text-right">{u.fines > 0 ? u.fines : "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Panel>
            </div>

            <Panel
                title="Персональный баланс юзера"
                subtitle={
                    selectedUserId != null
                        ? `User ID ${selectedUserId} - хронология балансов`
                        : "Выберите юзера в таблице или введите ID"
                }
                right={
                    <div className="flex gap-2">
                        <Input
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="User ID"
                            className="h-8 w-32"
                            onKeyDown={(e) => e.key === "Enter" && submitUser()}
                        />
                        <Button size="sm" variant="outline" className="h-8" onClick={submitUser}>
                            <Search className="h-3.5 w-3.5" />
                        </Button>
                        {selectedUserId != null && (
                            <Button size="sm" variant="ghost" className="h-8" onClick={clearUser}>
                                Сброс
                            </Button>
                        )}
                    </div>
                }
                className="h-[360px]"
            >
                {data.selectedUser && data.selectedUser.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.selectedUser} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "var(--card)",
                                    borderColor: "var(--border)",
                                    fontSize: 12,
                                }}
                                formatter={(v) => fmtMoney(Number(v) || 0)}
                            />
                            <Line
                                type="monotone"
                                dataKey="balance"
                                name="Баланс"
                                stroke={POWER_BI_COLORS.primary}
                                dot={false}
                                strokeWidth={2}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                        {selectedUserId != null ? "Нет данных по этому юзеру" : "Нет выбранного юзера"}
                    </div>
                )}
            </Panel>

            <Panel
                title="Топ-20 детально"
                subtitle="Полная таблица с начислениями и балансами"
                className="min-h-[300px]"
            >
                <div className="overflow-x-auto text-xs">
                    <table className="w-full">
                        <thead className="border-b">
                            <tr className="text-left text-muted-foreground">
                                <th className="py-1.5 px-2 font-medium">#</th>
                                <th className="py-1.5 px-2 font-medium">User ID</th>
                                <th className="py-1.5 px-2 font-medium text-right">Начисления</th>
                                <th className="py-1.5 px-2 font-medium text-right">Списания</th>
                                <th className="py-1.5 px-2 font-medium text-right">Нетто</th>
                                <th className="py-1.5 px-2 font-medium text-right">Смены</th>
                                <th className="py-1.5 px-2 font-medium text-right">Штрафы</th>
                                <th className="py-1.5 px-2 font-medium text-right">Баланс</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.topUsers.map((u, i) => (
                                <tr key={u.userId} className={i % 2 ? "bg-muted/20" : ""}>
                                    <td className="py-1 px-2 text-muted-foreground">{i + 1}</td>
                                    <td className="py-1 px-2 font-mono">{u.userId}</td>
                                    <td className="py-1 px-2 text-right text-green-700">{fmtMoney(u.accruals)}</td>
                                    <td className="py-1 px-2 text-right text-red-700">{fmtMoney(u.deductions)}</td>
                                    <td className="py-1 px-2 text-right font-medium">{fmtMoney(u.net)}</td>
                                    <td className="py-1 px-2 text-right">{u.shifts}</td>
                                    <td className="py-1 px-2 text-right">{u.fines}</td>
                                    <td className="py-1 px-2 text-right">{fmtMoney(u.currentBalance)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Panel>
        </div>
    );
}
