"use client";

/**
 * Вкладка «Импорт-экспорт» (BE-06).
 * Выгрузка идёт в snake_case — как колонки таблицы, чтобы файл можно было
 * отдать бэкенду без переименований.
 */

import { useState } from "react";
import { Download, Upload, AlertCircle, CheckCircle2, Copy } from "lucide-react";
import {
    exportTree,
    importTree,
    type SupportChatNode,
    type SupportChatSettings,
} from "../_support-shared/chatTree";

export function ImportExportTab({
    nodes,
    settings,
    onImport,
}: {
    nodes: SupportChatNode[];
    settings: SupportChatSettings;
    onImport: (nodes: SupportChatNode[], settings: SupportChatSettings) => void;
}) {
    const exported = JSON.stringify(exportTree(nodes, settings), null, 2);
    const [draft, setDraft] = useState("");
    const [errors, setErrors] = useState<string[]>([]);
    const [ok, setOk] = useState(false);

    const runImport = (): void => {
        setOk(false);
        const result = importTree(draft, settings);
        if (result.ok) {
            onImport(result.nodes, result.settings);
            setErrors([]);
            setOk(true);
        } else {
            setErrors(result.errors);
        }
    };

    const download = (): void => {
        const blob = new Blob([exported], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "support-chat-tree.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="max-w-5xl grid grid-cols-2 gap-6">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h2 className="text-sm font-semibold">Экспорт черновика</h2>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                Формат контракта: snake_case, как колонки support_chat_node.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => navigator.clipboard.writeText(exported)}
                                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-medium hover:bg-muted"
                            >
                                <Copy className="h-3 w-3" />
                                Копировать
                            </button>
                            <button
                                type="button"
                                onClick={download}
                                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-medium hover:bg-muted"
                            >
                                <Download className="h-3 w-3" />
                                Скачать
                            </button>
                        </div>
                    </div>
                    <pre className="rounded-lg border border-border bg-muted/30 p-3 text-[10px] leading-relaxed overflow-auto max-h-[560px] font-mono">
                        {exported}
                    </pre>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h2 className="text-sm font-semibold">Импорт</h2>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                Заменяет черновик целиком. Проверки те же, что в обычном редактировании.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={runImport}
                            disabled={draft.trim() === ""}
                            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-[10px] font-medium text-primary-foreground disabled:opacity-40"
                        >
                            <Upload className="h-3 w-3" />
                            Импортировать
                        </button>
                    </div>

                    <textarea
                        value={draft}
                        onChange={(e) => {
                            setDraft(e.target.value);
                            setOk(false);
                        }}
                        placeholder="Вставьте JSON в формате выгрузки слева"
                        className="w-full rounded-lg border border-border bg-background p-3 text-[10px] font-mono leading-relaxed resize-y"
                        rows={22}
                    />

                    {ok && (
                        <div className="mt-2 flex items-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-[11px] text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                            Черновик заменён. Чтобы приложение увидело изменения — опубликуйте версию.
                        </div>
                    )}

                    {errors.length > 0 && (
                        <div className="mt-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 space-y-1">
                            {errors.map((e, i) => (
                                <div key={i} className="flex items-start gap-1.5 text-[11px] text-red-700">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-px" />
                                    <span>{e}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
