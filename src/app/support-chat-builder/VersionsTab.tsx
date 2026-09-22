"use client";

/** Вкладка «Версии» — support_chat_version (BE-01): что опубликовано и откат. */

import { CheckCircle2, Archive, RotateCcw } from "lucide-react";
import type { SupportChatVersion } from "../_support-shared/chatTree";

export function VersionsTab({
    versions,
    onRestore,
}: {
    versions: SupportChatVersion[];
    onRestore: (version: SupportChatVersion) => void;
}) {
    const fmt = (iso: string): string =>
        new Date(iso).toLocaleString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

    return (
        <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="max-w-3xl">
                <h2 className="text-sm font-semibold">Версии дерева</h2>
                <p className="text-xs text-muted-foreground mt-0.5 mb-4">
                    Мобильное приложение всегда получает версию со статусом PUBLISHED. Откат
                    копирует снапшот в черновик — публикация остаётся отдельным шагом.
                </p>

                <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-xs">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="text-left font-medium px-3 py-2">Версия</th>
                                <th className="text-left font-medium px-3 py-2">Статус</th>
                                <th className="text-left font-medium px-3 py-2">Опубликована</th>
                                <th className="text-left font-medium px-3 py-2">Кем</th>
                                <th className="text-right font-medium px-3 py-2">Узлов</th>
                                <th className="px-3 py-2" />
                            </tr>
                        </thead>
                        <tbody>
                            {versions.map((v) => (
                                <tr key={v.id} className="border-t border-border">
                                    <td className="px-3 py-2 font-medium">v{v.version}</td>
                                    <td className="px-3 py-2">
                                        {v.status === "PUBLISHED" ? (
                                            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Опубликована
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                                                <Archive className="h-3 w-3" />
                                                В архиве
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2 text-muted-foreground">{fmt(v.publishedAt)}</td>
                                    <td className="px-3 py-2 text-muted-foreground">{v.publishedBy}</td>
                                    <td className="px-3 py-2 text-right tabular-nums">{v.nodeCount}</td>
                                    <td className="px-3 py-2 text-right">
                                        <button
                                            type="button"
                                            onClick={() => onRestore(v)}
                                            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-medium hover:bg-muted"
                                        >
                                            <RotateCcw className="h-3 w-3" />
                                            В черновик
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
