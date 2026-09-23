/**
 * Дерево частых вопросов чата техподдержки.
 *
 * Зеркало контракта бэкенда (BE-01…BE-05): узлы хранятся ПЛОСКИМ массивом,
 * как строки таблицы `support_chat_node`, а вложенность строится на лету
 * через childrenOf(). Так демо показывает ровно то, что лежит в БД, и делает
 * очевидным смысл BE-04 (массовое обновление parent_id/sort_order).
 *
 * Контент двуязычный: title_ru/title_kz и body_ru/body_kz, как в BE-01.
 * Казахские строки — черновой перевод, до прода нужна вычитка носителем.
 *
 * Этот файл НЕ импортирует ничего из mockData.ts — зависимость односторонняя
 * (mockData → chatTree), иначе получается цикл через TicketCategory.
 */

// ═══════════════════════════════════════════════════════════════════════
// Типы
// ═══════════════════════════════════════════════════════════════════════

/** Категория обращения. Живёт здесь, потому что нужна в payload'е ESCALATE. */
export type TicketCategory = "b2b" | "executor";

/** Языки контента дерева. Интерфейс ERP остаётся русским. */
export type Lang = "ru" | "kz";

export const LANGS: Lang[] = ["ru", "kz"];

export const LANG_LABEL: Record<Lang, string> = {
    ru: "RU",
    kz: "KZ",
};

/** MENU — раскрывает следующий уровень, ANSWER — лист с готовым ответом. */
export type NodeType = "MENU" | "ANSWER";

export type ActionType =
    | "NONE"
    | "ESCALATE"
    | "OPEN_LINK"
    | "OPEN_SCREEN"
    | "CALL_CENTER";

export type ActionPayload =
    | { kind: "NONE" }
    | { kind: "ESCALATE"; category: TicketCategory }
    | { kind: "OPEN_LINK"; url: string; labelRu: string; labelKz: string }
    | { kind: "OPEN_SCREEN"; screen: string; labelRu: string; labelKz: string }
    /** phone: null → берётся contactPhone из настроек */
    | { kind: "CALL_CENTER"; phone: string | null };

/** Строка таблицы support_chat_node (BE-01). */
export interface SupportChatNode {
    id: string;
    parentId: string | null;
    nodeType: NodeType;
    sortOrder: number;
    isActive: boolean;
    titleRu: string;
    titleKz: string;
    /** Заполнен только у ANSWER. */
    bodyRu: string | null;
    bodyKz: string | null;
    /** имя иконки lucide-react */
    icon: string | null;
    actionType: ActionType;
    actionPayload: ActionPayload | null;
    updatedBy: string;
    updatedAt: string;
}

/** support_chat_settings (BE-05). */
export interface SupportChatSettings {
    greetingRu: string;
    greetingKz: string;
    fallbackTextRu: string;
    fallbackTextKz: string;
    contactPhone: string;
    contactEmail: string;
    btnHelpedRu: string;
    btnHelpedKz: string;
    btnEscalateRu: string;
    btnEscalateKz: string;
    btnBackRu: string;
    btnBackKz: string;
}

export const ACTION_LABEL: Record<ActionType, string> = {
    NONE: "Нет действия",
    ESCALATE: "Позвать техподдержку",
    OPEN_LINK: "Открыть ссылку",
    OPEN_SCREEN: "Открыть экран приложения",
    CALL_CENTER: "Позвонить в контакт-центр",
};

export const ACTION_HINT: Record<ActionType, string> = {
    NONE: "Ветка заканчивается текстом ответа.",
    ESCALATE: "Под ответом появится кнопка передачи обращения живому оператору.",
    OPEN_LINK: "Кнопка-ссылка на внешнюю инструкцию или документ.",
    OPEN_SCREEN: "Диплинк внутрь мобильного приложения.",
    CALL_CENTER: "Кнопка звонка. Пустой номер — берётся из настроек чата.",
};

export const NODE_TYPE_LABEL: Record<NodeType, string> = {
    MENU: "Меню",
    ANSWER: "Ответ",
};

/** Экраны приложения, доступные для OPEN_SCREEN. */
export const APP_SCREENS: { value: string; label: string }[] = [
    { value: "profile.main", label: "Профиль — главная" },
    { value: "profile.documents", label: "Профиль — документы" },
    { value: "profile.payouts", label: "Профиль — история выплат" },
    { value: "shifts.my", label: "Мои смены" },
    { value: "shifts.catalog", label: "Каталог смен" },
    { value: "auth.reset", label: "Восстановление пароля" },
];

/** Псевдо-«сейчас», чтобы рендер был стабильным. В проде — new Date(). */
export const TREE_NOW = "2026-09-23T10:00:00Z";

// ═══════════════════════════════════════════════════════════════════════
// Чтение контента с учётом языка
// ═══════════════════════════════════════════════════════════════════════

/** Заголовок узла. Пустой перевод падает на русский — так же ведёт себя приложение. */
export function nodeTitle(node: SupportChatNode, lang: Lang = "ru"): string {
    if (lang === "kz") return node.titleKz.trim() || node.titleRu;
    return node.titleRu;
}

export function nodeBody(node: SupportChatNode, lang: Lang = "ru"): string {
    if (lang === "kz") return (node.bodyKz ?? "").trim() || (node.bodyRu ?? "");
    return node.bodyRu ?? "";
}

/** Есть ли у узла полный казахский перевод. */
export function isTranslated(node: SupportChatNode): boolean {
    if (node.titleKz.trim() === "") return false;
    if (node.nodeType === "ANSWER" && (node.bodyKz ?? "").trim() === "") return false;
    return true;
}

// ═══════════════════════════════════════════════════════════════════════
// Сборка мок-дерева
// ═══════════════════════════════════════════════════════════════════════

interface RawNode {
    ru: string;
    kz?: string;
    icon?: string;
    bodyRu?: string;
    bodyKz?: string;
    inactive?: boolean;
    action?: ActionPayload;
    children?: RawNode[];
}

function uid(n: number): string {
    return `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
}

function actionTypeOf(payload: ActionPayload | undefined): ActionType {
    return payload ? payload.kind : "NONE";
}

/**
 * Разворачивает удобный для чтения вложенный литерал в плоский массив строк
 * таблицы. Тип узла выводится из наличия детей: есть дети — MENU, нет — ANSWER.
 */
function buildTree(raw: RawNode[]): SupportChatNode[] {
    const out: SupportChatNode[] = [];
    let counter = 0;

    const walk = (items: RawNode[], parentId: string | null): void => {
        items.forEach((item, index) => {
            const id = uid(++counter);
            const hasChildren = (item.children?.length ?? 0) > 0;
            out.push({
                id,
                parentId,
                nodeType: hasChildren ? "MENU" : "ANSWER",
                sortOrder: index,
                isActive: !item.inactive,
                titleRu: item.ru,
                titleKz: item.kz ?? "",
                bodyRu: hasChildren ? null : (item.bodyRu ?? ""),
                bodyKz: hasChildren ? null : (item.bodyKz ?? ""),
                icon: item.icon ?? null,
                actionType: actionTypeOf(item.action),
                actionPayload: item.action ?? { kind: "NONE" },
                updatedBy: "Айгуль Сериккызы",
                updatedAt: TREE_NOW,
            });
            if (item.children) walk(item.children, id);
        });
    };

    walk(raw, null);
    return out;
}

const RAW_TREE: RawNode[] = [
    {
        ru: "Смены",
        kz: "Ауысымдар",
        icon: "CalendarClock",
        children: [
            {
                ru: "Не могу записаться на смену",
                kz: "Ауысымға жазыла алмаймын",
                children: [
                    {
                        ru: "Кнопка «Записаться» неактивна",
                        kz: "«Жазылу» түймесі белсенді емес",
                        bodyRu: "Кнопка блокируется, если в профиле не хватает документов. Откройте раздел «Документы» и проверьте, что загружены удостоверение личности и санитарная книжка с действующим сроком.",
                        bodyKz: "Профильде құжаттар жетіспесе, түйме бұғатталады. «Құжаттар» бөлімін ашып, жеке куәлік пен мерзімі өтпеген санитарлық кітапша жүктелгенін тексеріңіз.",
                        action: {
                            kind: "OPEN_SCREEN",
                            screen: "profile.documents",
                            labelRu: "Открыть мои документы",
                            labelKz: "Құжаттарымды ашу",
                        },
                    },
                    {
                        ru: "Запись отклонена",
                        kz: "Жазылу қабылданбады",
                        children: [
                            {
                                ru: "Просрочена санитарная книжка",
                                kz: "Санитарлық кітапшаның мерзімі өткен",
                                bodyRu: "Партнёр отклоняет запись автоматически, если срок санкнижки истёк. Обновите её в профиле и запишитесь на смену заново — повторная запись доступна сразу после загрузки.",
                                bodyKz: "Санитарлық кітапшаның мерзімі өтсе, серіктес жазылуды автоматты түрде қабылдамайды. Оны профильде жаңартып, ауысымға қайта жазылыңыз — жүктеген соң бірден қолжетімді.",
                                action: {
                                    kind: "OPEN_LINK",
                                    url: "#",
                                    labelRu: "Инструкция по обновлению санкнижки",
                                    labelKz: "Санитарлық кітапшаны жаңарту нұсқаулығы",
                                },
                            },
                            {
                                ru: "Не указан ИИН",
                                kz: "ЖСН көрсетілмеген",
                                bodyRu: "Без ИИН невозможно оформить акт выполненных работ, поэтому запись отклоняется. Заполните ИИН в профиле — проверка занимает до 10 минут.",
                                bodyKz: "ЖСН болмаса, орындалған жұмыстар актісін ресімдеу мүмкін емес, сондықтан жазылу қабылданбайды. Профильде ЖСН-ді толтырыңыз — тексеру 10 минутқа дейін уақыт алады.",
                                action: {
                                    kind: "OPEN_SCREEN",
                                    screen: "profile.main",
                                    labelRu: "Заполнить ИИН",
                                    labelKz: "ЖСН-ді толтыру",
                                },
                            },
                            {
                                ru: "Причина не указана",
                                kz: "Себебі көрсетілмеген",
                                bodyRu: "Если партнёр отклонил запись без причины, это разбирает техподдержка вручную. Нажмите кнопку ниже — мы посмотрим вашу заявку и вернёмся с ответом.",
                                bodyKz: "Серіктес себепсіз бас тартса, мұны техқолдау қолмен қарайды. Төмендегі түймені басыңыз — өтінішіңізді қарап, жауап береміз.",
                                action: { kind: "ESCALATE", category: "executor" },
                            },
                        ],
                    },
                    {
                        ru: "Смена пропала из списка",
                        bodyRu: "Смена исчезает из каталога, когда партнёр набрал нужное количество исполнителей или отменил заказ. Записи на другие смены это не затрагивает — посмотрите свежий список в каталоге.",
                    },
                ],
            },
            {
                ru: "Опоздал или не смог выйти на смену",
                kz: "Кешіктім немесе ауысымға шыға алмадым",
                bodyRu: "Сообщите об этом как можно раньше: партнёр успеет найти замену, а вам не снизят рейтинг. По таким вопросам звоните напрямую в контакт-центр.",
                bodyKz: "Бұл туралы мүмкіндігінше ертерек хабарлаңыз: серіктес алмастыру табады, ал сіздің рейтингіңіз төмендемейді. Мұндай сұрақтар бойынша байланыс орталығына тікелей қоңырау шалыңыз.",
                action: { kind: "CALL_CENTER", phone: null },
            },
            {
                ru: "Как отметиться на смене",
                kz: "Ауысымда қалай белгіленуге болады",
                bodyRu: "Отметка делается в приложении на объекте: откройте смену и нажмите «Я на месте». Кнопка активна в радиусе 300 метров от адреса и за 30 минут до начала.",
                bodyKz: "Белгілеу нысанда қосымша арқылы жасалады: ауысымды ашып, «Мен орындамын» түймесін басыңыз. Түйме мекенжайдан 300 метр радиуста және басталуға 30 минут қалғанда белсенді болады.",
                action: {
                    kind: "OPEN_LINK",
                    url: "#",
                    labelRu: "Видео: отметка на смене",
                    labelKz: "Бейне: ауысымда белгілену",
                },
            },
        ],
    },
    {
        ru: "Оплата и начисления",
        kz: "Төлем және есептеу",
        icon: "Wallet",
        children: [
            {
                ru: "Не пришли деньги за смену",
                kz: "Ауысым үшін ақша түспеді",
                children: [
                    {
                        ru: "Смена закрыта меньше 3 рабочих дней назад",
                        kz: "Ауысым 3 жұмыс күнінен аз уақыт бұрын жабылды",
                        bodyRu: "Это нормальный срок. Начисление приходит в течение 3 рабочих дней после того, как партнёр закрыл табель. Выходные и праздники в этот срок не входят.",
                        bodyKz: "Бұл қалыпты мерзім. Есептеу серіктес табельді жапқаннан кейін 3 жұмыс күні ішінде түседі. Демалыс және мереке күндері бұл мерзімге кірмейді.",
                    },
                    {
                        ru: "Прошло больше 3 рабочих дней",
                        kz: "3 жұмыс күнінен көп уақыт өтті",
                        bodyRu: "Срок вышел — нужна проверка. Нажмите кнопку ниже, укажите дату смены и объект, и мы поднимем начисление.",
                        bodyKz: "Мерзім өтті — тексеру қажет. Төмендегі түймені басып, ауысым күні мен нысанды көрсетіңіз, біз есептеуді қарайміз.",
                        action: { kind: "ESCALATE", category: "executor" },
                    },
                ],
            },
            {
                ru: "Начислили меньше, чем ожидал",
                kz: "Күткеннен аз есептелді",
                bodyRu: "Сумма считается по фактическим часам из табеля и тарифу смены. Если в табеле часы указаны неверно, это исправляет техподдержка вместе с партнёром.",
                bodyKz: "Сома табельдегі нақты сағаттар мен ауысым тарифі бойынша есептеледі. Табельде сағаттар қате көрсетілсе, оны техқолдау серіктеспен бірге түзетеді.",
                action: { kind: "ESCALATE", category: "executor" },
            },
            {
                ru: "Где посмотреть историю выплат",
                kz: "Төлемдер тарихын қайдан көруге болады",
                bodyRu: "Все начисления с датами и суммами лежат в профиле, в разделе «История выплат». Там же можно выгрузить справку за выбранный период.",
                action: {
                    kind: "OPEN_SCREEN",
                    screen: "profile.payouts",
                    labelRu: "Открыть историю выплат",
                    labelKz: "Төлемдер тарихын ашу",
                },
            },
        ],
    },
    {
        ru: "Документы и АВР",
        kz: "Құжаттар және ОЖА",
        icon: "FileText",
        children: [
            {
                ru: "Как подписать АВР за смену",
                kz: "Ауысым бойынша ОЖА-ға қалай қол қою керек",
                bodyRu: "Акт появляется в разделе «Документы» после закрытия табеля. Откройте акт, проверьте часы и сумму, нажмите «Подписать» — придёт СМС с кодом.",
                bodyKz: "Акт табель жабылғаннан кейін «Құжаттар» бөлімінде пайда болады. Актіні ашып, сағаттар мен соманы тексеріп, «Қол қою» түймесін басыңыз — коды бар СМС келеді.",
                action: {
                    kind: "OPEN_LINK",
                    url: "#",
                    labelRu: "Инструкция по подписанию АВР",
                    labelKz: "ОЖА-ға қол қою нұсқаулығы",
                },
            },
            {
                ru: "Не приходит СМС с кодом подписания",
                kz: "Қол қою коды бар СМС келмейді",
                children: [
                    {
                        ru: "Проверить номер в профиле",
                        kz: "Профильдегі нөмірді тексеру",
                        bodyRu: "Код уходит на номер из профиля, а не на тот, с которого вы звоните. Убедитесь, что номер актуальный, и запросите код повторно через минуту.",
                        bodyKz: "Код қоңырау шалып тұрған нөмірге емес, профильдегі нөмірге жіберіледі. Нөмірдің өзекті екеніне көз жеткізіп, бір минуттан кейін кодты қайта сұратыңыз.",
                        action: {
                            kind: "OPEN_SCREEN",
                            screen: "profile.main",
                            labelRu: "Проверить номер",
                            labelKz: "Нөмірді тексеру",
                        },
                    },
                    {
                        ru: "Номер верный, СМС не приходит",
                        kz: "Нөмір дұрыс, СМС келмейді",
                        bodyRu: "Похоже на проблему на стороне оператора связи. Передадим в техподдержку — подпишем акт альтернативным способом.",
                        bodyKz: "Бұл байланыс операторы жағындағы мәселеге ұқсайды. Техқолдауға береміз — актіге балама тәсілмен қол қоямыз.",
                        action: { kind: "ESCALATE", category: "executor" },
                    },
                ],
            },
            {
                ru: "Где скачать справку о доходах",
                kz: "Табыс туралы анықтаманы қайдан жүктеуге болады",
                bodyRu: "Справка формируется за любой период в разделе «История выплат» — кнопка «Выгрузить справку». Файл приходит на почту из профиля в течение 5 минут.",
                action: {
                    kind: "OPEN_SCREEN",
                    screen: "profile.payouts",
                    labelRu: "Выгрузить справку",
                    labelKz: "Анықтаманы жүктеу",
                },
            },
        ],
    },
    {
        ru: "Профиль и доступ",
        kz: "Профиль және қолжетімділік",
        icon: "UserCog",
        children: [
            {
                ru: "Не могу войти в приложение",
                kz: "Қосымшаға кіре алмаймын",
                children: [
                    {
                        ru: "Забыл пароль",
                        kz: "Құпия сөзді ұмыттым",
                        bodyRu: "Пароль восстанавливается по номеру телефона: на экране входа нажмите «Забыли пароль» и введите номер из профиля.",
                        bodyKz: "Құпия сөз телефон нөмірі арқылы қалпына келтіріледі: кіру экранында «Құпия сөзді ұмыттыңыз ба» түймесін басып, профильдегі нөмірді енгізіңіз.",
                        action: {
                            kind: "OPEN_SCREEN",
                            screen: "auth.reset",
                            labelRu: "Восстановить пароль",
                            labelKz: "Құпия сөзді қалпына келтіру",
                        },
                    },
                    {
                        ru: "Аккаунт заблокирован",
                        kz: "Аккаунт бұғатталған",
                        bodyRu: "Блокировка ставится вручную — чаще всего из-за неподтверждённых документов или жалобы партнёра. Разбирает только техподдержка.",
                        bodyKz: "Бұғаттау қолмен қойылады — көбіне расталмаған құжаттарға немесе серіктестің шағымына байланысты. Мұны тек техқолдау қарайды.",
                        action: { kind: "ESCALATE", category: "executor" },
                    },
                ],
            },
            {
                ru: "Как обновить санитарную книжку",
                kz: "Санитарлық кітапшаны қалай жаңартуға болады",
                bodyRu: "Сфотографируйте разворот с отметками и загрузите в «Документы». Проверка занимает до одного рабочего дня, после неё записи на смены снова открыты.",
                bodyKz: "Белгілері бар бетті суретке түсіріп, «Құжаттар» бөліміне жүктеңіз. Тексеру бір жұмыс күніне дейін уақыт алады, содан кейін ауысымдарға жазылу қайта ашылады.",
                action: {
                    kind: "OPEN_LINK",
                    url: "#",
                    labelRu: "Какие страницы санкнижки нужны",
                    labelKz: "Санитарлық кітапшаның қай беттері қажет",
                },
            },
            {
                ru: "Изменить номер телефона",
                kz: "Телефон нөмірін өзгерту",
                bodyRu: "Номер меняется только через техподдержку: он используется для входа и подписания актов.",
                bodyKz: "Нөмір тек техқолдау арқылы өзгертіледі: ол кіру және актілерге қол қою үшін қолданылады.",
                inactive: true,
                action: { kind: "ESCALATE", category: "executor" },
            },
        ],
    },
];

/** Опубликованное дерево: 28 узлов, максимальная глубина 4. */
export const CHAT_TREE: SupportChatNode[] = buildTree(RAW_TREE);

export const DEFAULT_SETTINGS: SupportChatSettings = {
    greetingRu: "Здравствуйте! Подскажу по частым вопросам. Выберите тему — или позовите оператора в любой момент.",
    greetingKz: "Сәлеметсіз бе! Жиі қойылатын сұрақтар бойынша көмектесемін. Тақырыпты таңдаңыз — немесе кез келген уақытта операторды шақырыңыз.",
    fallbackTextRu: "Не нашли свой вопрос? Опишите проблему, и её посмотрит специалист техподдержки.",
    fallbackTextKz: "Сұрағыңызды таппадыңыз ба? Мәселені сипаттаңыз, оны техқолдау маманы қарайды.",
    contactPhone: "+7 (707) 741-89-65",
    contactEmail: "support@teos.kz",
    btnHelpedRu: "Спасибо, помогло",
    btnHelpedKz: "Рахмет, көмектесті",
    btnEscalateRu: "Не помогло, нужен оператор",
    btnEscalateKz: "Көмектеспеді, оператор керек",
    btnBackRu: "Назад",
    btnBackKz: "Артқа",
};

// ═══════════════════════════════════════════════════════════════════════
// Обход дерева
// ═══════════════════════════════════════════════════════════════════════

/** Дети узла по порядку. includeInactive=false — как видит мобильное приложение. */
export function childrenOf(
    nodes: SupportChatNode[],
    parentId: string | null,
    includeInactive = false,
): SupportChatNode[] {
    return nodes
        .filter((n) => n.parentId === parentId && (includeInactive || n.isActive))
        .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function findNode(nodes: SupportChatNode[], id: string | null): SupportChatNode | null {
    if (!id) return null;
    return nodes.find((n) => n.id === id) ?? null;
}

/** Цепочка от корня до узла включительно — хлебные крошки и treePath тикета. */
export function pathTo(nodes: SupportChatNode[], id: string | null): SupportChatNode[] {
    const chain: SupportChatNode[] = [];
    const seen = new Set<string>();
    let current = findNode(nodes, id);
    while (current && !seen.has(current.id)) {
        seen.add(current.id);
        chain.unshift(current);
        current = findNode(nodes, current.parentId);
    }
    return chain;
}

/** Все потомки узла, включая вложенные. */
export function descendantsOf(nodes: SupportChatNode[], id: string): SupportChatNode[] {
    const out: SupportChatNode[] = [];
    const stack = [id];
    while (stack.length > 0) {
        const currentId = stack.pop() as string;
        for (const child of nodes.filter((n) => n.parentId === currentId)) {
            out.push(child);
            stack.push(child.id);
        }
    }
    return out;
}

/** Обход всего дерева сверху вниз в порядке отображения. */
export function flattenVisible(
    nodes: SupportChatNode[],
    expanded: Set<string>,
    parentId: string | null = null,
    depth = 0,
): { node: SupportChatNode; depth: number }[] {
    const out: { node: SupportChatNode; depth: number }[] = [];
    for (const node of childrenOf(nodes, parentId, true)) {
        out.push({ node, depth });
        if (expanded.has(node.id)) {
            out.push(...flattenVisible(nodes, expanded, node.id, depth + 1));
        }
    }
    return out;
}

// ═══════════════════════════════════════════════════════════════════════
// Перемещение узлов (BE-04)
// ═══════════════════════════════════════════════════════════════════════

/** Одна строка массового апдейта parent_id/sort_order. */
export interface ReorderPatch {
    id: string;
    parentId: string | null;
    sortOrder: number;
}

/**
 * Считает патч перемещения узла: что именно нужно отправить в BE-04, чтобы
 * дерево не оказалось в промежуточном несогласованном состоянии.
 * Возвращает пустой массив, если перемещение невозможно (узел в самого себя
 * или в собственного потомка).
 */
export function reorder(
    nodes: SupportChatNode[],
    nodeId: string,
    newParentId: string | null,
    newIndex: number,
): ReorderPatch[] {
    const node = findNode(nodes, nodeId);
    if (!node) return [];
    if (nodeId === newParentId) return [];
    if (newParentId && descendantsOf(nodes, nodeId).some((d) => d.id === newParentId)) return [];

    const oldParentId = node.parentId;
    const patches = new Map<string, ReorderPatch>();

    const target = childrenOf(nodes, newParentId, true).filter((n) => n.id !== nodeId);
    target.splice(Math.max(0, Math.min(newIndex, target.length)), 0, node);
    target.forEach((n, i) => {
        if (n.id === nodeId || n.parentId !== newParentId || n.sortOrder !== i) {
            patches.set(n.id, { id: n.id, parentId: newParentId, sortOrder: i });
        }
    });

    if (oldParentId !== newParentId) {
        childrenOf(nodes, oldParentId, true)
            .filter((n) => n.id !== nodeId)
            .forEach((n, i) => {
                if (n.sortOrder !== i) {
                    patches.set(n.id, { id: n.id, parentId: oldParentId, sortOrder: i });
                }
            });
    }

    return [...patches.values()];
}

export function applyPatches(
    nodes: SupportChatNode[],
    patches: ReorderPatch[],
    updatedBy: string,
): SupportChatNode[] {
    if (patches.length === 0) return nodes;
    const byId = new Map(patches.map((p) => [p.id, p]));
    return nodes.map((n) => {
        const patch = byId.get(n.id);
        if (!patch) return n;
        return { ...n, parentId: patch.parentId, sortOrder: patch.sortOrder, updatedBy, updatedAt: TREE_NOW };
    });
}

// ═══════════════════════════════════════════════════════════════════════
// Валидация (BE-03)
// ═══════════════════════════════════════════════════════════════════════

export type IssueLevel = "error" | "warning";

export interface ValidationIssue {
    level: IssueLevel;
    nodeId: string | null;
    message: string;
}

/**
 * Те же правила, что на бэкенде. Ошибки блокируют публикацию, предупреждения нет.
 */
export function validateTree(nodes: SupportChatNode[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    for (const node of nodes) {
        const children = nodes.filter((n) => n.parentId === node.id);
        const name = node.titleRu || "Без заголовка";

        if (node.nodeType === "ANSWER" && children.length > 0) {
            issues.push({
                level: "error",
                nodeId: node.id,
                message: `«${name}» — ответ не может иметь вложенные пункты (${children.length}).`,
            });
        }

        if (node.nodeType === "MENU" && children.filter((c) => c.isActive).length === 0) {
            issues.push({
                level: "error",
                nodeId: node.id,
                message: `«${name}» — меню без активных вложенных пунктов, пользователь упрётся в пустой экран.`,
            });
        }

        if (node.titleRu.trim() === "") {
            issues.push({ level: "error", nodeId: node.id, message: "Узел без заголовка на русском." });
        }

        if (node.nodeType === "ANSWER" && (node.bodyRu ?? "").trim() === "") {
            issues.push({
                level: "error",
                nodeId: node.id,
                message: `«${name}» — ответ без текста на русском.`,
            });
        }

        if (!isTranslated(node)) {
            issues.push({
                level: "warning",
                nodeId: node.id,
                message: `«${name}» — нет казахского перевода, пользователю покажется русский текст.`,
            });
        }

        // Цикл: поднимаемся к корню и смотрим, не вернулись ли в себя.
        const seen = new Set<string>([node.id]);
        let cursor = findNode(nodes, node.parentId);
        while (cursor) {
            if (seen.has(cursor.id)) {
                issues.push({
                    level: "error",
                    nodeId: node.id,
                    message: `«${name}» — цикл в дереве: узел является собственным предком.`,
                });
                break;
            }
            seen.add(cursor.id);
            cursor = findNode(nodes, cursor.parentId);
        }
    }

    // Из каждой корневой ветки должен быть достижим хотя бы один ESCALATE.
    for (const root of childrenOf(nodes, null, true)) {
        const branch = [root, ...descendantsOf(nodes, root.id)];
        const hasEscalate = branch.some((n) => n.isActive && n.actionType === "ESCALATE");
        if (!hasEscalate) {
            issues.push({
                level: "warning",
                nodeId: root.id,
                message: `«${root.titleRu}» — из этой ветки нельзя позвать оператора: нет ни одного действия «${ACTION_LABEL.ESCALATE}».`,
            });
        }
    }

    return issues;
}

export function countErrors(issues: ValidationIssue[]): number {
    return issues.filter((i) => i.level === "error").length;
}

// ═══════════════════════════════════════════════════════════════════════
// Новый узел и подписи действий
// ═══════════════════════════════════════════════════════════════════════

export function makeNode(
    parentId: string | null,
    sortOrder: number,
    updatedBy: string,
): SupportChatNode {
    return {
        id: `new-${Math.random().toString(16).slice(2, 10)}-${Date.now().toString(16)}`,
        parentId,
        nodeType: "ANSWER",
        sortOrder,
        isActive: true,
        titleRu: "Новый пункт",
        titleKz: "",
        bodyRu: "",
        bodyKz: "",
        icon: null,
        actionType: "NONE",
        actionPayload: { kind: "NONE" },
        updatedBy,
        updatedAt: TREE_NOW,
    };
}

export function defaultPayload(type: ActionType): ActionPayload {
    switch (type) {
        case "ESCALATE":
            return { kind: "ESCALATE", category: "executor" };
        case "OPEN_LINK":
            return { kind: "OPEN_LINK", url: "", labelRu: "Открыть инструкцию", labelKz: "" };
        case "OPEN_SCREEN":
            return { kind: "OPEN_SCREEN", screen: APP_SCREENS[0].value, labelRu: "Перейти", labelKz: "" };
        case "CALL_CENTER":
            return { kind: "CALL_CENTER", phone: null };
        default:
            return { kind: "NONE" };
    }
}

/** Подпись кнопки действия под автоответом. */
export function actionLabel(
    payload: ActionPayload | null,
    settings: SupportChatSettings,
    lang: Lang = "ru",
): string {
    if (!payload) return "";
    switch (payload.kind) {
        case "ESCALATE":
            return lang === "kz"
                ? settings.btnEscalateKz || settings.btnEscalateRu
                : settings.btnEscalateRu;
        case "OPEN_LINK":
        case "OPEN_SCREEN":
            return lang === "kz" ? payload.labelKz || payload.labelRu : payload.labelRu;
        case "CALL_CENTER":
            return `${lang === "kz" ? "Қоңырау шалу" : "Позвонить"} ${payload.phone ?? settings.contactPhone}`;
        default:
            return "";
    }
}

// ═══════════════════════════════════════════════════════════════════════
// Поиск по заголовкам — чтобы моки не зависели от порядковых uuid
// ═══════════════════════════════════════════════════════════════════════

/** Спускается по дереву по цепочке русских заголовков и возвращает id каждого шага. */
export function findPathByTitles(nodes: SupportChatNode[], titles: string[]): string[] {
    const ids: string[] = [];
    let parentId: string | null = null;
    for (const title of titles) {
        const match: SupportChatNode | undefined = childrenOf(nodes, parentId, true).find(
            (n) => n.titleRu === title,
        );
        if (!match) return ids;
        ids.push(match.id);
        parentId = match.id;
    }
    return ids;
}

/**
 * Путь демо-тикета: Оплата и начисления → Не пришли деньги → Прошло больше 3 дней.
 * Заканчивается узлом с ESCALATE — на нём пользователь и позвал оператора.
 */
export const DEMO_TREE_PATH: string[] = findPathByTitles(CHAT_TREE, [
    "Оплата и начисления",
    "Не пришли деньги за смену",
    "Прошло больше 3 рабочих дней",
]);
