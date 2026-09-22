---
title: Контракт бэкенда по дереву чата (BE-01…BE-06)
type: source
tags: [support, backend, contract]
created: 2026-09-22
updated: 2026-09-22
sources: [docs/SUPPORT_CHAT_TREE_GUIDE.md, docs/superpowers/specs/2026-09-22-support-chat-tree-design.md]
---

# Контракт бэкенда: BE-01…BE-06

Постановка от тех-лида по серверной части дерева частых вопросов. Стенд построен так,
чтобы ей соответствовать, а не изобретать своё.

## Состав задач

| Задача | О чём |
|---|---|
| BE-01 | таблицы `support_chat_node`, `support_chat_version`, `support_chat_settings` |
| BE-02 | публичный `GET /support-chat/tree` с ETag и локализацией |
| BE-03 | админский CRUD черновика с проверками на циклы и `ANSWER` без потомков |
| BE-04 | массовое обновление `parent_id` / `sort_order` одним запросом |
| BE-05 | настройки чата: приветствие, fallback, контакты, подписи кнопок |
| BE-06 | импорт/экспорт черновика в JSON с той же валидацией |

## Что постановка оставила открытым

Набор значений `action_type` — задан только дефолт `NONE` и наличие `action_payload`.
Пять значений предложены на стенде, см. [[support-chat-tree]].

## Чего на стенде нет

Полей `title_kz` / `body_kz`: демо одноязычное по решению заказчика.

## См. также

- [[support-chat-tree]] — как контракт лёг в модель
- [[support-chat-builder]] — как он отражён в интерфейсе
