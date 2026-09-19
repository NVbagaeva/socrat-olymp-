# Задание №08 «Вычисления и преобразования». Этап 0 — разведка

Отчёт по итогам изучения репозитория перед началом работ. Код не менялся.
Ветка: `claude/task-08-vychisleniya-we5h7i`.

## 1. Главные выводы

1. **Сайт — статический экспорт.** `app/next.config.ts` задаёт `output: 'export'`, деплой — FTP-выгрузка папки `app/out/` (`.github/workflows/deploy.yml`). В репозитории нет ни одного `'use server'`. **Server Action в этой архитектуре выполняться негде.** «Проверка через `secret.ts`» в №3 и №4/№5 — это не серверный вызов, а сравнение **отпечатков** в браузере: на сборке ответ превращается в 16-значный хеш (`sealAnswer`), разбор шифруется потоком от того же хеша (`sealText`), а в браузере введённое нормализуется (`canonical`) и хешируется тем же кодом (`answerMatches`). Число ответа в разметку и в бандл не попадает; разбор раскрывается только по нажатию «Посмотреть решение». Это ровно тот уровень защиты, который есть у №3, и это максимум, достижимый без серверного рантайма. Для №8 предлагаю ту же схему со своей солью `z8:v1:`.
2. **Технический долг №12 локализован.** Тренажёр №12 генерирует задачи в браузере после «Начать тренировку» — ответы в HTML нет, но они лежат открытой строкой в состоянии React (`TrainerTask.answer`) и проверяются `sameNumber`. Подготовительные задачи №12 — настоящий долг: `PrepTasks.tsx` вызывает `buildPrepTasks()` на сборке и отдаёт клиентскому экрану массив с полями `answer`, `options[].error`, `steps[]` — всё это лежит в исходнике страницы `/zadaniya/12/linear/podgotovka/k/`. Для №8 ни один из этих путей не повторяется.
3. **Карточка «08 Вычисления и преобразования» уже есть** в `app/src/content/tasks.ts:78-84` со статусом `soon`, миниатюра `app/public/images/task-08.webp` на месте. Открытие раздела — одна строка `status: 'active'` в самом конце работ (так открывали №4: коммит `c612d1e`). Ссылку `/zadaniya/8` и пункт сайдбара `TaskGrid`/`AppShell` соберут сами.
4. **Нумерация 07/08.** Исходный PDF подписан «Задание №07» — это структура ЕГЭ-2025. В проекте принята структура 2027: №07 — «Уравнения», №08 — «Вычисления и преобразования». Содержимое PDF относится к карточке №08. На сайте, в коде и в PDF-выгрузках номер только 08.
5. **`design-system.md` в репозитории нет.** Правила дизайн-системы живут в `app/README.md` (раздел «Правила дизайн-системы»), в шапке `app/src/styles/tokens.css` и на витрине `/styleguide`. Суть: только семантические токены `--color-*`, кегли только классами `t-*`, шаг сетки 4px, брейкпоинты 768/1024/1280. Tailwind-утилиты цветов и кеглей намеренно обнулены в `@theme`, поэтому «мимо» токенов написать нельзя.
6. **Тестового раннера нет.** Все автотесты — самописные `node scripts/*.mjs`, которые транспилируют нужные `.ts` через `scripts/lib/load-ts.mjs` и прогоняют проверки (например, `check-z3-round.mjs` гоняет 1000 seed). Vitest/Jest в зависимостях нет; вводить их — новая библиотека, требует согласования. Тесты генераторов №8 (1000 seed на навык) предлагаю в том же стиле: `app/scripts/check-vychisleniya.mjs` + `pnpm test:vychisleniya` + шаг в `.github/workflows/check.yml`.
7. **Исходный PDF прочитан** (7 страниц, рендер в картинки). Текстовый слой у формул битый, но по картинкам все 30 заданий двух блоков видны и соответствуют каркасу таксономии из постановки. Отмечу: папка лежит по вложенному пути `content-source/content-source/vychisleniya/`, а соседние разделы — прямо в `content-source/`; рядом пустой файл `1`. Ничего там не трогаю.

## 2. Как устроен №12 (эталон)

### 2.1 Маршруты и реестр

- `/zadaniya/[task]` и `/zadaniya/[task]/[type]/*` — это не «любое задание», а «раздел из `content/sections.ts` × тип функции из `data/functionTypes.ts`». В `sections` сейчас ровно один раздел — №12. №3, №4, №5 живут отдельными статическими папками `app/src/app/zadaniya/3/`, `4/`, `5/` и в `[task]` не заходят.
- `sections.ts` напрямую импортирует наборы движка графиков (`@/lib/graph/data/index.js`) для подсчёта банка (`bankSets`, `bankTotal`), а `Subtopic = FunctionType` несёт поля `formula`, `theory`, `taskTypes`, `materials`. Чтобы протащить №8 через `[task]/[type]`, эту связку пришлось бы обобщать.
- Вкладки подтемы: `about / theory / prep / trainer / generator` + кнопка «Для репетиторов». `prep` и `trainer` — переходы по адресу (`/podgotovka/`, `/trenazher/`), остальные — состояние. `dlya-repetitorov/` — та же страница с раскрытым меню материалов, `pechat/` и `pechat/otvety/` — печатные листы (у ученического листа ссылки на лист ответов нет).
- CSS вкладок (`topic.css`, `prep.css`, `trainer.css`, `configurator.css`, `section.css`) импортируется вручную в каждом `page.tsx`; `pnpm test:imports` проверяет, что пути существуют.

### 2.2 Тренажёр

- Конфигуратор `TrainerBuilder`: навык (`SkillCards`) → режим (`practice / mixed / mistakes / control`) → количество (`5 / 10 / 20 / Все`) → уровень (`lucky / unlucky`, показываются только те, что есть у набора) → «Начать тренировку».
- «Начать тренировку» вызывает `buildSession()` из `lib/trainerSession.ts` в браузере: seed `randomSeed()` — новый на каждый запуск; движок собирает набор целиком и перебирает до 24 seed, пока не наберёт N задач нужного уровня.
- «Повтор ошибок»: `TrainerBuilder` только **читает** `budetege:trainer:v1` через `useTrainerProgress()` (режим заблокирован, пока `mistakes` пуст); запись делает экран задания `TrainerScreen` через `recordAttempt()`. В хранилище — только счётчики по наборам и идентификаторы задач вида `12.A-03`; ответов там нет. Для повтора берутся те же идентификаторы задач на новых seed. Ключи других разделов свои (`budetege:z3:trainer:v1`, `budetege:veroyatnost-4:v1`), фабрика — `lib/progressStore.ts`.
- Экран `TrainerScreen` принимает готовый `TrainerTask[]` (`questionHtml`, `chartSvg | null`, `answer`, `wrongHint`, `rightHint`, `steps[]`) и проверяет `sameNumber(value, task.answer)`.

### 2.3 Генератор печати и `lib/sheet/`

- `GeneratorScreen`: вид работы + дата → навыки (мультивыбор) → количество / сложность / колонки (`single | double`) / тема (`color | print`). Внизу две ссылки: `pechat/?…` (лист ученика) и `pechat/otvety/?…` (лист ответов). Параметры живут в адресе (`s, n, l, seed, t, c, k, d`), поэтому один адрес всегда даёт один лист; лист ответов считается в браузере при открытии своего адреса.
- `lib/sheet/` предметно-нейтрален: `sheet.js` (`buildDocument(spec) → HTML`), `paginate.js` (разбиение на A4 в браузере), `theme.css` (две темы токенами: ч/б — отдельный набор значений, не серая копия), `sheet.css`, `marks.js`, `typography.js`, `answers.js`, `outputs.js`. Единственные предметные части — `answers12.js` (раздел «Ответы» №12) и `probability-sheet.css` (№4).
- `outputs.js` держит жёсткое правило: файл с ответами не лежит в `app/public` (репозиторий публичный), только в `app/pdf-private/` (вне git), забирается артефактом CI; `assertSafe()` валит сборку при нарушении.

### 2.4 Банк вариантов

- **№12:** в `lib/graph/data/prototypes/12/12-{A..D}.json` лежат не варианты, а **ограничения** на 20 задач-шаблонов; числа подбирает `generate.js` по seed. Эталон ответов `data/answers.json` намеренно не импортируется в клиент.
- **№3:** ровно 10 вариантов на прототип **явными литералами** (`varianty: [variant(1, …, { a: 9, b: 12 }), …]`), `selftest.ts` валит сборку, если их не 10, если ответ не «красивый» или если формула и независимая модель разошлись.
- **№4/№5:** к вариантам из источников добавляется `SKOLKO = 10` сгенерированных детерминированным генератором с seed от id прототипа (`zerno(id)`).
- **Для №8** беру гибрид под формулировку задания: `bank.ts` со списком из 10 seed на прототип; генератор детерминирован, поэтому 10 вариантов воспроизводимы и проверяются самотестом (разные условия, ответ целый или конечная десятичная дробь), а тренажёр и генератор печати сверх банка берут свежие seed тем же кодом.

### 2.5 Формулы

KaTeX импортируется один раз в `lib/graph/katex.js`; на сборке — `katex.renderToString`, в тексте условий — `lib/tex.ts` (`typeset()` заменяет `$…$`), в браузере по готовому DOM — `katex-upgrade.js`. Запятая в десятичных внутри формулы набирается как `{,}` (уже так делает `lib/prep.ts:288`). Ни одна из этих частей к графикам не привязана.

## 3. Что переиспользуется, что параметризуется, что пишется заново

### Как есть (нулевая правка)

| Файл | Роль |
|---|---|
| `components/tasks/TopicTabs.tsx`, `TopicContents.tsx`, `TabScroll.tsx` | лента вкладок; вся начинка приходит `ReactNode`; при `theory=[]` сама показывает `EmptyState` «Материал готовится» |
| `components/tasks/TutorMenu.tsx` | меню «Для репетиторов», уже переиспользован №4 |
| `components/tasks/configurator/*` (`StepHead`, `Option`, `OptionGroup`, `SkillCards`, `Note`) | шаги конфигуратора |
| `components/tasks/trainer/TrainerResult.tsx` | итог подхода |
| `components/tasks/prep/PrepShell`, `PrepChips`, `PrepCounter`, `PrepSolution`, … | оболочка подготовительных задач |
| `components/ui/*` (`EmptyState`, `Input`, `Button`, `Badge`, `Breadcrumbs`, `Modal`, …) | UI-кит |
| `lib/answer.ts` (`parseAnswer`) | нормализация «0,5» / «0.5» / «−3» / «3/2» |
| `lib/trainerRound.ts`, `lib/prepOrder.ts`, `lib/progressStore.ts`, `lib/storage.ts`, `lib/plural.ts`, `lib/dismiss.ts` | подход, порядок, прогресс |
| `lib/sheet/*` кроме `answers12.js`, `probability-sheet.css` | печатный шаблон |
| `lib/graph/katex.js`, `katex-upgrade.js`, `lib/tex.ts` | KaTeX |
| `scripts/lib/load-ts.mjs`, `sheet-build.mjs`, `sheet-render.mjs`, `sheet-check.mjs` | тесты и сборка PDF |
| CSS `topic.css`, `prep.css`, `trainer.css`, `configurator.css`, `section.css` | классы `cfg-*`, `ttask__*`, `ptask__*` предметно-нейтральны |

### Параметризуется (правка общих файлов с сохранением поведения №12)

| Файл | Что привязано к №12 | Как развязать |
|---|---|---|
| `trainer/TrainerBuilder.tsx` | импортирует `content/skills12` (уровни, счётчики) и `content/trainerModes`; сессию собирает `lib/trainerSession` (движок графиков); прогресс — глобальный `useTrainerProgress` | пропсы `levels`, `buildSession`, `store` с дефолтами, равными нынешним |
| `trainer/TrainerScreen.tsx` | `sameNumber(value, task.answer)` — ответ в состоянии открытой строкой; `recordAttempt` в глобальный ключ | вместо `answer` — `seal`, проверка `answerMatches`; `store` пропсом |
| `trainer/TrainerStats.tsx` | `trainerKindTitle` из `trainerModes`, глобальный ключ | словарь названий и `store` пропсами |
| `configurator/skillItems.tsx` | миниатюра навыка — `<Chart scene=…>` | миниатюра пропсом/фабрикой (для №8 — формула KaTeX) |
| `generator/GeneratorScreen.tsx` | `skillTitle` из `skills12`, ссылки на `pechat/` внутри `base` | словарь и `base` пропсами (ссылки уже относительные) |
| `prep/PrepTaskScreen.tsx` | `answer` в пропсах, `sameNumber` | `seal` + `answerMatches`, подсказка после ошибки из конфига |
| `scripts/check-bundle-secrets.mjs` | ищет следы банков `BANK` (№3) и `BANK_4` | добавить банк №8 и его поля |
| `package.json`, `.github/workflows/check.yml` | список тестов | `test:vychisleniya`, `build:pdf-8`, `test:pdf-8` |
| `content/tasks.ts` | `status: 'soon'` у №08 | одна строка в финале |

### Пишется заново (движка графиков нет, вместо него движок формул и генератор чисел)

- `lib/vychisleniya/` — типы, seeded-RNG, рациональная арифметика, сборка TeX (корни разных степеней, дробные показатели, логарифмы, тригонометрия, десятичные с запятой), прототипы 8.A…8.Z, банк из 10 seed, `secret.ts` со своей солью, `pool.ts` (сборка), `session.ts` (браузер), `selftest.ts`, `sheet8.ts`.
- `content/vychisleniya.ts` (тексты вкладок, навыки, уровни, материалы для репетиторов), `content/sheet8.js` (слова листа), `lib/sheet/answers8.js`.
- Маршруты `app/src/app/zadaniya/8/**`, страница-обёртка раздела (по образцу `FunctionTopicPage`, но без движка графиков), карточки навыков с формулой вместо чертежа.
- Скрипты `check-vychisleniya.mjs`, `build-pdf-8.mjs`, `check-pdf-8.mjs`.

Seeded-RNG в проекте два: `hash()/rng()` внутри `lib/graph/generate.js` (не экспортируется отдельно) и `seeded()` в `lib/zadanie3/podhod.ts` (LCG, его же берёт №4). Для №8 использую `seeded()` из `podhod.ts` плюс FNV-1a от строки seed — без дублирования кода.

## 4. Схема защиты ответов для №8

1. Генератор — чистая изоморфная функция `generate(prototype, seed, level) → { statementTex, answer, params, steps }`, живёт в `lib/vychisleniya/prototypes/*`.
2. **Банк (10 вариантов на прототип)** запечатывается на сборке в `pool.ts` по образцу №3: в клиент уходит `{ n, uslovieHtml, seal, steps: sealText(…) }`. `pool.ts` импортирует `node:fs`, как `veroyatnost/pool.ts`, — страховка от попадания в клиентский бандл.
3. **Свежие seed** (тренажёр, печать) считаются в браузере — иначе при статическом экспорте нельзя. Число ответа запечатывается сразу в момент генерации (`sealAnswer`) и в состояние/DOM не попадает; проверка — `answerMatches(input, seal)`; разбор — `openText` только по нажатию. Честная оговорка: код генератора лежит в бандле, и человек с отладчиком ответ вычислит; от подглядывания в разметку, Ctrl+F и исходник это защищает полностью, как и в №3.
4. `selftest.ts` проверяет, кроме прочего, отсутствие коллизий отпечатков между разными ответами (в №3 это заявлено в комментарии, но реализовано только в №4/№5 — копирую оттуда).
5. `pnpm test:secrets` после сборки ищет следы банка №8 в `app/out/`.

## 5. Предлагаемая структура папок

Соглашение репозитория — `app/src/lib/<домен>/` (`graph`, `zadanie3`, `veroyatnost`, `solid`), папки `src/tasks/` нет. Предлагаю:

```
app/src/lib/vychisleniya/
  README.md
  types.ts            Prototype, Variant, GeneratedTask, Level, AnswerFormat
  rng.ts              seed-строка → детерминированный ГСЧ (FNV-1a + seeded() из zadanie3/podhod)
  numbers.ts          рациональные числа, «хорошесть» ответа (целое / конечная десятичная)
  tex.ts              сборка TeX: корни n-й степени, дробные показатели, log, sin/cos/tg, «{,}»
  format.ts           формат ответа, запись через запятую
  secret.ts           соль 'z8:v1:' (копия №3 без stripPi)
  skills.ts           навыки конфигуратора = группы прототипов, уровни
  prototypes/
    index.ts          реестр 8.A … 8.Z
    stepeni.ts        группа I  (8.A–8.G)
    logarifmy.ts      группа II (8.H–8.L)
    trig-chetvert.ts  группа III (8.M–8.P)
    trig-preobr.ts    группа IV (8.Q–8.V)
    bukvennye.ts      группа V  (8.W–8.Z)
  bank.ts             10 seed на прототип — зафиксированный банк
  prep/               подготовительные задачи (этап 2), данные конфигом
  pool.ts             сборка: банк → seal (только сервер, node:fs)
  session.ts          'use client': свежие seed → задачи с seal
  selftest.ts         проверки банка и генераторов
  sheet8.ts           печать: адрес → задачи → spec (аналог generatorSheet.ts)
app/src/content/vychisleniya.ts     тексты раздела, вкладки, tutors
app/src/content/sheet8.js           слова печатного листа
app/src/lib/sheet/answers8.js       раздел «Ответы» для №8
app/src/app/zadaniya/8/             маршруты по образцу №4:
  layout.tsx, page.tsx, teoriya/, podgotovka/, podgotovka/[skill]/,
  trenazher/, generator/, dlya-repetitorov/, pechat/, pechat/otvety/
app/src/components/tasks/vychisleniya/   только то, что не параметризуется:
  VychisleniyaTopicPage.tsx, Formula.tsx (KaTeX), SkillFormula.tsx
app/scripts/check-vychisleniya.mjs  1000 seed на навык + банк + коллизии отпечатков
app/scripts/build-pdf-8.mjs, check-pdf-8.mjs
app/public/materials/zadanie-8/     ученические PDF (учительские — app/pdf-private/)
docs/tasks/08-vychisleniya-*.md     документы этапов
```

## 6. Порядок коммитов (по образцу №4)

1. Каркас раздела: маршруты, вкладки, пустая теория, ни одной задачи (карточка остаётся `soon`).
2. Движок формул, прототипы, банк из 10 seed, самотест.
3. Тренажёр и подготовительные задачи.
4. Генератор печати, сборка PDF.
5. Открытие карточки: `status: 'active'` — один файл, одна строка.

Проверки перед каждым коммитом: `pnpm lint`, `pnpm typecheck`, `pnpm test:imports`, `pnpm build`, `pnpm test:secrets`; №3 и №12 открываются; скриншоты 360 / 768 / 1440 на этапах с UI.
