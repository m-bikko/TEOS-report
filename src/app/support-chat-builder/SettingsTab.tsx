"use client";

/** Вкладка «Настройки» — форма support_chat_settings (BE-05), тексты парами ru/kz. */

import { Phone, Mail } from "lucide-react";
import type { SupportChatSettings } from "../_support-shared/chatTree";
import { Field, LangPair, TextArea, TextInput } from "../_support-shared/brand";

interface PairField {
    ru: keyof SupportChatSettings;
    kz: keyof SupportChatSettings;
    label: string;
    hint: string;
    multiline?: boolean;
}

const PAIRS: PairField[] = [
    {
        ru: "greetingRu",
        kz: "greetingKz",
        label: "Приветствие помощника",
        hint: "Первое сообщение, с которого начинается любое обращение.",
        multiline: true,
    },
    {
        ru: "fallbackTextRu",
        kz: "fallbackTextKz",
        label: "Текст, когда ветка не нашлась",
        hint: "Показывается перед формой обращения вручную.",
        multiline: true,
    },
    {
        ru: "btnHelpedRu",
        kz: "btnHelpedKz",
        label: "Кнопка «ответ помог»",
        hint: "Закрывает обращение без оператора.",
    },
    {
        ru: "btnEscalateRu",
        kz: "btnEscalateKz",
        label: "Кнопка вызова оператора",
        hint: "Передаёт тред живой техподдержке.",
    },
    {
        ru: "btnBackRu",
        kz: "btnBackKz",
        label: "Кнопка возврата на уровень выше",
        hint: "Подпись в шапке чата.",
    },
];

export function SettingsTab({
    settings,
    onChange,
}: {
    settings: SupportChatSettings;
    onChange: (patch: Partial<SupportChatSettings>) => void;
}) {
    return (
        <div className="@container flex-1 overflow-y-auto bg-white px-6 py-6">
            <div className="max-w-4xl space-y-6">
                <div>
                    <h2 className="text-[17px] font-bold text-[#222222]">Настройки чата</h2>
                    <p className="mt-0.5 text-[13px] text-[#8a9099]">
                        Общие для всего дерева тексты. Публикуются вместе с версией.
                    </p>
                </div>

                {PAIRS.map((f) => (
                    <LangPair
                        key={f.ru}
                        label={f.label}
                        hint={f.hint}
                        ruFilled={String(settings[f.ru]).trim() !== ""}
                        kzFilled={String(settings[f.kz]).trim() !== ""}
                        ru={
                            f.multiline ? (
                                <TextArea
                                    rows={3}
                                    value={String(settings[f.ru])}
                                    onChange={(e) => onChange({ [f.ru]: e.target.value })}
                                />
                            ) : (
                                <TextInput
                                    value={String(settings[f.ru])}
                                    onChange={(e) => onChange({ [f.ru]: e.target.value })}
                                />
                            )
                        }
                        kz={
                            f.multiline ? (
                                <TextArea
                                    rows={3}
                                    value={String(settings[f.kz])}
                                    onChange={(e) => onChange({ [f.kz]: e.target.value })}
                                />
                            ) : (
                                <TextInput
                                    value={String(settings[f.kz])}
                                    onChange={(e) => onChange({ [f.kz]: e.target.value })}
                                />
                            )
                        }
                    />
                ))}

                <div className="grid gap-4 border-t border-[#e6e8ec] pt-6 @2xl:grid-cols-2">
                    <Field
                        label="Телефон контакт-центра"
                        hint="Подставляется в действие «Позвонить». Язык не влияет."
                    >
                        <div className="relative">
                            <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a9099]" />
                            <TextInput
                                value={settings.contactPhone}
                                onChange={(e) => onChange({ contactPhone: e.target.value })}
                                className="pl-10"
                            />
                        </div>
                    </Field>

                    <Field label="Почта поддержки" hint="Показывается в карточке обращения.">
                        <div className="relative">
                            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a9099]" />
                            <TextInput
                                value={settings.contactEmail}
                                onChange={(e) => onChange({ contactEmail: e.target.value })}
                                className="pl-10"
                            />
                        </div>
                    </Field>
                </div>
            </div>
        </div>
    );
}
