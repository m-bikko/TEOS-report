# TreePanel

Левая колонка конструктора дерева частых вопросов.

| | |
|---|---|
| Компонент | `src/app/support-chat-builder/TreePanel.tsx` |
| Подключение | `src/app/support-chat-builder/page.tsx` |
| Модель и хелперы | `src/app/_support-shared/chatTree.ts` |
| Зависимости | React, `lucide-react`. Библиотеки дерева и DnD не используются |
| Директива | `"use client"` |

---

## 1. Пропсы

Компонент управляемый. Своего состояния — только `dragId` и `dropTarget`.

```ts
interface Props {
    nodes: SupportChatNode[];              // плоский массив, зеркало support_chat_node
    selectedId: string | null;
    expanded: Set<string>;                 // id развёрнутых узлов
    issues: ValidationIssue[];             // validateTree(nodes)
    onSelect: (id: string) => void;
    onToggleExpand: (id: string) => void;
    onMove: (nodeId: string, newParentId: string | null, newIndex: number) => void;
    onAddChild: (parentId: string | null) => void;   // null — корневой раздел
    onToggleActive: (id: string) => void;
    onNudge: (id: string, direction: -1 | 1) => void;
}
```

Состояние в родителе:

```ts
const [nodes, setNodes] = useState<SupportChatNode[]>(CHAT_TREE);
const [selectedId, setSelectedId] = useState<string | null>(nodes[0]?.id ?? null);
const [expanded, setExpanded] = useState<Set<string>>(new Set(/* id корней */));
const issues = useMemo(() => validateTree(nodes), [nodes]);
```

---

## 2. Модель узла

```ts
interface SupportChatNode {
    id: string;
    parentId: string | null;
    nodeType: "MENU" | "ANSWER";
    sortOrder: number;
    isActive: boolean;
    titleRu: string;
    titleKz: string;
    bodyRu: string | null;      // только у ANSWER
    bodyKz: string | null;
    icon: string | null;        // имя иконки lucide-react, PascalCase
    actionType: "NONE" | "ESCALATE" | "OPEN_LINK" | "OPEN_SCREEN" | "CALL_CENTER";
    actionPayload: ActionPayload | null;
    updatedBy: string;
    updatedAt: string;
}
```

Дерево хранится плоским массивом — один в один строки БД. Вложенность собирается
на лету: `flattenVisible(nodes, expanded)` возвращает `{ node, depth }[]` в порядке
отображения. Отступ уровня — `paddingLeft: 8 + depth * 14`. Глубина не ограничена.

---

## 3. Элементы строки

Слева направо:

| Элемент | Значение |
|---|---|
| `⠿` | Ручка перетаскивания. Тащится вся строка |
| `˅` / `›` | Свернуть/развернуть. Рисуется только при наличии детей |
| Синяя иконка диалогов | `nodeType: "MENU"` — открывает следующий уровень |
| Зелёная иконка сообщения | `nodeType: "ANSWER"` — выдаёт готовый текст |
| Серая иконка | `node.icon` — иконка раздела в мобильном приложении |
| Заголовок | `titleRu`; пустой — «Без заголовка» |
| Зачёркнутый серый заголовок | `isActive: false` |
| Жёлтый бейдж `KZ` | Нет казахского перевода |
| Синий бейдж `оператор` | `actionType: "ESCALATE"` |
| Красный кружок `!` | На узле есть ошибка валидации |

Действия при наведении, справа: `↑` / `↓` — `onNudge`, `↳` — `onAddChild(node.id)`,
глаз — `onToggleActive`. Кнопка `+ Раздел` в шапке — `onAddChild(null)`.

Счётчик в шапке: `N узлов · M без перевода`. `M` считается в панели через
`isTranslated(node)` и показывается только при `M > 0`.

Реестр иконок — `src/app/_support-shared/icons.tsx`, SVG-файлы — `public/icons/nodes/`.
Имя в БД PascalCase, файл kebab-case, перевод — `nodeIconPath()`.

---

## 4. Перетаскивание

Нативный HTML5 DnD. Строка получает `draggable`, зона сброса считается из
`getBoundingClientRect()`:

```
┌──────────────────────────┐
│ верхние 25%   → before   │  вставить выше, тем же уровнем
├──────────────────────────┤
│ середина 50%  → inside   │  сделать вложенным
├──────────────────────────┤
│ нижние 25%    → after    │  вставить ниже, тем же уровнем
└──────────────────────────┘
```

- `before` / `after` — синяя линия по краю строки, `inside` — рамка вокруг строки.
- Перетаскиваемая строка — `opacity: 0.4`.
- Сброс в пустую область под деревом — перенос в корень, в конец.
- `dragover` и `drop` останавливают всплытие: иначе вложенная строка и её родитель
  конкурируют за один сброс.

**Тач-экраны не поддерживаются** — нативный DnD работает только с мышью. На планшете
перенос доступен стрелками `↑` / `↓`.

**Автотесты.** `dragstart` и `drop` нельзя симулировать в одном вызове JS: React
не перерисуется между ними, и обработчик увидит `dragId === null`. Два отдельных шага.

---

## 5. Связь с бэкендом (BE-04)

`onMove` — единственное место, где меняется структура. Прогонять через `reorder()`:

```ts
const moveNode = (nodeId: string, newParentId: string | null, newIndex: number): void => {
    const patches = reorder(nodes, nodeId, newParentId, newIndex);
    if (patches.length === 0) return;   // перенос в себя или в собственного потомка

    const moved = applyPatches(nodes, patches, EDITOR_NAME);
    setNodes(
        newParentId
            ? moved.map((n) => (n.id === newParentId ? { ...n, nodeType: "MENU" as const } : n))
            : moved,
    );
    setLastPatch(patches);              // это уходит в BE-04
    if (newParentId) setExpanded((prev) => new Set(prev).add(newParentId));
};
```

`reorder()` возвращает `ReorderPatch[]` — перенумерованные `parentId`/`sortOrder`
**обоих** затронутых уровней. Отправлять одним массовым запросом: по одному —
дыры и дубли в `sort_order` между запросами.

Два довеска обязательны:
- узел, в который вложили, становится `MENU` — иначе сразу ошибка «ответ с вложенными пунктами»;
- он же разворачивается — иначе перенесённая строка визуально исчезает.

`onNudge` — тот же `moveNode` с соседним индексом.

---

## 6. Валидация

`validateTree(nodes)`, те же правила, что на бэкенде.

**Ошибки** (красный кружок) блокируют публикацию:

| Условие | Сообщение |
|---|---|
| `ANSWER` с детьми | ответ не может иметь вложенные пункты |
| `MENU` без активных детей | пользователь упрётся в пустой экран |
| Пустой `titleRu` | узел без заголовка на русском |
| `ANSWER` с пустым `bodyRu` | ответ без текста на русском |
| Узел — собственный предок | цикл в дереве |

**Предупреждения** (жёлтый треугольник) публикацию не блокируют:

| Условие | Сообщение |
|---|---|
| Нет `titleKz` (или `bodyKz` у `ANSWER`) | пользователю покажется русский текст |
| В корневой ветке нет активного `ESCALATE` | из ветки нельзя позвать оператора |

Клик по замечанию — `onSelect(issue.nodeId)`. Пустой список — зелёная плашка
«Замечаний нет — дерево можно публиковать».

---

## 7. Грабли

| | |
|---|---|
| Побочные эффекты в апдейтере | Не вызывать `setSelectedId` внутри `setNodes(prev => …)`: в Strict Mode апдейтер выполняется дважды. Считать новый id из текущего `nodes` до вызова |
| Неактивные узлы | `flattenVisible` возвращает и их — намеренно, иначе скрытое не вернуть. Мобильное приложение читает через `childrenOf(nodes, parentId)` без `includeInactive` |
| `makeNode` | Использует `Math.random()` и `Date.now()`. Вызов в обработчике клика, не в рендере — иначе рассинхрон гидрации |
| Хранение дерева | Панель не хранит ничего. Любое изменение идёт через родителя |

---

## 8. Перенос в боевой ERP

1. `CHAT_TREE` → загрузка по BE-01, форма ответа совпадает.
2. `onMove` → `reorder()` → PATCH массивом на BE-04.
3. `validateTree` продублировать на сервере — клиентская проверка для удобства.
4. Новую иконку в списке допустимых выгрузить в `public/icons/nodes/`, иначе клиент
   получит пустоту. Способ выгрузки — `public/icons/README.md`.
5. Ширина колонки в стенде 296px. Ниже ~260px заголовки обрезаются до бесполезного.
6. Нужны тач-экраны — заменить нативный DnD на `dnd-kit` (pointer events).

---

## См. также

- `docs/SUPPORT_CHAT_TREE_GUIDE.md` — модель дерева и контракт BE-01…BE-06
- `wiki/pages/entities/support-chat-builder.md` — устройство конструктора
- `wiki/pages/concepts/support-chat-flow.md` — путь обращения до оператора
