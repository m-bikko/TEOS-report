/**
 * Дерево частых вопросов чата техподдержки.
 *
 * Зеркало контракта бэкенда (BE-01…BE-06): узлы хранятся ПЛОСКИМ массивом,
 * как строки таблицы `support_chat_node`, а вложенность строится на лету
 * через childrenOf(). Так демо показывает ровно то, что лежит в БД, и делает
 * очевидным смысл BE-04 (массовое обновление parent_id/sort_order).
 *
 * Демо только на русском: полей title_kz/body_kz из контракта здесь нет,
 * переключатель языков в проекте живёт в другом месте.
 *
 * Этот файл НЕ импортирует ничего из mockData.ts — зависимость односторонняя
 * (mockData → chatTree), иначе получается цикл через TicketCategory.
 */

// ═══════════════════════════════════════════════════════════════════════
// Типы
// ═══════════════════════════════════════════════════════════════════════

/** Категория обращения. Живёт здесь, потому что нужна в payload'е ESCALATE. */
export type TicketCategory = "b2b" | "executor";

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
    | { kind: "OPEN_LINK"; url: string; label: string }
    | { kind: "OPEN_SCREEN"; screen: string; label: string }
    /** phone: null → берётся contactPhone из настроек */
    | { kind: "CALL_CENTER"; phone: string | null };

/** Строка таблицы support_chat_node (BE-01). */
export interface SupportChatNode {
    id: string;
    parentId: string | null;
    nodeType: NodeType;
    sortOrder: number;
    isActive: boolean;
    /** title_ru */
    title: string;
    /** body_ru, заполнен только у ANSWER */
    body: string | null;
    /** имя иконки lucide-react */
    icon: string | null;
    actionType: ActionType;
    actionPayload: ActionPayload | null;
    updatedBy: string;
    updatedAt: string;
}

/** support_chat_settings (BE-05). */
export interface SupportChatSettings {
    greeting: string;
    fallbackText: string;
    contactPhone: string;
    contactEmail: string;
    btnHelped: string;
    btnEscalate: string;
    btnBack: string;
}

/** support_chat_version (BE-01). */
export interface SupportChatVersion {
    id: number;
    version: number;
    status: "PUBLISHED" | "ARCHIVED";
    publishedAt: string;
    publishedBy: string;
    nodeCount: number;
    snapshot: SupportChatNode[];
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
export const TREE_NOW = "2026-09-22T10:00:00Z";

// ═══════════════════════════════════════════════════════════════════════
// Сборка мок-дерева
// ═══════════════════════════════════════════════════════════════════════

interface RawNode {
    title: string;
    icon?: string;
    body?: string;
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
                title: item.title,
                body: hasChildren ? null : (item.body ?? ""),
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
        title: "Смены",
        icon: "CalendarClock",
        children: [
            {
                title: "Не могу записаться на смену",
                children: [
                    {
                        title: "Кнопка «Записаться» неактивна",
                        body: "Кнопка блокируется, если в профиле не хватает документов. Откройте раздел «Документы» и проверьте, что загружены удостоверение личности и санитарная книжка с действующим сроком.",
                        action: { kind: "OPEN_SCREEN", screen: "profile.documents", label: "Открыть мои документы" },
                    },
                    {
                        title: "Запись отклонена",
                        children: [
                            {
                                title: "Просрочена санитарная книжка",
                                body: "Партнёр отклоняет запись автоматически, если срок санкнижки истёк. Обновите её в профиле и запишитесь на смену заново — повторная запись доступна сразу после загрузки.",
                                action: { kind: "OPEN_LINK", url: "#", label: "Инструкция по обновлению санкнижки" },
                            },
                            {
                                title: "Не указан ИИН",
                                body: "Без ИИН невозможно оформить акт выполненных работ, поэтому запись отклоняется. Заполните ИИН в профиле — проверка занимает до 10 минут.",
                                action: { kind: "OPEN_SCREEN", screen: "profile.main", label: "Заполнить ИИН" },
                            },
                            {
                                title: "Причина не указана",
                                body: "Если партнёр отклонил запись без причины, это разбирает техподдержка вручную. Нажмите кнопку ниже — мы посмотрим вашу заявку и вернёмся с ответом.",
                                action: { kind: "ESCALATE", category: "executor" },
                            },
                        ],
                    },
                    {
                        title: "Смена пропала из списка",
                        body: "Смена исчезает из каталога, когда партнёр набрал нужное количество исполнителей или отменил заказ. Записи на другие смены это не затрагивает — посмотрите свежий список в каталоге.",
                    },
                ],
            },
            {
                title: "Опоздал или не смог выйти на смену",
                body: "Сообщите об этом как можно раньше: партнёр успеет найти замену, а вам не снизят рейтинг. По таким вопросам звоните напрямую в контакт-центр.",
                action: { kind: "CALL_CENTER", phone: null },
            },
            {
                title: "Как отметиться на смене",
                body: "Отметка делается в приложении на объекте: откройте смену и нажмите «Я на месте». Кнопка активна в радиусе 300 метров от адреса и за 30 минут до начала.",
                action: { kind: "OPEN_LINK", url: "#", label: "Видео: отметка на смене" },
            },
        ],
    },
    {
        title: "Оплата и начисления",
        icon: "Wallet",
        children: [
            {
                title: "Не пришли деньги за смену",
                children: [
                    {
                        title: "Смена закрыта меньше 3 рабочих дней назад",
                        body: "Это нормальный срок. Начисление приходит в течение 3 рабочих дней после того, как партнёр закрыл табель. Выходные и праздники в этот срок не входят.",
                    },
                    {
                        title: "Прошло больше 3 рабочих дней",
                        body: "Срок вышел — нужна проверка. Нажмите кнопку ниже, укажите дату смены и объект, и мы поднимем начисление.",
                        action: { kind: "ESCALATE", category: "executor" },
                    },
                ],
            },
            {
                title: "Начислили меньше, чем ожидал",
                body: "Сумма считается по фактическим часам из табеля и тарифу смены. Если в табеле часы указаны неверно, это исправляет техподдержка вместе с партнёром.",
                action: { kind: "ESCALATE", category: "executor" },
            },
            {
                title: "Где посмотреть историю выплат",
                body: "Все начисления с датами и суммами лежат в профиле, в разделе «История выплат». Там же можно выгрузить справку за выбранный период.",
                action: { kind: "OPEN_SCREEN", screen: "profile.payouts", label: "Открыть историю выплат" },
            },
        ],
    },
    {
        title: "Документы и АВР",
        icon: "FileText",
        children: [
            {
                title: "Как подписать АВР за смену",
                body: "Акт появляется в разделе «Документы» после закрытия табеля. Откройте акт, проверьте часы и сумму, нажмите «Подписать» — придёт СМС с кодом.",
                action: { kind: "OPEN_LINK", url: "#", label: "Инструкция по подписанию АВР" },
            },
            {
                title: "Не приходит СМС с кодом подписания",
                children: [
                    {
                        title: "Проверить номер в профиле",
                        body: "Код уходит на номер из профиля, а не на тот, с которого вы звоните. Убедитесь, что номер актуальный, и запросите код повторно через минуту.",
                        action: { kind: "OPEN_SCREEN", screen: "profile.main", label: "Проверить номер" },
                    },
                    {
                        title: "Номер верный, СМС не приходит",
                        body: "Похоже на проблему на стороне оператора связи. Передадим в техподдержку — подпишем акт альтернативным способом.",
                        action: { kind: "ESCALATE", category: "executor" },
                    },
                ],
            },
            {
                title: "Где скачать справку о доходах",
                body: "Справка формируется за любой период в разделе «История выплат» — кнопка «Выгрузить справку». Файл приходит на почту из профиля в течение 5 минут.",
                action: { kind: "OPEN_SCREEN", screen: "profile.payouts", label: "Выгрузить справку" },
            },
        ],
    },
    {
        title: "Профиль и доступ",
        icon: "UserCog",
        children: [
            {
                title: "Не могу войти в приложение",
                children: [
                    {
                        title: "Забыл пароль",
                        body: "Пароль восстанавливается по номеру телефона: на экране входа нажмите «Забыли пароль» и введите номер из профиля.",
                        action: { kind: "OPEN_SCREEN", screen: "auth.reset", label: "Восстановить пароль" },
                    },
                    {
                        title: "Аккаунт заблокирован",
                        body: "Блокировка ставится вручную — чаще всего из-за неподтверждённых документов или жалобы партнёра. Разбирает только техподдержка.",
                        action: { kind: "ESCALATE", category: "executor" },
                    },
                ],
            },
            {
                title: "Как обновить санитарную книжку",
                body: "Сфотографируйте разворот с отметками и загрузите в «Документы». Проверка занимает до одного рабочего дня, после неё записи на смены снова открыты.",
                action: { kind: "OPEN_LINK", url: "#", label: "Какие страницы санкнижки нужны" },
            },
            {
                title: "Изменить номер телефона",
                body: "Номер меняется только через техподдержку: он используется для входа и подписания актов.",
                inactive: true,
                action: { kind: "ESCALATE", category: "executor" },
            },
        ],
    },
];

/** Опубликованное дерево: 28 узлов, максимальная глубина 4. */
export const CHAT_TREE: SupportChatNode[] = buildTree(RAW_TREE);

export const DEFAULT_SETTINGS: SupportChatSettings = {
    greeting: "Здравствуйте! Подскажу по частым вопросам. Выберите тему — или позовите оператора в любой момент.",
    fallbackText: "Не нашли свой вопрос? Опишите проблему, и её посмотрит специалист техподдержки.",
    contactPhone: "+7 (707) 741-89-65",
    contactEmail: "support@teos.kz",
    btnHelped: "Спасибо, помогло",
    btnEscalate: "Не помогло, нужен оператор",
    btnBack: "Назад",
};

export const CHAT_VERSIONS: SupportChatVersion[] = [
    {
        id: 3,
        version: 3,
        status: "PUBLISHED",
        publishedAt: "2026-09-18T09:20:00Z",
        publishedBy: "Айгуль Сериккызы",
        nodeCount: CHAT_TREE.length,
        snapshot: CHAT_TREE,
    },
    {
        id: 2,
        version: 2,
        status: "ARCHIVED",
        publishedAt: "2026-08-04T12:05:00Z",
        publishedBy: "Айгуль Сериккызы",
        nodeCount: 21,
        snapshot: CHAT_TREE.slice(0, 21),
    },
    {
        id: 1,
        version: 1,
        status: "ARCHIVED",
        publishedAt: "2026-07-11T15:40:00Z",
        publishedBy: "Данияр Оспанов",
        nodeCount: 12,
        snapshot: CHAT_TREE.slice(0, 12),
    },
];

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

export function depthOf(nodes: SupportChatNode[], id: string): number {
    return pathTo(nodes, id).length;
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
// Валидация (BE-03, BE-06)
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

        if (node.nodeType === "ANSWER" && children.length > 0) {
            issues.push({
                level: "error",
                nodeId: node.id,
                message: `«${node.title}» — ответ не может иметь вложенные пункты (${children.length}).`,
            });
        }

        if (node.nodeType === "MENU" && children.filter((c) => c.isActive).length === 0) {
            issues.push({
                level: "error",
                nodeId: node.id,
                message: `«${node.title}» — меню без активных вложенных пунктов, пользователь упрётся в пустой экран.`,
            });
        }

        if (node.title.trim() === "") {
            issues.push({ level: "error", nodeId: node.id, message: "Узел без заголовка." });
        }

        if (node.nodeType === "ANSWER" && (node.body ?? "").trim() === "") {
            issues.push({
                level: "error",
                nodeId: node.id,
                message: `«${node.title}» — ответ без текста.`,
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
                    message: `«${node.title}» — цикл в дереве: узел является собственным предком.`,
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
                message: `«${root.title}» — из этой ветки нельзя позвать оператора: нет ни одного действия «${ACTION_LABEL.ESCALATE}».`,
            });
        }
    }

    return issues;
}

export function countErrors(issues: ValidationIssue[]): number {
    return issues.filter((i) => i.level === "error").length;
}

// ═══════════════════════════════════════════════════════════════════════
// Импорт / экспорт (BE-06)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Формат выгрузки — snake_case, как колонки в БД, чтобы файл можно было
 * отдать бэкенду без переименований.
 */
interface ExportNode {
    id: string;
    parent_id: string | null;
    node_type: NodeType;
    sort_order: number;
    is_active: boolean;
    title_ru: string;
    body_ru: string | null;
    icon: string | null;
    action_type: ActionType;
    action_payload: ActionPayload | null;
}

export interface ExportBundle {
    exported_at: string;
    settings: SupportChatSettings;
    nodes: ExportNode[];
}

export function exportTree(nodes: SupportChatNode[], settings: SupportChatSettings): ExportBundle {
    return {
        exported_at: TREE_NOW,
        settings,
        nodes: nodes
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((n) => ({
                id: n.id,
                parent_id: n.parentId,
                node_type: n.nodeType,
                sort_order: n.sortOrder,
                is_active: n.isActive,
                title_ru: n.title,
                body_ru: n.body,
                icon: n.icon,
                action_type: n.actionType,
                action_payload: n.actionPayload,
            })),
    };
}

export type ImportResult =
    | { ok: true; nodes: SupportChatNode[]; settings: SupportChatSettings }
    | { ok: false; errors: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Разбор выгрузки с той же валидацией, что в обычном CRUD. */
export function importTree(rawJson: string, fallbackSettings: SupportChatSettings): ImportResult {
    let parsed: unknown;
    try {
        parsed = JSON.parse(rawJson);
    } catch {
        return { ok: false, errors: ["Не удалось разобрать JSON — проверьте синтаксис."] };
    }

    if (!isRecord(parsed) || !Array.isArray(parsed.nodes)) {
        return { ok: false, errors: ["Ожидается объект с массивом «nodes»."] };
    }

    const errors: string[] = [];
    const nodes: SupportChatNode[] = [];

    parsed.nodes.forEach((raw: unknown, i: number) => {
        if (!isRecord(raw)) {
            errors.push(`Элемент ${i + 1}: ожидается объект.`);
            return;
        }
        const id = typeof raw.id === "string" ? raw.id : null;
        const title = typeof raw.title_ru === "string" ? raw.title_ru : null;
        const nodeType = raw.node_type === "MENU" || raw.node_type === "ANSWER" ? raw.node_type : null;
        if (!id) errors.push(`Элемент ${i + 1}: отсутствует «id».`);
        if (title === null) errors.push(`Элемент ${i + 1}: отсутствует «title_ru».`);
        if (!nodeType) errors.push(`Элемент ${i + 1}: «node_type» должен быть MENU или ANSWER.`);
        if (!id || title === null || !nodeType) return;

        const actionType =
            typeof raw.action_type === "string" && raw.action_type in ACTION_LABEL
                ? (raw.action_type as ActionType)
                : "NONE";

        nodes.push({
            id,
            parentId: typeof raw.parent_id === "string" ? raw.parent_id : null,
            nodeType,
            sortOrder: typeof raw.sort_order === "number" ? raw.sort_order : 0,
            isActive: raw.is_active !== false,
            title,
            body: typeof raw.body_ru === "string" ? raw.body_ru : null,
            icon: typeof raw.icon === "string" ? raw.icon : null,
            actionType,
            actionPayload: isRecord(raw.action_payload)
                ? (raw.action_payload as unknown as ActionPayload)
                : { kind: "NONE" },
            updatedBy: "Импорт",
            updatedAt: TREE_NOW,
        });
    });

    if (errors.length > 0) return { ok: false, errors };

    const ids = new Set(nodes.map((n) => n.id));
    for (const node of nodes) {
        if (node.parentId && !ids.has(node.parentId)) {
            errors.push(`«${node.title}»: родитель «${node.parentId}» отсутствует в выгрузке.`);
        }
    }
    if (errors.length > 0) return { ok: false, errors };

    const structural = validateTree(nodes).filter((i) => i.level === "error");
    if (structural.length > 0) {
        return { ok: false, errors: structural.map((i) => i.message) };
    }

    const settings = isRecord(parsed.settings)
        ? { ...fallbackSettings, ...(parsed.settings as Partial<SupportChatSettings>) }
        : fallbackSettings;

    return { ok: true, nodes, settings };
}

// ═══════════════════════════════════════════════════════════════════════
// Новый узел
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
        title: "Новый пункт",
        body: "",
        icon: null,
        actionType: "NONE",
        actionPayload: { kind: "NONE" },
        updatedBy,
        updatedAt: TREE_NOW,
    };
}

export function defaultPayload(type: ActionType, settings: SupportChatSettings): ActionPayload {
    switch (type) {
        case "ESCALATE":
            return { kind: "ESCALATE", category: "executor" };
        case "OPEN_LINK":
            return { kind: "OPEN_LINK", url: "", label: "Открыть инструкцию" };
        case "OPEN_SCREEN":
            return { kind: "OPEN_SCREEN", screen: APP_SCREENS[0].value, label: "Перейти" };
        case "CALL_CENTER":
            return { kind: "CALL_CENTER", phone: null };
        default:
            void settings;
            return { kind: "NONE" };
    }
}

// ═══════════════════════════════════════════════════════════════════════
// Поиск по заголовкам — чтобы моки не зависели от порядковых uuid
// ═══════════════════════════════════════════════════════════════════════

/** Спускается по дереву по цепочке заголовков и возвращает id каждого шага. */
export function findPathByTitles(nodes: SupportChatNode[], titles: string[]): string[] {
    const ids: string[] = [];
    let parentId: string | null = null;
    for (const title of titles) {
        const match: SupportChatNode | undefined = childrenOf(nodes, parentId, true).find(
            (n) => n.title === title,
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

/** Подпись кнопки действия под автоответом. */
export function actionLabel(payload: ActionPayload | null, settings: SupportChatSettings): string {
    if (!payload) return "";
    switch (payload.kind) {
        case "ESCALATE":
            return settings.btnEscalate;
        case "OPEN_LINK":
        case "OPEN_SCREEN":
            return payload.label;
        case "CALL_CENTER":
            return `Позвонить ${payload.phone ?? settings.contactPhone}`;
        default:
            return "";
    }
}
