
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
        </div>
    );
}
