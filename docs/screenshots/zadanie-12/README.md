# Скриншоты №12 для макета «Весь №12 / Итоговая работа»

Код сайта не менялся. Снято Playwright (Chromium), светлая тема,
`prefers-reduced-motion: reduce`, анимации и переходы выключены; перед
кадром — загрузка шрифтов, KaTeX и картинок. Телефон — 390×844,
deviceScaleFactor 3; десктоп — 1440×900, deviceScaleFactor 2.

Суффикс файла — источник: `-prod` — https://budetege.ru, `-branch-…` —
локальная сборка ветки, где экран уже есть. Полные страницы длиннее
16 000 px разрезаны на равные части `full-p1`, `full-p2`, ….

Личные данные: имя в шапке («… · Преподаватель») и инициалы в кружке
заменены перед съёмкой на «Имя Отчество» / «ИО». Баннеров cookie и
всплывающих окон на сайте нет.

Все файлы одним архивом: `zadanie-12-screens.zip`.

## Экраны

| № | Экран | Файлы | Откуда | Замечания |
|---|---|---|---|---|
| 01 | Страница «Задание №12. Графики функций» (выбор разделов) | `01-hub-desktop-full-branch-ikonki-razdelov-12.png`<br>`01-hub-desktop-full-prod.png`<br>`01-hub-desktop-top-branch-ikonki-razdelov-12.png`<br>`01-hub-desktop-top-prod.png`<br>`01-hub-mobile-full-branch-ikonki-razdelov-12.png`<br>`01-hub-mobile-full-prod.png`<br>`01-hub-mobile-top-branch-ikonki-razdelov-12.png`<br>`01-hub-mobile-top-prod.png` | prod (budetege.ru)<br>ветка claude/ikonki-razdelov-12 (#136+#137+#138) + свежий main, локальная сборка | prod: иконки разделов старые (линии); ветка: стеклянные иконки и названия «… функция / График — …». |
| 02 | Раздел «Парабола», вкладка «О задании» | `02-parabola-about-desktop-full-branch-ikonki-razdelov-12.png`<br>`02-parabola-about-desktop-full-prod.png`<br>`02-parabola-about-desktop-sticky-branch-ikonki-razdelov-12.png`<br>`02-parabola-about-desktop-sticky-prod.png`<br>`02-parabola-about-desktop-top-branch-ikonki-razdelov-12.png`<br>`02-parabola-about-desktop-top-prod.png`<br>`02-parabola-about-mobile-full-p1-branch-ikonki-razdelov-12.png`<br>`02-parabola-about-mobile-full-p1-prod.png`<br>`02-parabola-about-mobile-full-p2-branch-ikonki-razdelov-12.png`<br>`02-parabola-about-mobile-full-p2-prod.png`<br>`02-parabola-about-mobile-sticky-branch-ikonki-razdelov-12.png`<br>`02-parabola-about-mobile-sticky-prod.png`<br>`02-parabola-about-mobile-top-branch-ikonki-razdelov-12.png`<br>`02-parabola-about-mobile-top-prod.png` | prod (budetege.ru)<br>ветка claude/ikonki-razdelov-12 (#136+#137+#138) + свежий main, локальная сборка | ещё есть кадр «sticky» — прокрутка вниз, вкладки прилипли. В ветке: «Все разделы №12» и плашка раздела над вкладками. |
| 03 | Раздел «Парабола», внизу — блок «Другие разделы №12» | `03-parabola-other-sections-desktop-top-branch-ikonki-razdelov-12.png`<br>`03-parabola-other-sections-mobile-top-branch-ikonki-razdelov-12.png` | ветка claude/ikonki-razdelov-12 (#136+#137+#138) + свежий main, локальная сборка | только в ветке; полная страница — в кадрах 02 (full) ветки. |
| 04 | Меню «Все разделы задания №12» (bottom sheet) | `04-all-sections-menu-mobile-top-branch-ikonki-razdelov-12.png`<br>`04-all-sections-menu-mobile-top-scrolled-branch-ikonki-razdelov-12.png` | ветка claude/ikonki-razdelov-12 (#136+#137+#138) + свежий main, локальная сборка | только в ветке; второй кадр — список прокручен вниз (разделы «Скоро»). |
| 05 | Окно «Выберите тип функции» (Банк заданий → «Задание 12») | `05-function-type-dialog-mobile-top-branch-ikonki-razdelov-12.png`<br>`05-function-type-dialog-mobile-top-prod.png`<br>`05-function-type-dialog-mobile-top-scrolled-branch-ikonki-razdelov-12.png`<br>`05-function-type-dialog-mobile-top-scrolled-prod.png` | prod (budetege.ru)<br>ветка claude/ikonki-razdelov-12 (#136+#137+#138) + свежий main, локальная сборка | на prod иконки-линии, в ветке — стеклянные. Второй кадр — список прокручен до «Готовится». |
| 06 | Тренажёр в процессе: задача с графиком | `06-trainer-task-desktop-full-branch-trainer-session-persistence.png`<br>`06-trainer-task-desktop-full-prod.png`<br>`06-trainer-task-desktop-top-branch-trainer-session-persistence.png`<br>`06-trainer-task-desktop-top-prod.png`<br>`06-trainer-task-mobile-full-branch-trainer-session-persistence.png`<br>`06-trainer-task-mobile-full-prod.png`<br>`06-trainer-task-mobile-top-branch-trainer-session-persistence.png`<br>`06-trainer-task-mobile-top-prod.png` | prod (budetege.ru)<br>ветка claude/trainer-session-persistence-5esd5t (#131), локальная сборка | на prod нет таймера, «Пауза» и «Завершить» — только «Задание 1 из N» и номера; панель — в ветке #131. |
| 07 | Тренажёр: итоги после завершения (3 решены, 2 пропущены) | `07-trainer-results-mobile-full-branch-trainer-session-persistence.png`<br>`07-trainer-results-mobile-top-branch-trainer-session-persistence.png` | ветка claude/trainer-session-persistence-5esd5t (#131), локальная сборка | на prod экрана итогов с «Завершить» нет — снят с ветки #131. |
| 08 | Генератор: экран настроек | `08-generator-desktop-full-branch-ikonki-razdelov-12.png`<br>`08-generator-desktop-full-prod.png`<br>`08-generator-desktop-top-branch-ikonki-razdelov-12.png`<br>`08-generator-desktop-top-prod.png`<br>`08-generator-mobile-full-branch-ikonki-razdelov-12.png`<br>`08-generator-mobile-full-prod.png`<br>`08-generator-mobile-top-branch-ikonki-razdelov-12.png`<br>`08-generator-mobile-top-prod.png` | prod (budetege.ru)<br>ветка claude/ikonki-razdelov-12 (#136+#137+#138) + свежий main, локальная сборка | «первый экран» — начало вкладки «Генератор» (Собери свой вариант). |
| 09 | Картинка «стеклянные статуэтки функций» | `09-hero-figurines-desktop-crop-branch-ikonki-razdelov-12.png`<br>`09-hero-figurines-desktop-crop-prod.png`<br>`09-hero-figurines-mobile-crop-branch-ikonki-razdelov-12.png`<br>`09-hero-figurines-mobile-crop-prod.png` | prod (budetege.ru)<br>ветка claude/ikonki-razdelov-12 (#136+#137+#138) + свежий main, локальная сборка | кадр-вырезка вокруг картинки; полная страница с ней — 01. |
| 10 | Вкладка «Теория» (иррациональная функция) с рамками | `10-theory-irrational-mobile-full-p1-prod.png`<br>`10-theory-irrational-mobile-full-p2-prod.png`<br>`10-theory-irrational-mobile-full-p3-prod.png`<br>`10-theory-irrational-mobile-top-prod.png` | prod (budetege.ru) | «первый экран» — начало вкладки «Теория». |

## Исходные картинки (`assets/`)

| Файл | Что | Размер |
|---|---|---|
| `assets/ikonki-razdelov/exponential.webp` | стеклянная иконка раздела «exponential» (razdel.icon в data/functionTypes.ts, исходник app/assets/razdely/12/, ветка #138) | 1024×923, 736 КБ |
| `assets/ikonki-razdelov/irrational.webp` | стеклянная иконка раздела «irrational» (razdel.icon в data/functionTypes.ts, исходник app/assets/razdely/12/, ветка #138) | 1024×923, 748 КБ |
| `assets/ikonki-razdelov/linear.webp` | стеклянная иконка раздела «linear» (razdel.icon в data/functionTypes.ts, исходник app/assets/razdely/12/, ветка #138) | 1024×923, 723 КБ |
| `assets/ikonki-razdelov/logarithmic.webp` | стеклянная иконка раздела «logarithmic» (razdel.icon в data/functionTypes.ts, исходник app/assets/razdely/12/, ветка #138) | 1024×923, 729 КБ |
| `assets/ikonki-razdelov/quadratic.webp` | стеклянная иконка раздела «quadratic» (razdel.icon в data/functionTypes.ts, исходник app/assets/razdely/12/, ветка #138) | 1024×923, 743 КБ |
| `assets/ikonki-razdelov/rational.webp` | стеклянная иконка раздела «rational» (razdel.icon в data/functionTypes.ts, исходник app/assets/razdely/12/, ветка #138) | 1024×923, 737 КБ |
| `assets/ikonki-razdelov/trig.webp` | стеклянная иконка раздела «trig» (razdel.icon в data/functionTypes.ts, исходник app/assets/razdely/12/, ветка #138) | 1024×923, 777 КБ |
| `assets/statuetki-funkcij-hero.png` | «статуэтки функций» — исходник app/assets/zadaniya/12/hero.png (в main с #140) | 1536×1024, 1867 КБ |

Иконки выгружены как есть (WebP с прозрачностью — так они лежат в
репозитории, PNG-исходников нет). Других стеклянных иллюстраций №12 в
репозитории нет: на страницах раздела есть ещё бюст Галилея, лампочка и
«горы-сеть», но это общие картинки сайта, не стеклянные.

## Каких экранов нет нигде

- На production нет экрана итогов тренажёра с «Завершить», таймером и
  «Пауза» — это открытый PR #131 (снято с его ветки).
- На production нет навигации разделов (плашка, меню «Все разделы»,
  «Другие разделы №12») и стеклянных иконок — открытые PR #136–#138
  (снято с ветки #138, в которую локально влит свежий main).
- Всё из списка 01–10 нашлось хотя бы в одном источнике.

## Что заметно на кадрах

- `10-theory-irrational-mobile-top-prod`: в рамке «Определение» на
  телефоне формула переносится посреди «y² = x» (после «=»).
- `06-…-branch-trainer-session-persistence`, телефон: нижняя панель
  навигации поднята над краем экрана (видна полоса под ней).
