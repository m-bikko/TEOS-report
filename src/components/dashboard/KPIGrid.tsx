
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPIStats } from "@/lib/data";
import { Users, Clock, CalendarDays, Briefcase } from "lucide-react";

interface KPIGridProps {
    stats: KPIStats;
    metricMode?: "hours" | "volume";
}

export function KPIGrid({ stats, metricMode = "hours" }: KPIGridProps) {
    const isHours = metricMode === 'hours';

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        {isHours ? "Общее к-во часов" : "Общий объем"}
                    </CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalHours.toLocaleString('ru-RU')}</div>
                    <p className="text-xs text-muted-foreground">
                        За выбранный период
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Общее к-во выходов
                    </CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalShifts.toLocaleString('ru-RU')}</div>
                    <p className="text-xs text-muted-foreground">
                        Всего смен
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        {isHours ? "Ср. часов в день" : "Ср. объем в день"}
                    </CardTitle>
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.avgHoursPerDay.toFixed(1)}</div>
                    <p className="text-xs text-muted-foreground">
                        В среднем за день
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Ср. людей в день
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.avgPeoplePerDay.toFixed(1)}</div>
                    <p className="text-xs text-muted-foreground">
                        Средняя явка
                    </p>
                </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        {isHours ? "Ср. часов за смену" : "Ср. объем за смену"}
                    </CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.avgHoursPerShift.toFixed(1)}</div>
                    <p className="text-xs text-muted-foreground">
                        На одного исполнителя
                    </p>
                </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-1 bg-green-500/5 border-green-500/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Выручка (Клиент)
                    </CardTitle>
                    <div className="h-4 w-4 text-green-600 font-bold">₸</div>
                </CardHeader>
                <CardContent>
                    <div className="text-xl font-bold text-green-700">
                        {stats.totalRevenue.toLocaleString('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 })}
                    </div>
                </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-1 bg-red-500/5 border-red-500/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Расход (Выплаты)
                    </CardTitle>
                    <div className="h-4 w-4 text-red-600 font-bold">₸</div>
                </CardHeader>
                <CardContent>
                    <div className="text-xl font-bold text-red-700">
                        {stats.totalCost.toLocaleString('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 })}
                    </div>
                </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-1 bg-primary/5 border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Общая Маржа
                    </CardTitle>
                    <div className="h-4 w-4 text-primary font-bold">₸</div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-primary">
                        {stats.totalMargin.toLocaleString('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 })}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${stats.marginPercentage >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {stats.marginPercentage.toFixed(1)}%
                        </span>
                        <p className="text-xs text-muted-foreground">
                            от выручки
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
