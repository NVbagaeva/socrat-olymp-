# Размеры картинок-иллюстраций: аудит и единая система

Задача: навести порядок с размерами картинок по всему сайту. Сами
картинки не перерисованы и не заменены — меняются только размеры и
вёрстка вокруг них.

## Нормы (components/ui/Illustration.tsx)

| Вариант | Где | Компьютер | Телефон (< 640 px) |
|---|---|---|---|
| header | картинка в шапке раздела | 260 | 112 |
| hero | главная картинка вводного блока («О задании», первый экран главной, «Об авторе», сцены витрины) | ≤ 360 по ширине, ≤ 300 по высоте | ≤ 220 по ширине, по центру над текстом |
| section | иллюстрации в теории и разборах | ≤ 280 | ≤ 280 |
| inline | маленькие картинки в карточках, списках, плитках | 96–140 | 96–140 |
| task | картинки к условиям задач | 160–180 | 120 |
| без варианта | всё остальное | ≤ 360 | ≤ 360 |

Нормы в пикселях: на очень широком экране размеры не растут (проверка
гоняет главную и «О задании» №1 ещё и на 2560 px). Картинка вписывается
целиком (object-fit: contain), атрибуты width/height — её отображаемый
размер, вёрстка при загрузке не сдвигается; srcset — 1x/2x или набор
ширин, если картинка собрана в нескольких размерах.

## Как снято

- `pnpm audit:illyustracii --md <файл> --json <файл>` — все страницы
  (155): главная, «Об авторе», «Как пользоваться», тарифы, «Для
  учителя», кабинеты, все вкладки каждого раздела (О задании, Теория,
  Карточки, Опорные задачи, Тренажёр, Генератор, Для репетиторов и свои
  вкладки разделов). На 1440 и 375 px: каждая видимая картинка-файл
  (растр и SVG в `<img>`; рисованные inline-SVG чертежи не считаются),
  её отображаемые размеры, доля ширины контента, вариант и нарушение
  нормы. Скрытый раздел (404 для посетителей) пропускается.
- `pnpm test:illyustracii` — та же проходка; падает, если картинка
  крупнее нормы своего варианта или картинка без варианта крупнее 360 px.
- `node scripts/shots-illyustracii.mjs` — снимки ниже.

Полные таблицы: [было](razmery-illyustracij/audit-bylo.md) (653 строки,
40 за нормой) и [стало](razmery-illyustracij/audit-stalo.md) (710 строк,
0 за нормой). Строк стало больше на №10: миниатюры сюжетов в строках
типов раньше схлопывались в 0 px (процентная ширина внутри ужимающейся
ячейки), теперь видны в своём слоте 64 × 48, как задумано.

## Было → стало

Все картинки, у которых изменился отображаемый размер (больше 2 px).

| Страница | Экран | Файл | Было, px | Стало, px | Вариант | Нарушение до |
|---|---|---|---|---|---|---|
| / | 1440 | hero-kristall | 553 × 466 | 356 × 300 | hero | **ширина 552.6 > 360, высота 466 > 360** |
| / | 1440 | task-01 | 152 × 152 | 140 × 140 | inline | — |
| / | 1440 | task-02 | 152 × 152 | 140 × 140 | inline | — |
| / | 1440 | task-03 | 152 × 152 | 140 × 140 | inline | — |
| / | 1440 | task-04 | 152 × 152 | 140 × 140 | inline | — |
| / | 1440 | task-05 | 152 × 152 | 140 × 140 | inline | — |
| / | 1440 | task-07 | 152 × 152 | 140 × 140 | inline | — |
| / | 1440 | task-08 | 152 × 152 | 140 × 140 | inline | — |
| / | 1440 | task-09 | 152 × 152 | 140 × 140 | inline | — |
| / | 1440 | task-10 | 152 × 152 | 140 × 140 | inline | — |
| / | 1440 | task-11 | 152 × 152 | 140 × 140 | inline | — |
| / | 1440 | task-12 | 152 × 152 | 140 × 140 | inline | — |
| / | 1440 | task-21 | 152 × 152 | 140 × 140 | inline | — |
| / | 1440 | vitrina-list-bez | 571 × 454 | 262 × 208 | hero | **ширина 571 > 360, высота 453.6 > 360** |
| / | 1440 | vitrina-podskazka | 533 × 638 | 245 × 293 | hero | **ширина 532.6 > 360, высота 638 > 360** |
| / | 375 | hero-kristall | 300 × 253 | 220 × 186 | hero | — |
| / | 375 | vitrina-list-bez | 269 × 214 | 186 × 148 | hero | — |
| / | 375 | vitrina-podskazka | 251 × 301 | 174 × 208 | hero | — |
| /about/ | 1440 | bust-marble | 196 × 261 | 104 × 139 | hero | — |
| /about/ | 1440 | instrument | 521 × 365 | 280 × 196 | section | **ширина 521.3 > 360, высота 364.9 > 360** |
| /about/ | 1440 | nata-portrait | 345 × 547 | 183 × 291 | hero | **высота 547.3 > 360** |
| /about/ | 1440 | piramida-steklo | 171 × 151 | 91 × 80 | hero | — |
| /about/ | 375 | bust-marble | 104 × 138 | 68 × 91 | hero | — |
| /about/ | 375 | instrument | 300 × 210 | 280 × 196 | section | — |
| /about/ | 375 | nata-portrait | 183 × 290 | 120 × 191 | hero | — |
| /about/ | 375 | piramida-steklo | 90 × 80 | 59 × 53 | hero | — |
| /kak-polzovatsya/ | 375 | generator | 301 × 176 | 280 × 163 | section | — |
| /kak-polzovatsya/ | 375 | list-uchitelya | 301 × 176 | 280 × 163 | section | — |
| /kak-polzovatsya/ | 375 | marshruty | 301 × 176 | 280 × 163 | section | — |
| /kak-polzovatsya/ | 375 | podskazka | 301 × 176 | 280 × 163 | section | — |
| /zadaniya/1/ | 1440 | shapka-planimetriya | 525 × 337 | 360 × 231 | hero | **ширина 525 > 360** |
| /zadaniya/1/ | 375 | shapka-planimetriya | 293 × 188 | 220 × 141 | hero | — |
| /zadaniya/10/ | 1440 | P01 | 495 × 330 | 180 × 120 | task | **ширина 495 > 360** |
| /zadaniya/10/ | 1440 | P02 | 495 × 330 | 180 × 120 | task | **ширина 495 > 360** |
| /zadaniya/10/ | 1440 | P03 | 495 × 330 | 180 × 120 | task | **ширина 495 > 360** |
| /zadaniya/10/ | 1440 | P04 | 495 × 330 | 180 × 120 | task | **ширина 495 > 360** |
| /zadaniya/10/ | 1440 | P05 | 495 × 330 | 180 × 120 | task | **ширина 495 > 360** |
| /zadaniya/10/ | 1440 | P06 | 495 × 330 | 180 × 120 | task | **ширина 495 > 360** |
| /zadaniya/10/ | 1440 | P07 | 495 × 330 | 180 × 120 | task | **ширина 495 > 360** |
| /zadaniya/10/ | 1440 | P08 | 495 × 330 | 180 × 120 | task | **ширина 495 > 360** |
| /zadaniya/10/ | 1440 | P09 | 495 × 330 | 180 × 120 | task | **ширина 495 > 360** |
| /zadaniya/10/ | 1440 | P10 | 495 × 452 | 180 × 164 | task | **ширина 495 > 360, высота 451.7 > 360** |
| /zadaniya/10/ | 1440 | P11 | 495 × 330 | 180 × 120 | task | **ширина 495 > 360** |
| /zadaniya/10/ | 1440 | P12 | 495 × 330 | 180 × 120 | task | **ширина 495 > 360** |
| /zadaniya/10/ | 1440 | P13 | 495 × 330 | 180 × 120 | task | **ширина 495 > 360** |
| /zadaniya/10/ | 1440 | P14 | 495 × 330 | 180 × 120 | task | **ширина 495 > 360** |
| /zadaniya/10/ | 1440 | P15 | 320 × 481 | 120 × 180 | task | **высота 480.8 > 360** |
| /zadaniya/10/ | 1440 | P16 | 495 × 330 | 180 × 120 | task | **ширина 495 > 360** |
| /zadaniya/10/ | 1440 | P17 | 320 × 481 | 120 × 180 | task | **высота 480.8 > 360** |
| /zadaniya/10/ | 1440 | P18 | 495 × 330 | 180 × 120 | task | **ширина 495 > 360** |
| /zadaniya/10/ | 1440 | P19 | 495 × 330 | 180 × 120 | task | **ширина 495 > 360** |
| /zadaniya/10/ | 1440 | P20 | 495 × 330 | 180 × 120 | task | **ширина 495 > 360** |
| /zadaniya/10/ | 1440 | P21 | 495 × 330 | 180 × 120 | task | **ширина 495 > 360** |
| /zadaniya/10/ | 1440 | P22 | 495 × 330 | 180 × 120 | task | **ширина 495 > 360** |
| /zadaniya/10/ | 1440 | P23 | 495 × 452 | 180 × 164 | task | **ширина 495 > 360, высота 451.7 > 360** |
| /zadaniya/10/ | 1440 | P24 | 495 × 330 | 180 × 120 | task | **ширина 495 > 360** |
| /zadaniya/10/ | 1440 | P25 | 495 × 330 | 180 × 120 | task | **ширина 495 > 360** |
| /zadaniya/10/ | 1440 | P26 | 495 × 330 | 180 × 120 | task | **ширина 495 > 360** |
| /zadaniya/10/ | 1440 | P27 | 495 × 330 | 180 × 120 | task | **ширина 495 > 360** |
| /zadaniya/10/ | 1440 | P28 | 495 × 330 | 180 × 120 | task | **ширина 495 > 360** |
| /zadaniya/10/ | 1440 | P29 | 495 × 330 | 180 × 120 | task | **ширина 495 > 360** |
| /zadaniya/10/ | 1440 | P33 | 495 × 330 | 180 × 120 | task | **ширина 495 > 360** |
| /zadaniya/10/ | 1440 | task-10 | 280 × 280 | 300 × 300 | hero | — |
| /zadaniya/10/ | 375 | P01 | 311 × 207 | 120 × 80 | task | — |
| /zadaniya/10/ | 375 | P02 | 311 × 207 | 120 × 80 | task | — |
| /zadaniya/10/ | 375 | P03 | 311 × 207 | 120 × 80 | task | — |
| /zadaniya/10/ | 375 | P04 | 311 × 207 | 120 × 80 | task | — |
| /zadaniya/10/ | 375 | P05 | 311 × 207 | 120 × 80 | task | — |
| /zadaniya/10/ | 375 | P06 | 311 × 207 | 120 × 80 | task | — |
| /zadaniya/10/ | 375 | P07 | 311 × 207 | 120 × 80 | task | — |
| /zadaniya/10/ | 375 | P08 | 311 × 207 | 120 × 80 | task | — |
| /zadaniya/10/ | 375 | P09 | 311 × 207 | 120 × 80 | task | — |
| /zadaniya/10/ | 375 | P10 | 311 × 284 | 120 × 110 | task | — |
| /zadaniya/10/ | 375 | P11 | 311 × 207 | 120 × 80 | task | — |
| /zadaniya/10/ | 375 | P12 | 311 × 207 | 120 × 80 | task | — |
| /zadaniya/10/ | 375 | P13 | 311 × 207 | 120 × 80 | task | — |
| /zadaniya/10/ | 375 | P14 | 311 × 207 | 120 × 80 | task | — |
| /zadaniya/10/ | 375 | P15 | 311 × 467 | 120 × 120 | task | **высота 467.2 > 360** |
| /zadaniya/10/ | 375 | P16 | 311 × 207 | 120 × 80 | task | — |
| /zadaniya/10/ | 375 | P17 | 311 × 467 | 120 × 120 | task | **высота 467.2 > 360** |
| /zadaniya/10/ | 375 | P18 | 311 × 207 | 120 × 80 | task | — |
| /zadaniya/10/ | 375 | P19 | 311 × 207 | 120 × 80 | task | — |
| /zadaniya/10/ | 375 | P20 | 311 × 207 | 120 × 80 | task | — |
| /zadaniya/10/ | 375 | P21 | 311 × 207 | 120 × 80 | task | — |
| /zadaniya/10/ | 375 | P22 | 311 × 207 | 120 × 80 | task | — |
| /zadaniya/10/ | 375 | P23 | 311 × 284 | 120 × 110 | task | — |
| /zadaniya/10/ | 375 | P24 | 311 × 207 | 120 × 80 | task | — |
| /zadaniya/10/ | 375 | P25 | 311 × 207 | 120 × 80 | task | — |
| /zadaniya/10/ | 375 | P26 | 311 × 207 | 120 × 80 | task | — |
| /zadaniya/10/ | 375 | P27 | 311 × 207 | 120 × 80 | task | — |
| /zadaniya/10/ | 375 | P28 | 311 × 207 | 120 × 80 | task | — |
| /zadaniya/10/ | 375 | P29 | 311 × 207 | 120 × 80 | task | — |
| /zadaniya/10/ | 375 | P33 | 311 × 207 | 120 × 80 | task | — |
| /zadaniya/10/teoriya/ | 1440 | P15 | 213 × 320 | 186 × 279 | section | — |
| /zadaniya/10/teoriya/ | 1440 | P17 | 213 × 320 | 186 × 279 | section | — |
| /zadaniya/10/teoriya/ | 375 | P01 | 301 × 201 | 280 × 186 | section | — |
| /zadaniya/10/teoriya/ | 375 | P02 | 301 × 201 | 280 × 186 | section | — |
| /zadaniya/10/teoriya/ | 375 | P03 | 301 × 201 | 280 × 186 | section | — |
| /zadaniya/10/teoriya/ | 375 | P04 | 301 × 201 | 280 × 186 | section | — |
| /zadaniya/10/teoriya/ | 375 | P05 | 301 × 201 | 280 × 186 | section | — |
| /zadaniya/10/teoriya/ | 375 | P06 | 301 × 201 | 280 × 186 | section | — |
| /zadaniya/10/teoriya/ | 375 | P07 | 301 × 201 | 280 × 186 | section | — |
| /zadaniya/10/teoriya/ | 375 | P08 | 301 × 201 | 280 × 186 | section | — |
| /zadaniya/10/teoriya/ | 375 | P09 | 301 × 201 | 280 × 186 | section | — |
| /zadaniya/10/teoriya/ | 375 | P10 | 301 × 275 | 280 × 256 | section | — |
| /zadaniya/10/teoriya/ | 375 | P11 | 301 × 201 | 280 × 186 | section | — |
| /zadaniya/10/teoriya/ | 375 | P12 | 301 × 201 | 280 × 186 | section | — |
| /zadaniya/10/teoriya/ | 375 | P13 | 301 × 201 | 280 × 186 | section | — |
| /zadaniya/10/teoriya/ | 375 | P14 | 301 × 201 | 280 × 186 | section | — |
| /zadaniya/10/teoriya/ | 375 | P15 | 213 × 320 | 186 × 279 | section | — |
| /zadaniya/10/teoriya/ | 375 | P16 | 301 × 201 | 280 × 186 | section | — |
| /zadaniya/10/teoriya/ | 375 | P17 | 213 × 320 | 186 × 279 | section | — |
| /zadaniya/10/teoriya/ | 375 | P18 | 301 × 201 | 280 × 186 | section | — |
| /zadaniya/10/teoriya/ | 375 | P19 | 301 × 201 | 280 × 186 | section | — |
| /zadaniya/10/teoriya/ | 375 | P20 | 301 × 201 | 280 × 186 | section | — |
| /zadaniya/10/teoriya/ | 375 | P21 | 301 × 201 | 280 × 186 | section | — |
| /zadaniya/10/teoriya/ | 375 | P22 | 301 × 201 | 280 × 186 | section | — |
| /zadaniya/10/teoriya/ | 375 | P23 | 301 × 275 | 280 × 256 | section | — |
| /zadaniya/10/teoriya/ | 375 | P24 | 301 × 201 | 280 × 186 | section | — |
| /zadaniya/10/teoriya/ | 375 | P25 | 301 × 201 | 280 × 186 | section | — |
| /zadaniya/10/teoriya/ | 375 | P26 | 301 × 201 | 280 × 186 | section | — |
| /zadaniya/10/teoriya/ | 375 | P27 | 301 × 201 | 280 × 186 | section | — |
| /zadaniya/10/teoriya/ | 375 | P28 | 301 × 201 | 280 × 186 | section | — |
| /zadaniya/10/teoriya/ | 375 | P29 | 301 × 201 | 280 × 186 | section | — |
| /zadaniya/10/teoriya/ | 375 | P33 | 301 × 201 | 280 × 186 | section | — |
| /zadaniya/11/ | 1440 | task-11 | 280 × 280 | 300 × 300 | hero | — |
| /zadaniya/11/teoriya/ | 1440 | gel | 180 × 180 | 140 × 140 | inline | — |
| /zadaniya/11/teoriya/ | 1440 | kokteyl | 180 × 180 | 140 × 140 | inline | — |
| /zadaniya/11/teoriya/ | 1440 | sahar | 180 × 180 | 140 × 140 | inline | — |
| /zadaniya/11/teoriya/ | 1440 | sok | 180 × 180 | 140 × 140 | inline | — |
| /zadaniya/11/teoriya/ | 375 | gel | 180 × 180 | 140 × 140 | inline | — |
| /zadaniya/11/teoriya/ | 375 | kokteyl | 180 × 180 | 140 × 140 | inline | — |
| /zadaniya/11/teoriya/ | 375 | sahar | 180 × 180 | 140 × 140 | inline | — |
| /zadaniya/11/teoriya/ | 375 | sok | 180 × 180 | 140 × 140 | inline | — |
| /zadaniya/12/ | 1440 | hero | 264 × 176 | 260 × 173 | header | — |
| /zadaniya/12/ | 1440 | task-12 | 280 × 280 | 300 × 300 | hero | — |
| /zadaniya/12/ | 375 | hero | 108 × 72 | 112 × 75 | header | — |
| /zadaniya/12/generator/ | 1440 | hero | 264 × 176 | 260 × 173 | header | — |
| /zadaniya/12/generator/ | 375 | hero | 108 × 72 | 112 × 75 | header | — |
| /zadaniya/12/trenazher/ | 1440 | hero | 264 × 176 | 260 × 173 | header | — |
| /zadaniya/12/trenazher/ | 375 | hero | 108 × 72 | 112 × 75 | header | — |
| /zadaniya/12/zachyot/ | 1440 | hero | 264 × 176 | 260 × 173 | header | — |
| /zadaniya/12/zachyot/ | 375 | hero | 108 × 72 | 112 × 75 | header | — |
| /zadaniya/13/ | 1440 | task-13 | 280 × 280 | 300 × 300 | hero | — |
| /zadaniya/14/teoriya/ | 1440 | kotik-kot | 313 × 228 | 275 × 201 | section | — |
| /zadaniya/14/teoriya/ | 1440 | kotik-oblako | 313 × 108 | 275 × 95 | section | — |
| /zadaniya/2/ | 1440 | task-02 | 280 × 280 | 300 × 300 | hero | — |
| /zadaniya/21/teoriya/ | 1440 | matreshki-raskryty | 418 × 306 | 280 × 205 | section | **ширина 418 > 360** |
| /zadaniya/21/teoriya/ | 375 | matreshki-raskryty | 333 × 244 | 280 × 205 | section | — |
| /zadaniya/3/ | 1440 | kub-shar | 264 × 288 | 238 × 260 | header | — |
| /zadaniya/3/dlya-repetitorov/ | 1440 | kub-shar | 264 × 288 | 238 × 260 | header | — |
| /zadaniya/3/generator/ | 1440 | kub-shar | 264 × 288 | 238 × 260 | header | — |
| /zadaniya/3/kartochki/ | 1440 | kub-shar | 264 × 288 | 238 × 260 | header | — |
| /zadaniya/3/opornye-zadachi/ | 1440 | kub-shar | 264 × 288 | 238 × 260 | header | — |
| /zadaniya/3/teoriya/ | 1440 | kub-shar | 264 × 288 | 238 × 260 | header | — |
| /zadaniya/3/trenazher/ | 1440 | kub-shar | 264 × 288 | 238 × 260 | header | — |
| /zadaniya/4/ | 1440 | pamyatnik-porokam | 640 × 360 | 280 × 158 | section | **ширина 640 > 360** |
| /zadaniya/4/ | 1440 | shapka-veroyatnost-prostaya | 264 × 124 | 260 × 122 | header | — |
| /zadaniya/4/ | 1440 | task-04 | 280 × 280 | 300 × 300 | hero | — |
| /zadaniya/4/ | 375 | pamyatnik-porokam | 301 × 169 | 280 × 158 | section | — |
| /zadaniya/4/ | 375 | shapka-veroyatnost-prostaya | 108 × 51 | 112 × 53 | header | — |
| /zadaniya/4/dlya-repetitorov/ | 1440 | shapka-veroyatnost-prostaya | 264 × 124 | 260 × 122 | header | — |
| /zadaniya/4/dlya-repetitorov/ | 375 | shapka-veroyatnost-prostaya | 108 × 51 | 112 × 53 | header | — |
| /zadaniya/4/generator/ | 1440 | shapka-veroyatnost-prostaya | 264 × 124 | 260 × 122 | header | — |
| /zadaniya/4/generator/ | 375 | shapka-veroyatnost-prostaya | 108 × 51 | 112 × 53 | header | — |
| /zadaniya/4/kartochki/ | 1440 | shapka-veroyatnost-prostaya | 264 × 124 | 260 × 122 | header | — |
| /zadaniya/4/kartochki/ | 375 | shapka-veroyatnost-prostaya | 108 × 51 | 112 × 53 | header | — |
| /zadaniya/4/metody/ | 1440 | shapka-veroyatnost-prostaya | 264 × 124 | 260 × 122 | header | — |
| /zadaniya/4/metody/ | 375 | shapka-veroyatnost-prostaya | 108 × 51 | 112 × 53 | header | — |
| /zadaniya/4/opornye-zadachi/ | 1440 | shapka-veroyatnost-prostaya | 264 × 124 | 260 × 122 | header | — |
| /zadaniya/4/opornye-zadachi/ | 375 | shapka-veroyatnost-prostaya | 108 × 51 | 112 × 53 | header | — |
| /zadaniya/4/teoriya/ | 1440 | shapka-veroyatnost-prostaya | 264 × 124 | 260 × 122 | header | — |
| /zadaniya/4/teoriya/ | 375 | eyler-portret | 295 × 185 | 280 × 176 | section | — |
| /zadaniya/4/teoriya/ | 375 | korobka-konfet | 303 × 172 | 280 × 159 | section | — |
| /zadaniya/4/teoriya/ | 375 | podsnezhniki | 303 × 202 | 280 × 187 | section | — |
| /zadaniya/4/teoriya/ | 375 | shapka-veroyatnost-prostaya | 108 × 51 | 112 × 53 | header | — |
| /zadaniya/4/trenazher/ | 1440 | shapka-veroyatnost-prostaya | 264 × 124 | 260 × 122 | header | — |
| /zadaniya/4/trenazher/ | 375 | shapka-veroyatnost-prostaya | 108 × 51 | 112 × 53 | header | — |
| /zadaniya/5/ | 1440 | task-05 | 280 × 280 | 300 × 300 | hero | — |
| /zadaniya/5/teoriya/ | 1440 | chaynik-kipit | 185 × 200 | 130 × 140 | inline | — |
| /zadaniya/5/teoriya/ | 1440 | chaynik-vyklyuchen | 180 × 200 | 126 × 140 | inline | — |
| /zadaniya/5/teoriya/ | 375 | chaynik-kipit | 185 × 200 | 130 × 140 | inline | — |
| /zadaniya/5/teoriya/ | 375 | chaynik-vyklyuchen | 180 × 200 | 126 × 140 | inline | — |
| /zadaniya/7/ | 1440 | task-07 | 280 × 280 | 300 × 300 | hero | — |
| /zadaniya/9/ | 1440 | task-09 | 280 × 280 | 300 × 300 | hero | — |


## Снимки «было / стало»

Слева — было, справа — стало. 1440 px снято в половину масштаба.

### /zadaniya/1/

![zadaniya_1-1440.jpg](razmery-illyustracij/zadaniya_1-1440.jpg)

![zadaniya_1-375.jpg](razmery-illyustracij/zadaniya_1-375.jpg)

### /about/

![about-1440.jpg](razmery-illyustracij/about-1440.jpg)

![about-375.jpg](razmery-illyustracij/about-375.jpg)

### /about/ (картинка instrument)

![about--instrument-1440.jpg](razmery-illyustracij/about--instrument-1440.jpg)

![about--instrument-375.jpg](razmery-illyustracij/about--instrument-375.jpg)

### /

![glavnaya-1440.jpg](razmery-illyustracij/glavnaya-1440.jpg)

![glavnaya-375.jpg](razmery-illyustracij/glavnaya-375.jpg)

### / (картинка vitrina-list-bez)

![glavnaya--vitrina-list-bez-1440.jpg](razmery-illyustracij/glavnaya--vitrina-list-bez-1440.jpg)

![glavnaya--vitrina-list-bez-375.jpg](razmery-illyustracij/glavnaya--vitrina-list-bez-375.jpg)

### /kak-polzovatsya/ (картинка generator)

![kak-polzovatsya--generator-1440.jpg](razmery-illyustracij/kak-polzovatsya--generator-1440.jpg)

![kak-polzovatsya--generator-375.jpg](razmery-illyustracij/kak-polzovatsya--generator-375.jpg)

### /zadaniya/10/ (картинка P01)

![zadaniya_10--P01-1440.jpg](razmery-illyustracij/zadaniya_10--P01-1440.jpg)

![zadaniya_10--P01-375.jpg](razmery-illyustracij/zadaniya_10--P01-375.jpg)

### /zadaniya/10/teoriya/ (картинка P15)

![zadaniya_10_teoriya--P15-1440.jpg](razmery-illyustracij/zadaniya_10_teoriya--P15-1440.jpg)

![zadaniya_10_teoriya--P15-375.jpg](razmery-illyustracij/zadaniya_10_teoriya--P15-375.jpg)

### /zadaniya/11/teoriya/ (картинка sahar)

![zadaniya_11_teoriya--sahar-1440.jpg](razmery-illyustracij/zadaniya_11_teoriya--sahar-1440.jpg)

![zadaniya_11_teoriya--sahar-375.jpg](razmery-illyustracij/zadaniya_11_teoriya--sahar-375.jpg)

### /zadaniya/12/

![zadaniya_12-1440.jpg](razmery-illyustracij/zadaniya_12-1440.jpg)

![zadaniya_12-375.jpg](razmery-illyustracij/zadaniya_12-375.jpg)

### /zadaniya/12/generator/

![zadaniya_12_generator-1440.jpg](razmery-illyustracij/zadaniya_12_generator-1440.jpg)

![zadaniya_12_generator-375.jpg](razmery-illyustracij/zadaniya_12_generator-375.jpg)

### /zadaniya/12/trenazher/

![zadaniya_12_trenazher-1440.jpg](razmery-illyustracij/zadaniya_12_trenazher-1440.jpg)

![zadaniya_12_trenazher-375.jpg](razmery-illyustracij/zadaniya_12_trenazher-375.jpg)

### /zadaniya/12/zachyot/

![zadaniya_12_zachyot-1440.jpg](razmery-illyustracij/zadaniya_12_zachyot-1440.jpg)

![zadaniya_12_zachyot-375.jpg](razmery-illyustracij/zadaniya_12_zachyot-375.jpg)

### /zadaniya/14/teoriya/ (картинка kotik-oblako)

![zadaniya_14_teoriya--kotik-oblako-1440.jpg](razmery-illyustracij/zadaniya_14_teoriya--kotik-oblako-1440.jpg)

![zadaniya_14_teoriya--kotik-oblako-375.jpg](razmery-illyustracij/zadaniya_14_teoriya--kotik-oblako-375.jpg)

### /zadaniya/21/teoriya/ (картинка matreshki-raskryty)

![zadaniya_21_teoriya--matreshki-raskryty-1440.jpg](razmery-illyustracij/zadaniya_21_teoriya--matreshki-raskryty-1440.jpg)

![zadaniya_21_teoriya--matreshki-raskryty-375.jpg](razmery-illyustracij/zadaniya_21_teoriya--matreshki-raskryty-375.jpg)

### /zadaniya/3/

![zadaniya_3-1440.jpg](razmery-illyustracij/zadaniya_3-1440.jpg)

![zadaniya_3-375.jpg](razmery-illyustracij/zadaniya_3-375.jpg)

### /zadaniya/3/dlya-repetitorov/

![zadaniya_3_dlya-repetitorov-1440.jpg](razmery-illyustracij/zadaniya_3_dlya-repetitorov-1440.jpg)

![zadaniya_3_dlya-repetitorov-375.jpg](razmery-illyustracij/zadaniya_3_dlya-repetitorov-375.jpg)

### /zadaniya/3/generator/

![zadaniya_3_generator-1440.jpg](razmery-illyustracij/zadaniya_3_generator-1440.jpg)

![zadaniya_3_generator-375.jpg](razmery-illyustracij/zadaniya_3_generator-375.jpg)

### /zadaniya/3/kartochki/

![zadaniya_3_kartochki-1440.jpg](razmery-illyustracij/zadaniya_3_kartochki-1440.jpg)

![zadaniya_3_kartochki-375.jpg](razmery-illyustracij/zadaniya_3_kartochki-375.jpg)

### /zadaniya/3/opornye-zadachi/

![zadaniya_3_opornye-zadachi-1440.jpg](razmery-illyustracij/zadaniya_3_opornye-zadachi-1440.jpg)

![zadaniya_3_opornye-zadachi-375.jpg](razmery-illyustracij/zadaniya_3_opornye-zadachi-375.jpg)

### /zadaniya/3/teoriya/

![zadaniya_3_teoriya-1440.jpg](razmery-illyustracij/zadaniya_3_teoriya-1440.jpg)

![zadaniya_3_teoriya-375.jpg](razmery-illyustracij/zadaniya_3_teoriya-375.jpg)

### /zadaniya/3/trenazher/

![zadaniya_3_trenazher-1440.jpg](razmery-illyustracij/zadaniya_3_trenazher-1440.jpg)

![zadaniya_3_trenazher-375.jpg](razmery-illyustracij/zadaniya_3_trenazher-375.jpg)

### /zadaniya/4/ (картинка pamyatnik-porokam)

![zadaniya_4--pamyatnik-porokam-1440.jpg](razmery-illyustracij/zadaniya_4--pamyatnik-porokam-1440.jpg)

![zadaniya_4--pamyatnik-porokam-375.jpg](razmery-illyustracij/zadaniya_4--pamyatnik-porokam-375.jpg)

### /zadaniya/4/dlya-repetitorov/

![zadaniya_4_dlya-repetitorov-1440.jpg](razmery-illyustracij/zadaniya_4_dlya-repetitorov-1440.jpg)

![zadaniya_4_dlya-repetitorov-375.jpg](razmery-illyustracij/zadaniya_4_dlya-repetitorov-375.jpg)

### /zadaniya/4/generator/

![zadaniya_4_generator-1440.jpg](razmery-illyustracij/zadaniya_4_generator-1440.jpg)

![zadaniya_4_generator-375.jpg](razmery-illyustracij/zadaniya_4_generator-375.jpg)

### /zadaniya/4/kartochki/

![zadaniya_4_kartochki-1440.jpg](razmery-illyustracij/zadaniya_4_kartochki-1440.jpg)

![zadaniya_4_kartochki-375.jpg](razmery-illyustracij/zadaniya_4_kartochki-375.jpg)

### /zadaniya/4/metody/

![zadaniya_4_metody-1440.jpg](razmery-illyustracij/zadaniya_4_metody-1440.jpg)

![zadaniya_4_metody-375.jpg](razmery-illyustracij/zadaniya_4_metody-375.jpg)

### /zadaniya/4/opornye-zadachi/

![zadaniya_4_opornye-zadachi-1440.jpg](razmery-illyustracij/zadaniya_4_opornye-zadachi-1440.jpg)

![zadaniya_4_opornye-zadachi-375.jpg](razmery-illyustracij/zadaniya_4_opornye-zadachi-375.jpg)

### /zadaniya/4/teoriya/

![zadaniya_4_teoriya-1440.jpg](razmery-illyustracij/zadaniya_4_teoriya-1440.jpg)

![zadaniya_4_teoriya-375.jpg](razmery-illyustracij/zadaniya_4_teoriya-375.jpg)

### /zadaniya/4/trenazher/

![zadaniya_4_trenazher-1440.jpg](razmery-illyustracij/zadaniya_4_trenazher-1440.jpg)

![zadaniya_4_trenazher-375.jpg](razmery-illyustracij/zadaniya_4_trenazher-375.jpg)

### /zadaniya/5/teoriya/ (картинка chaynik-kipit)

![zadaniya_5_teoriya--chaynik-kipit-1440.jpg](razmery-illyustracij/zadaniya_5_teoriya--chaynik-kipit-1440.jpg)

![zadaniya_5_teoriya--chaynik-kipit-375.jpg](razmery-illyustracij/zadaniya_5_teoriya--chaynik-kipit-375.jpg)

