"use client";

/** Вкладка «Настройки» — форма support_chat_settings (BE-05). */

import type { SupportChatSettings } from "../_support-shared/chatTree";

const FIELDS: { key: keyof SupportChatSettings; label: string; hint: string; multiline?: boolean }[] = [
    {
        key: "greeting",
        label: "Приветствие помощника",
        hint: "Первое сообщение, с которого начинается любое обращение.",
        multiline: true,
    },
    {
        key: "fallbackText",
        label: "Текст, когда ветка не нашлась",
        hint: "Показывается перед формой обращения вручную.",
        multiline: true,
    },
    { key: "contactPhone", label: "Телефон контакт-центра", hint: "Подставляется в действие «Позвонить»." },
    { key: "contactEmail", label: "Почта поддержки", hint: "Показывается в карточке обращения." },
    { key: "btnHelped", label: "Кнопка «ответ помог»", hint: "Закрывает обращение без оператора." },
    { key: "btnEscalate", label: "Кнопка вызова оператора", hint: "Передаёт тред живой техподдержке." },
    { key: "btnBack", label: "Кнопка возврата на уровень выше", hint: "Подпись в шапке чата." },
];

export function SettingsTab({
    settings,
    onChange,
}: {
    settings: SupportChatSettings;
    onChange: (patch: Partial<SupportChatSettings>) => void;
}) {
    return (
        <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="max-w-2xl space-y-4">
                <div>
                    <h2 className="text-sm font-semibold">Настройки чата</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Общие для всего дерева тексты. Публикуются вместе с версией.
                    </p>
                </div>

                {FIELDS.map((f) => (
                    <div key={f.key}>
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5 font-medium">
                            {f.label}
                        </div>
                        {f.multiline ? (
                            <textarea
                                rows={3}
                                value={settings[f.key]}
                                onChange={(e) => onChange({ [f.key]: e.target.value })}
                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs leading-relaxed resize-y"
                            />
                        ) : (
                            <input
                                value={settings[f.key]}
                                onChange={(e) => onChange({ [f.key]: e.target.value })}
                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
                            />
                        )}
                        <div className="text-[10px] text-muted-foreground mt-1">{f.hint}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
