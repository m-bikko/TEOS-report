"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, UserPlus, TrendingUp } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

interface UserAnalyticsData {
    total: number;
    totalBefore: number;
    distribution: { date: string; count: number }[];
}

interface UsersViewProps {
    data: UserAnalyticsData | null;
    loading: boolean;
}

export function UsersView({ data, loading }: UsersViewProps) {
    if (loading) {
        return <div className="text-center py-10">Загрузка аналитики по пользователям...</div>;
    }

    if (!data) {
        return <div className="text-center py-10">Нет данных</div>;
    }

    // Process data for Cumulative Chart
    // Sort by date just in case
    const sortedDistribution = [...data.distribution].sort((a, b) => a.date.localeCompare(b.date));

    let runningTotal = data.totalBefore;
    const chartData = sortedDistribution.map(item => {
        runningTotal += item.count;
        return {
            date: item.date,
            dailyCount: item.count,
            total: runningTotal
        };
    });

    // If chartData is empty but we have totalBefore (e.g. range with no new users), allow displaying total line?
    const currentTotal = chartData.length > 0 ? chartData[chartData.length - 1].total : data.totalBefore;

    // For chart display, if no data points in range, show at least start/end flat?
    // If filtered range has no new users, distribution is empty.
    // Chart might not render anything. 
    // Let's ensure at least one point if empty?
    // But XAxis needs dates. If filtered, we know the dates.
    // For now standard behavior: if no new users, chart is empty, cards show total.

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Всего пользователей
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{currentTotal.toLocaleString('ru-RU')}</div>
                        <p className="text-xs text-muted-foreground">
                            На конец выбранного периода
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Прирост за период
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{data.total.toLocaleString('ru-RU')}</div>
                        <p className="text-xs text-muted-foreground">
                            Новых регистраций
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Рост базы пользователей</CardTitle>
                    <CardDescription>
                        Общее количество пользователей (накопительный итог)
                    </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis
                                    dataKey="date"
                                    angle={-90}
                                    textAnchor="end"
                                    height={80}
                                    tickFormatter={(val) => {
                                        try {
                                            return format(parseISO(val), 'dd.MM.yy', { locale: ru });
                                        } catch { return val }
                                    }}
                                    className="text-[10px]"
                                />
                                <YAxis className="text-xs" />
                                <Tooltip
                                    labelFormatter={(val) => {
                                        try {
                                            return format(parseISO(val as string), 'dd MMMM yyyy', { locale: ru });
                                        } catch { return val }
                                    }}
                                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--card-foreground)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#2563eb"
                                    fillOpacity={1}
                                    fill="url(#colorTotal)"
                                    name="Всего пользователей"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
