# REPOSITORY_STRUCTURE.md

Один репозиторий, одно Next.js-приложение (modular monolith). Менеджер пакетов — **pnpm**. Node 22 LTS.

---

## 1. Дерево

```
ege-math/
├── .claude/                     # Всё для Claude Code
│   ├── settings.json            # разрешённые команды, hooks (lint/typecheck после правок)
│   ├── commands/                # слэш-команды: /new-feature, /new-template, /review, /migrate
│   └── agents/                  # sub-agents: reviewer.md, test-writer.md, security-auditor.md
├── .github/
│   ├── workflows/
│   │   ├── ci.yml               # lint, typecheck, unit, e2e, db-migrate-check
│   │   ├── deploy-db.yml        # supabase db push на main
│   │   ├── backup.yml           # ежедневный pg_dump → R2
│   │   └── security.yml         # gitleaks, pnpm audit, dependabot
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── CODEOWNERS
├── .husky/                      # pre-commit: lint-staged, gitleaks; commit-msg: commitlint
├── CLAUDE.md                    # Главные правила проекта для Claude Code (см. DEVELOPMENT_WORKFLOW)
├── README.md
├── docs/
│   ├── TECH_ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── SECURITY.md
│   ├── DEVELOPMENT_WORKFLOW.md
│   ├── REPOSITORY_STRUCTURE.md
│   ├── adr/                     # Architecture Decision Records: 0001-supabase.md, 0002-drizzle.md …
│   ├── product/                 # PRD, user stories, спецификации прототипов ЕГЭ
│   ├── content/                 # методические описания прототипов и шаблонов (для методистов)
│   └── ops/                     # runbooks: restore-drill, incident, rotate-keys
├── content/                     # Данные банка заданий (source of truth в git, импортируется в БД)
│   ├── exams/ege_math_prof.json
│   ├── topics/
│   └── prototypes/03-stereometry/*.json     # прототипы + метаданные шаблонов (без кода)
├── supabase/
│   ├── config.toml
│   ├── migrations/              # 0001_init.sql, 0002_auth_helpers.sql, 0003_rls_core.sql …
│   ├── seed.sql                 # тестовые пользователи, 1 группа, 3 прототипа
│   ├── functions/               # Edge Functions (если понадобятся): render-pdf/, nightly-stats/
│   └── tests/                   # pgTAP-тесты RLS: rls_attempts.test.sql …
├── database/
│   ├── schema/                  # Drizzle-схема (TS): users.ts, content.ts, tasks.ts, assignments.ts …
│   ├── relations.ts
│   ├── types.ts                 # сгенерированные типы Supabase (supabase gen types)
│   └── seed/                    # TS-скрипты сидов из content/ → БД
├── src/
│   ├── app/                     # Next.js App Router — только маршрутизация и композиция
│   │   ├── (auth)/login|register|reset/
│   │   ├── (student)/dashboard|practice|assignments|stats/
│   │   ├── (teacher)/dashboard|groups|assignments|worksheets|analytics/
│   │   ├── (admin)/prototypes|templates|users|organizations|system/
│   │   ├── api/
│   │   │   ├── health/route.ts
│   │   │   ├── pdf/[id]/route.ts
│   │   │   ├── jobs/render-pdf/route.ts
│   │   │   ├── webhooks/supabase/route.ts
│   │   │   └── v1/              # публичный API (B2B, позже)
│   │   ├── layout.tsx, error.tsx, not-found.tsx, globals.css
│   │   └── middleware.ts        # (в корне src/) сессия, роли, rate limit анонимов
│   ├── components/              # Переиспользуемый UI без бизнес-логики
│   │   ├── ui/                  # shadcn: button, dialog, table, …
│   │   ├── layout/              # AppShell, Sidebar, TopBar
│   │   ├── math/                # KaTeX-рендер, AnswerInput (числовая клавиатура)
│   │   ├── charts/              # обёртки над recharts
│   │   └── figures/             # <FigureSvg/>, <Figure3D/> (lazy)
│   ├── features/                # Бизнес-модули. Каждый: index.ts (public API), actions.ts, queries.ts,
│   │   │                        # service.ts, repository.ts, schemas.ts, components/, __tests__/
│   │   ├── auth/
│   │   ├── profiles/
│   │   ├── groups/
│   │   ├── content/             # прототипы, шаблоны (админ-CRUD, публикация)
│   │   ├── practice/            # тренировка ученика: выдача заданий, submitAnswer, revealSolution
│   │   ├── assignments/
│   │   ├── worksheets/
│   │   ├── statistics/
│   │   ├── organizations/
│   │   └── admin/
│   ├── tasks/                   # TASK ENGINE — чистый TS, без React/Supabase
│   │   ├── core/                # types.ts, generate.ts, check-answer.ts, prng.ts, constraints.ts, template-string.ts
│   │   ├── registry.ts          # code → TaskTemplateDefinition
│   │   ├── templates/           # 'server-only'. ege/math/03-stereometry/cylinder-volume.v1.ts …
│   │   ├── classifiers/         # распознавание типовых ошибок по дистракторам
│   │   └── __tests__/
│   ├── geometry/                # GEOMETRY ENGINE — чистый TS
│   │   ├── primitives/
│   │   ├── solids/
│   │   ├── projection/
│   │   ├── layout/
│   │   ├── render/              # to-svg.ts, to-three.ts
│   │   ├── spec/                # FigureSpec схема (Zod) и интерпретатор
│   │   └── __tests__/           # snapshot SVG + инварианты
│   ├── pdf/                     # PDF ENGINE
│   │   ├── renderer.ts          # интерфейс PdfRenderer
│   │   ├── react-pdf/           # реализация 1: документы Variant, Answers, Solutions, AnswerSheet
│   │   ├── math/                # MathJax → SVG
│   │   ├── fonts/
│   │   └── __tests__/
│   ├── analytics/               # продуктовая аналитика: events.ts (словарь), track.ts (PostHog), server.ts
│   ├── lib/                     # Инфраструктурные утилиты (без бизнес-логики)
│   │   ├── supabase/            # client.ts (browser), server.ts (RSC/actions), admin.ts (service role, server-only)
│   │   ├── db/                  # drizzle client, транзакции
│   │   ├── auth/                # guards.ts, session.ts, roles.ts
│   │   ├── rate-limit.ts
│   │   ├── storage/             # StorageProvider: supabase.ts, (r2.ts позже)
│   │   ├── queue/               # QStash publish/verify
│   │   ├── logger.ts
│   │   ├── errors.ts            # AppError, Result<T,E>
│   │   ├── env.ts               # Zod-валидация переменных окружения при старте
│   │   └── utils/
│   ├── i18n/                    # next-intl: messages/ru.json
│   ├── styles/
│   └── types/                   # глобальные типы, декларации модулей
├── tests/
│   ├── e2e/                     # Playwright: auth.spec.ts, student-practice.spec.ts, security-idor.spec.ts
│   ├── fixtures/
│   └── setup/
├── scripts/                     # CLI: import-content.ts, gen-types.sh, check-bundle-secrets.sh, backup.sh
├── public/                      # статика: favicon, fonts (KaTeX), og-image
├── .env.example
├── next.config.ts
├── drizzle.config.ts
├── tailwind.config.ts
├── tsconfig.json                # paths: @/* → src/*, @db/* → database/*
├── eslint.config.mjs            # + правила границ модулей и server-only
├── vitest.config.ts
├── playwright.config.ts
├── commitlint.config.ts
└── package.json
```

---

## 2. Зачем каждый раздел

| Раздел | Назначение | Правила |
|---|---|---|
| **`.claude/`** | Конфигурация Claude Code: разрешённые команды, hooks, слэш-команды, суб-агенты. | Версионируется; личные настройки — `.claude/settings.local.json` в `.gitignore`. |
| **`CLAUDE.md`** | Единый файл правил проекта, который Claude читает при старте. Краткий (<200 строк), ссылается на `docs/`. | Меняется через PR как код. |
| **`docs/`** | Архитектура, ADR, runbooks, продуктовые спеки. Источник контекста для людей и Claude. | Любое архитектурное решение — ADR до кода. |
| **`content/`** | Банк прототипов/метаданных шаблонов в JSON. Git — источник истины; БД — рабочая копия. | Импорт `pnpm content:import`; экспорт из админки обратно в git при публикации. |
| **`supabase/`** | Миграции, сиды, локальная конфигурация, pgTAP-тесты RLS, Edge Functions. | Никаких изменений схемы мимо миграций. |
| **`database/`** | Drizzle-схема в TS (типобезопасные запросы), сгенерированные типы, сид-скрипты. | Drizzle-схема и SQL-миграции должны совпадать — проверяется `drizzle-kit check` в CI. |
| **`src/app/`** | Только маршруты, layout'ы, композиция страниц из `features`. | Нет бизнес-логики; страница > 150 строк — сигнал вынести в feature. |
| **`src/components/`** | Глупые UI-компоненты. | Не импортируют `features`, `lib/supabase`, `tasks/templates`. |
| **`src/features/`** | Бизнес-логика по доменам. Стандартный набор файлов в каждом. | Импорт чужой feature только через её `index.ts`. Циклы запрещены (`eslint-plugin-boundaries`). |
| **`src/tasks/`** | Task Engine: генерация, проверка, классификация ошибок. | Чистые функции; 100 % покрытие `core/`; `templates/` — server-only. |
| **`src/geometry/`** | Geometry Engine: сцены, проекции, SVG/3D. | Детерминированность; snapshot-тесты. |
| **`src/pdf/`** | Рендер PDF за интерфейсом `PdfRenderer`. | Node runtime только; тяжёлые зависимости не попадают в клиентский бандл. |
| **`src/analytics/`** | Словарь событий и отправка. | Одно место, где известны имена событий; без ПДн. |
| **`src/lib/`** | Инфраструктурные обёртки: Supabase-клиенты, guards, rate-limit, storage, queue, logger. | `admin.ts` — единственная точка service role. |
| **`src/i18n/`** | Переводы. | Все пользовательские строки — через `t()`. |
| **`tests/`** | E2E и фикстуры. Unit-тесты живут рядом с кодом в `__tests__/`. | `security-idor.spec.ts` обязателен и не отключается. |
| **`scripts/`** | Одноразовые/служебные CLI. | Запускаются через `pnpm tsx`. |

---

## 3. Соглашения об именовании

- Файлы: `kebab-case.ts`; React-компоненты: `PascalCase.tsx`.
- Server Actions: глаголы — `submitAnswer`, `createWorksheet`; файлы `actions.ts` с `'use server'` в первой строке.
- Шаблоны заданий: `<topic>.<prototype>.<variant>.v<N>.ts`, `code` внутри совпадает с именем файла.
- Миграции: `NNNN_snake_description.sql`, только вперёд; откат — новой миграцией.
- Zod-схемы: `XxxInput`, `XxxOutput`; типы — `z.infer`.
- Тесты: `*.test.ts` (unit, Vitest), `*.spec.ts` (e2e, Playwright).

---

## 4. Границы модулей (ESLint)

```
components  →  (ничего из features/lib/supabase/tasks/templates)
features/A  →  features/B только через features/B/index.ts
app         →  features/*/index.ts, components
tasks/core  →  ничего внешнего
tasks/templates → tasks/core, geometry/spec   (server-only)
geometry    →  ничего внешнего
pdf         →  geometry/render, tasks/core (типы)
lib         →  ничего из features
```

Нарушение — ошибка сборки. Это главный механизм, который позволяет Claude Code менять один модуль, не ломая остальные.

---

## 5. Скрипты `package.json` (ключевые)

```
dev              next dev
db:start         supabase start
db:reset         supabase db reset          # применить миграции + seed локально
db:migrate:new   supabase migration new <name>
db:push          supabase db push           # только CI/CD
db:types         supabase gen types typescript --local > database/types.ts
db:test          supabase test db           # pgTAP
content:import   tsx scripts/import-content.ts
lint / typecheck / test / test:e2e / test:security
check            pnpm lint && pnpm typecheck && pnpm test && pnpm db:test
check:bundle     bash scripts/check-bundle-secrets.sh   # ищет маркеры templates/admin в .next/static
```
