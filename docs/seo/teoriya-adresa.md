# Теория по главам: схема адресов (на согласование)

Это предложение, в коде ничего не сделано. После вашего «да» (и правок
по названиям адресов) теория разбивается в отдельном PR.

## Зачем

Теория крупных разделов — одна страница на 20–26 тысяч слов и 4–6 МБ
HTML. По запросу «аннуитетный платёж формула» поиск показывает такую
страницу хуже, чем отдельную страницу главы, а телефон её долго
грузит (Lighthouse: блокировка потока до 5,9 с на теории №13).

## Что меняется для ученика

- `/zadaniya/N/teoriya/` остаётся и становится **оглавлением**: номер и
  название главы, 1–2 строки, о чём она, ссылка «Читать». Внешний вид —
  те же карточки глав, что сейчас в содержании сбоку.
- Каждая глава — своя страница `/zadaniya/N/teoriya/<глава>/` с той же
  шапкой раздела и лентой вкладок, с содержанием главы сбоку и кнопками
  «← предыдущая глава / следующая глава →» внизу.
- Карточки «Повторить теорию», ссылки из разборов и опорных задач ведут
  сразу в нужную главу (адрес главы + якорь абзаца).

## Старые адреса

- `/zadaniya/N/teoriya/` — не переезжает (оглавление), 301 не нужен.
- Старые ссылки с якорем `…/teoriya/#teoriya-dif` и якорями абзацев
  (`#dif-formula`) — якорь сервер не видит, поэтому 301 по нему сделать
  нельзя. Оглавление само уводит такую ссылку в главу: небольшой скрипт
  берёт якорь, находит главу по таблице «якорь → глава» (её строит
  сборка) и открывает `/zadaniya/N/teoriya/<глава>/#<якорь>`. Без
  JavaScript ученик увидит оглавление и выберет главу сам.
- Ссылки внутри сайта переписываются на сборке — проверка битых ссылок
  (`pnpm test:broken-links`) не даст оставить старую.

## Какие разделы

Разбиваются разделы, где теория тяжелее 3 МБ: №1, 3, 6, 7, 10, 11, 13,
19. Теория №2, 9 и подразделов №12 (до 2 МБ) остаётся одной страницей.

## Адреса глав

Слева — нынешний якорь главы, справа — предлагаемый адрес. Слова — тем
же транслитом, что остальные адреса сайта (`opornye-zadachi`).
Короткие якоря («dif», «m01») я расписал словами: адрес главы попадает в
выдачу и в ссылки — пусть читается.

### №1. Планиметрия — `/zadaniya/1/teoriya/…`

| Глава | Якорь сейчас | Адрес |
|---|---|---|
| 1. Углы и прямые | `teoriya-ugly-i-pryamye` | `ugly-i-pryamye/` |
| 2. Треугольник | `teoriya-treugolnik` | `treugolnik/` |
| 3. Элементы треугольника | `teoriya-elementy-treugolnika` | `elementy-treugolnika/` |
| 4. Прямоугольный треугольник | `teoriya-pryamougolnyy-treugolnik` | `pryamougolnyy-treugolnik/` |
| 5. Равенство и подобие | `teoriya-ravenstvo-i-podobie` | `ravenstvo-i-podobie/` |
| 6. Площади | `teoriya-ploshchadi` | `ploshchadi/` |
| 7. Теоремы синусов и косинусов | `teoriya-teoremy-sinusov-i-kosinusov` | `teoremy-sinusov-i-kosinusov/` |
| 8. Четырёхугольники | `teoriya-chetyrehugolniki` | `chetyrehugolniki/` |
| 9. Окружность | `teoriya-okruzhnost` | `okruzhnost/` |
| 10. Вписанные и описанные | `teoriya-vpisannye-i-opisannye` | `vpisannye-i-opisannye/` |
| 11. Полезные факты | `teoriya-poleznye-fakty` | `poleznye-fakty/` |

### №3. Стереометрия — `/zadaniya/3/teoriya/…`

| Глава | Якорь сейчас | Адрес |
|---|---|---|
| 0. Что такое №3 и что нужно уметь | `teoriya-umet` | `chto-nuzhno-umet/` |
| 1. Как читать и строить чертёж | `teoriya-chertezh` | `chertezh/` |
| 2. Пространство → плоский треугольник | `teoriya-treugolnik` | `ploskiy-treugolnik/` |
| 3. Многогранники | `teoriya-mnogogranniki` | `mnogogranniki/` |
| 4. Объём и площадь поверхности | `teoriya-obem` | `obem-i-ploshchad/` |
| 5. Тела вращения | `teoriya-vrashcheniya` | `tela-vrashcheniya/` |
| 6. Изменение размеров и подобие | `teoriya-podobie` | `podobie/` |
| 7. Комбинации тел | `teoriya-kombinacii` | `kombinacii-tel/` |
| 8. Углы между прямыми | `teoriya-ugly` | `ugly-mezhdu-pryamymi/` |
| 9. Как считать без калькулятора | `teoriya-schet` | `schet-bez-kalkulyatora/` |
| 10. Шпаргалка №3 | `teoriya-formuly` | `shpargalka/` |

### №6. Случайные величины — `/zadaniya/6/teoriya/…`

| Глава | Якорь сейчас | Адрес |
|---|---|---|
| 1. Случайная величина и распределение | `teoriya-raspredelenie` | `raspredelenie/` |
| 2. Диаграммы Эйлера и деревья | `teoriya-diagrammy` | `diagrammy-i-derevya/` |
| 3. Условная вероятность | `teoriya-uslovnaya` | `uslovnaya-veroyatnost/` |
| 4. Математическое ожидание | `teoriya-ozhidanie` | `matozhidanie/` |
| 5. Дисперсия и стандартное отклонение | `teoriya-dispersiya` | `dispersiya/` |
| 6. Выборка и несмещённая оценка | `teoriya-vyborka` | `vyborka/` |
| 7. Неравенство Чебышёва | `teoriya-chebyshev` | `neravenstvo-chebysheva/` |
| 8. Вероятность попадания в промежуток | `teoriya-promezhutok` | `popadanie-v-promezhutok/` |
| 9. Ловушки | `teoriya-lovushki` | `lovushki/` |

### №7. Уравнения — `/zadaniya/7/teoriya/…`

| Глава | Якорь сейчас | Адрес |
|---|---|---|
| 1. Как решать любое уравнение №7 | `teoriya-kak-reshat` | `kak-reshat/` |
| 2. Линейные и дробные | `teoriya-lineynye` | `lineynye-i-drobnye/` |
| 3. Степенные | `teoriya-stepennye` | `stepennye/` |
| 4. Квадратные | `teoriya-kvadratnye` | `kvadratnye/` |
| 5. Иррациональные | `teoriya-irracionalnye` | `irracionalnye/` |
| 6. Показательные | `teoriya-pokazatelnye` | `pokazatelnye/` |
| 7. Логарифмы и логарифмические | `teoriya-logarifmy` | `logarifmicheskie/` |
| 8. Простейшие тригонометрические | `teoriya-trigonometriya` | `trigonometricheskie/` |
| 9. Ловушки | `teoriya-lovushki` | `lovushki/` |

### №10. Физический смысл — `/zadaniya/10/teoriya/…`

| Глава | Якорь сейчас | Адрес |
|---|---|---|
| 1. Как решать прикладную задачу | `teoriya-algoritm` | `kak-reshat/` |
| 2. Единицы измерения | `teoriya-edinicy` | `edinicy-izmereniya/` |
| 3. Линейные и дробно-рациональные | `teoriya-drobnye` | `lineynye-i-drobnye/` |
| 4. Квадратные уравнения и неравенства | `teoriya-kvadratnye` | `kvadratnye/` |
| 5. Степени и корни | `teoriya-stepeni` | `stepeni-i-korni/` |
| 6. Показательные и логарифмические | `teoriya-pokazatelnye` | `pokazatelnye-i-logarifmicheskie/` |
| 7. Тригонометрия | `teoriya-trigonometriya` | `trigonometriya/` |
| 8. Физика в двух словах | `teoriya-fizika` | `fizika/` |
| 9. Ловушки | `teoriya-lovushki` | `lovushki/` |

### №11. Текстовые задачи — `/zadaniya/11/teoriya/…`

| Глава | Якорь сейчас | Адрес |
|---|---|---|
| 1. Как устроено задание | `teoriya-kak-ustroeno` | `kak-ustroeno/` |
| 2. Разминка | `teoriya-razminka` | `razminka/` |
| 3. Единицы измерения | `teoriya-edinicy` | `edinicy-izmereniya/` |
| 4. Проценты | `teoriya-procenty` | `procenty/` |
| 5. Смеси и сплавы | `teoriya-smesi` | `smesi-i-splavy/` |
| 6. Движение по прямой | `teoriya-pryamaya` | `dvizhenie-po-pryamoy/` |
| 7. Протяжённые тела | `teoriya-protyazhennye` | `protyazhennye-tela/` |
| 8. Движение по воде | `teoriya-voda` | `dvizhenie-po-vode/` |
| 9. Движение по окружности | `teoriya-okruzhnost` | `dvizhenie-po-okruzhnosti/` |
| 10. Работа | `teoriya-rabota` | `rabota/` |
| 11. Прогрессии | `teoriya-progressii` | `progressii/` |
| 12. Лайфхаки | `teoriya-layfhaki` | `layfhaki/` |
| 13. Ловушки | `teoriya-lovushki` | `lovushki/` |

### №13. Экономическая задача — `/zadaniya/13/teoriya/…`

| Глава | Якорь сейчас | Адрес |
|---|---|---|
| 1. Проценты и увеличивающий коэффициент | `teoriya-procenty` | `procenty/` |
| 2. Кредит простыми словами | `teoriya-slova` | `kredit/` |
| 3. Две схемы кредита | `teoriya-dve-shemy` | `dve-shemy/` |
| 4. Дифференцированный платёж | `teoriya-dif` | `differencirovannyy-platezh/` |
| 5. «Поломанный» дифференцированный | `teoriya-polomannyy` | `polomannyy-platezh/` |
| 6. Аннуитет | `teoriya-annuitet` | `annuitet/` |
| 7. Вклады | `teoriya-vklady` | `vklady/` |
| 8. Как определить тип задачи | `teoriya-tip` | `tip-zadachi/` |
| 9. Ловушки и лайфхаки | `teoriya-lovushki` | `lovushki/` |

### №19. Задача с параметром — `/zadaniya/19/teoriya/…`

| Глава | Якорь сейчас | Адрес |
|---|---|---|
| 1. Что такое параметр | `teoriya-parametr` | `chto-takoe-parametr/` |
| 2. Что нужно уметь до параметров | `teoriya-podgotovka` | `chto-nuzhno-umet/` |
| 3. Базовые элементы | `teoriya-bazovye` | `bazovye-elementy/` |
| 4. Два правила и оформление | `teoriya-oformlenie` | `pravila-i-oformlenie/` |
| 5. Метод 1. Графический способ | `teoriya-m01` | `graficheskiy-sposob/` |
| 6. Метод 2. Геометрический способ | `teoriya-m02` | `geometricheskiy-sposob/` |

Следующие методы №19 получат адреса по тому же правилу — названием
метода (`metod-oblastey/`, `simmetriya/` …).

## Заодно: опорные задачи №1

`/zadaniya/1/opornye-zadachi/` весит 3,9 МБ: на ней все блоки целиком,
хотя у каждого блока уже есть своя страница
`/zadaniya/1/opornye-zadachi/<блок>/`. Предлагаю сделать её списком
блоков с короткими описаниями — как у №13. Адреса блоков не меняются.

## Заголовки и описания глав

По тому же правилу, что вкладки (`app/src/content/seo.ts`):

- title: `Аннуитет — теория задания 13 ЕГЭ профиль`
- description: первая фраза главы, до 160 знаков.

## Что нужно от вас

1. «Да» на разбиение и на список разделов.
2. Правки адресов глав, если какой-то хочется назвать иначе. После
   выкладки адрес лучше не менять: на него появятся ссылки.
