
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShiftRecord, aggregateByDayAndCompany } from "@/lib/data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartsSectionProps {
    data: ShiftRecord[];
}

export function ChartsSection({ data }: ChartsSectionProps) {
    const peopleData = aggregateByDayAndCompany(data, 'people');
    const hoursData = aggregateByDayAndCompany(data, 'hours');

    // Hardcoded colors for companies (can be improved with a generator)
    const colors = [
        "#2563eb", "#db2777", "#ea580c", "#16a34a", "#7c3aed",
        "#dc2626", "#0891b2", "#d97706", "#4f46e5", "#be185d"
    ];

    const renderChart = (chartData: { data: any[], companies: string[] }, title: string) => {
        const processedData = chartData.data.map(item => {
            const total = chartData.companies.reduce((acc, company) => acc + (Number(item[company]) || 0), 0);
            const formattedTotal = Number(total.toFixed(1));
            return {
                ...item,
                total: formattedTotal,
                labelWithTotal: `${item.date} (${formattedTotal})`
            };
        });

        return (
            <div className="h-[400px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={processedData}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 10,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="labelWithTotal"
                            className="text-[10px]"
                            tick={{ fill: 'currentColor', fontSize: 10 }}
                            stroke="currentColor"
                            angle={-90}
                            textAnchor="end"
                            height={100}
                            interval={0}
                        />
                        <YAxis
                            className="text-xs"
                            tick={{ fill: 'currentColor' }}
                            stroke="currentColor"
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--card-foreground)' }}
                        />
                        {chartData.companies.length <= 5 && <Legend />}
                        {chartData.companies.length > 5 ? (
                            <Bar
                                dataKey="total"
                                fill="#2563eb" // Single color for aggregated view
                                name="Всего"
                            />
                        ) : (
                            chartData.companies.map((company, index) => (
                                <Bar
                                    key={company}
                                    dataKey={company}
                                    stackId="a"
                                    fill={colors[index % colors.length]}
                                    name={company}
                                />
                            ))
                        )}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>График выработки</CardTitle>
                <CardDescription>
                    Визуализация данных по дням и кампаниям
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="people" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="people">Люди (Количество)</TabsTrigger>
                        <TabsTrigger value="hours">Часы (Отработка)</TabsTrigger>
                    </TabsList>

                    <TabsContent value="people" className="space-y-4">
                        {renderChart(peopleData, "Количество людей")}
                    </TabsContent>

                    <TabsContent value="hours" className="space-y-4">
                        {renderChart(hoursData, "Количество часов")}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
