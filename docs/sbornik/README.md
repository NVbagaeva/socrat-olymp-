# Интерактивный сборник для поступающих в вузы — как устроен

Раздел сайта `/sbornik/`. Карта тем и принятые решения — `karta.md`.

## Банк задач

| Что | Где |
| --- | --- |
| Генераторы типов (Python + sympy) | `tools/sbornik/glava1/tNN.py`, ядро — `tools/sbornik/core.py` |
| Реестр типов и число задач | `tools/sbornik/build.py` (`GLAVY`) |
| Банк (JSON) | `app/src/data/sbornik/glava-N/tip-N.M.json` |
| Самопроверка банка | `tools/sbornik/check.py` |
| Формулы и движок сайта на банке | `app/scripts/check-sbornik.mjs` (`pnpm test:sbornik`) |

Пересобрать банк (детерминированно — то же зерно даёт те же задачи):

```bash
python3 -m tools.sbornik.build          # все типы
python3 -m tools.sbornik.build 1.2 1.10 # выбранные
python3 -m tools.sbornik.check
cd app && pnpm test:sbornik
```

Каждая задача собирается генератором подтипа и сразу проверяется: ответ
посчитан sympy и сверен с выражением условия подстановкой в 6–8 точках
внутри области определения (с учётом условий на буквы). Задача, не
прошедшая проверку, в банк не попадает. `check.py` повторяет сверку по
готовым файлам — без генераторов — и ищет дубли и «плохие» числа. Оба
теста стоят в CI (`.github/workflows/check.yml`).

Поля задачи: `id` («1.2.017»), `tip`, `podtip`, `uroven` (1–3 = ★–★★★),
`uslovie` (текст, формулы в `$…$`), `formula` (выражение условия
отдельной строкой), `dopolnenie`, `otvet`, `razbor` (шаги
`{chto, tex}`), `podskazki` (вопросы к следующему шагу), `proverka`
(исходное выражение sympy — для `check.py`).

Виды ответа (`otvet.vid`) и как их проверяет сайт
(`app/src/lib/sbornik/proverka.ts`):

- `chislo` — по значению; `tochno` — десятичное приближение вместо
  корня не засчитывается;
- `vyrazhenie` — по значениям в точках из банка (значения посчитаны
  sympy); `forma` — «без корня в знаменателе», «произведением»;
- `kusochnyi` — ответ по случаям: ученик сам задаёт промежутки
  (`(-\infty;3)`, `[1;5]`, `x<3`, объединения через `\cup`); объединение
  промежутков должно совпасть с областью определения (выколотые внутри
  точки не различаются), на каждом куске — выражение;
- `chisla` — несколько чисел с подписями.

## Страницы

| Адрес | Что |
| --- | --- |
| `/sbornik/` | витрина: главы, прогресс, поиск по номеру и теме |
| `/sbornik/glava-1/` | «Задачи по типам» — карточки типов |
| `/sbornik/glava-1/tip-1-2/` | задачи типа: фильтр по уровню и исходу, «Решать» |
| `/sbornik/glava-1/teoriya/` | теория главы (`components/sbornik/teoriya/glava1.tsx`) |
| `/sbornik/glava-1/trenazher/` | тренажёр; `?tip=1.2`, `?rezhim=oshibki` |
| `/sbornik/glava-1/generator/` | генератор листов |
| `/sbornik/glava-1/pechat/?t=…` | лист для печати (`vid=uchitel` — с решениями) |
| `/sbornik/glava-1/dannye/tip-1-2.json` | задачи типа для тренажёра и листов |

Адреса собираются из `SBORNIK`, `SBORNIK_TAIL`, `glavaSlug`, `tipSlug`
(`app/src/lib/paths.ts`). Главы и типы — `app/src/content/sbornik.ts`;
новая глава открывается флагом `gotova`.

Прогресс — журнал попыток `budetege:sbornik:log:v1`
(`app/src/lib/sbornik/progress.ts`), переносится в аккаунт
(`lib/progressImport/registry.ts`).

## Правила содержания

Структура тем — по классическому сборнику задач для поступающих; сам
источник на сайте не упоминается, его файлы в репозиторий не кладутся,
имя редактора — в маркерах `app/scripts/check-repo-files.mjs`. Условия,
числа, решения и теория — свои.
