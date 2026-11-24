# Задание №4 — главы ключевых методов: картинки

Журнал стеклянных картинок к карточкам «Ключевые методы решения» (5 шт.)
и к разобранным задачам глав теории (10 шт.).

## Статус

Все 15 картинок сгенерированы 23.11.2026 (первая попытка упёрлась в
нулевой баланс OpenAI; после пополнения — заново, с нуля). Каждая
проверена: края прозрачные (скрипт), нет букв и цифр, сцена совпадает с
описанием и не спорит с задачей (глазами). Отбраковано 3 попытки — см.
таблицу. Обрезка по контуру, объект ~84 % квадрата, по центру.

Перегенерировать одну картинку:

```bash
python3 tools/metody4/gen_images.py <имя>
```

Скрипт проверяет прозрачность краёв (до 3 попыток), кладёт исходник PNG в
`design-reference/zadanie-04/` и WebP — в
`app/public/images/zadanie-04/metody/` (240, 120) и `…/primery/` (360, 180).
Счётчик попыток — `tools/metody4/zhurnal.json`.

## Параметры

- Модель: `gpt-image-2.6-sunburst` (самая новая в `GET /v1/models` на
  23.11.2026), эндпоинт `/v1/images/edits`.
- `size=1024x1024`, `quality=high`, `background=transparent`,
  `output_format=png`.
- `image[]` — образцы стиля (в PNG): `app/public/images/zadanie-04/shapka-veroyatnost-prostaya.webp`,
  `app/public/images/zadaniya/3/kub-shar-560.webp`,
  `app/public/images/shapki/zadanie-05-560.webp` (из ветки
  `claude/shapki-steklo-kartinki`).
- Промпт = стиль + сцена. Стиль — дословно, в `tools/metody4/gen_images.py`
  (`STYLE`).

## Сцены

`primer-2a` — добавлена: у базовой задачи главы 2 (Ноздрёв, один бросок)
в задании не было сцены, а картинка нужна у каждой задачи. Атрибут из
«Мёртвых душ» — шарманка Ноздрёва.

| Имя | Куда | Сцена (после «Scene: ») | Попыток | Отбраковано |
| --- | --- | --- | --- | --- |
| `metod-1` | карточка метода | a shallow round glass tray holding about ten glass marbles of the same size; three of them glow warm orange, the rest are clear blue glass. | 1 | — |
| `metod-2` | карточка метода | two dice side by side, one made of clear blue glass and one realistic white die with dark pips, standing on a thin frosted glass tile with a 6 by 6 grid; one cell of the grid glows warm orange. | 1 | — |
| `metod-3` | карточка метода | three coins in a row: two lying flat made of clear blue glass and one realistic gold coin flipping in the air above them, with a faint glowing dotted arc showing its flip. | 1 | — |
| `metod-4` | карточка метода | a small round glass table with six glass chairs around it; one chair glows warm orange, the chair next to it glows soft blue, the others are clear glass. | 2 | 1-я: вокруг стола 7 стульев вместо 6 — отбракована глазами |
| `metod-5` | карточка метода | a thick glass disk split into two pieces slightly pulled apart: a small slice glowing warm orange and the large remaining part of clear blue glass. | 1 | — |
| `primer-1a` | задача | a large magnifying glass, a deerstalker cap made of blue glass, a curved tobacco pipe and a fan of sealed envelopes on a small glass table; three envelopes glow warm orange. | 2 | 1-я: нет веера конвертов, светится один конверт — отбракована глазами |
| `primer-1b` | задача | an old-fashioned small travelling carriage (britzka) made of blue glass next to a long unrolled paper scroll list and a quill pen; one line of the scroll glows warm orange. | 1 | — |
| `primer-2a` | задача | a single realistic white die with dark pips resting on a small square of green card-table cloth, next to a small old-fashioned barrel organ (hurdy-gurdy) made of blue glass. | 1 | — |
| `primer-2` | задача | two realistic white dice with dark pips tumbling on a green card-table cloth inside a blue glass box, a deck of playing cards fanned beside them, a small glass goblet. | 1 | — |
| `primer-3a` | задача | two identical small blue glass toy rattles lying crossed, and one realistic gold coin spinning in the air above them. | 2 | 1-я: непрозрачные пиксели по краям — отбракована скриптом |
| `primer-3b` | задача | an old wooden chair made of blue glass with a realistic white captain's cap with a dark visor lying on its seat, and a gold coin spinning in the air above. | 1 | — |
| `primer-4a` | задача | a round blue glass table set for a tea party with a glass teapot, several glass teacups and a tall realistic top hat lying on the table; around it nine small glass chairs, two neighbouring chairs glow warm orange. | 1 | — |
| `primer-4b` | задача | two crossed fencing sabres made of blue glass over a realistic dark red hussar shako with gold braid, and a small glass bowl with folded paper lots. | 1 | — |
| `primer-5a` | задача | a tiny blue glass flea wearing microscopic golden horseshoes standing on a glass plate under an old brass microscope. | 1 | — |
| `primer-5b` | задача | a sealed envelope with a red wax seal and a quill pen in a glass inkwell, a small stack of letters made of blue glass. | 1 | — |

Полный промпт каждой картинки = стиль (выше) + сцена из таблицы; он же
записан в `tools/metody4/zhurnal.json` (поле `prompt`).
