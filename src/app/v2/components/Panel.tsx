import { ReactNode } from "react";

interface PanelProps {
    title: string;
    subtitle?: string;
    children: ReactNode;
    right?: ReactNode;
    className?: string;
}

export function Panel({ title, subtitle, children, right, className }: PanelProps) {
    return (
        <div className={`border border-border rounded-sm bg-card flex flex-col ${className ?? ""}`}>
            <div className="flex items-start justify-between gap-2 px-3 pt-3 pb-2 border-b border-border/60">
                <div>
                    <div className="text-sm font-semibold leading-tight">{title}</div>
                    {subtitle && <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>}
                </div>
                {right}
            </div>
            <div className="p-3 flex-1 min-h-0">{children}</div>
        </div>
    );
}
