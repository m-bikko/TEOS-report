import { ReactNode } from "react";

interface KpiCardProps {
    label: string;
    value: ReactNode;
    subtitle?: ReactNode;
    accentColor?: string;
    icon?: ReactNode;
}

export function KpiCard({ label, value, subtitle, accentColor, icon }: KpiCardProps) {
    return (
        <div className="border border-border rounded-sm bg-card p-3 flex flex-col gap-1 relative overflow-hidden">
            {accentColor && (
                <div
                    className="absolute top-0 left-0 h-0.5 w-full"
                    style={{ backgroundColor: accentColor }}
                />
            )}
            <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                    {label}
                </span>
                {icon && <span className="text-muted-foreground">{icon}</span>}
            </div>
            <div className="text-2xl font-semibold leading-tight">{value}</div>
            {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
        </div>
    );
}
