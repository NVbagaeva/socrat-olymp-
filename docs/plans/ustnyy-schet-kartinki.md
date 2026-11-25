# Устный счёт: стеклянные картинки

Серия картинок раздела «Устный счёт» (/ustnyy-schet/): секундомер шапки,
четыре знака — слои её анимации, картинки групп приёмов, Виет, таблица
умножения и рейтинг. Одна серия: один стиль, свет, толщина стекла.

## Как сделаны

- Модель: `gpt-image-2.6-sunburst` — самая новая модель изображений в
  `GET /v1/models` на 24.11.2026. Эндпоинт `POST /v1/images/edits`.
- Образцы стиля в `image[]` (переведены в PNG):
  `public/images/zadanie-04/shapka-veroyatnost-prostaya.webp`,
  `public/images/zadaniya/3/kub-shar-560.webp`,
  `public/images/shapki/zadanie-05-560.webp`.
- Параметры: `size=1024x1024`, `quality=high`, `background=transparent`,
  `output_format=png`.
- Текст запроса = стиль + сцена. Стиль, дословно:

> Use the reference images ONLY as a style reference (material, lighting, palette, render quality) — do not copy their objects. Create a NEW 3D render in exactly the same style: clear pale icy-blue glass with soft refraction and smooth bevels, crisp bright edges with a soft blue glow, subtle warm amber rim highlights on a few edges, soft studio light from the top left, gentle inner glow, premium minimal product-render look, not cartoonish. Fully transparent background: no backdrop, no floor, no ground shadow, no frame. No text, no letters, no digits, no logos. Math operator signs are allowed only when the scene asks for them, as thick 3D glass objects. Single composition centered, filling about 80% of the square, three-quarter view from slightly above. Scene: 

- Исходники — `app/assets/ustnyy-schet/<имя>.png`; обрезка и WebP —
  `node scripts/build-shapka.mjs ustnyy-schet` (ширины 240/480, у
  секундомера 280/560; бюджет 100 КБ на файл, как у картинок «Ключевых
  методов» №4 и №5; проверка альфы без каймы).
- В вёрстке — через `lib/ustnyySchet/kartinki.ts`: адреса с версией из
  таблицы иллюстраций (`ILLYUSTRACII_ASSET_VERSIONS`), в первую загрузку
  страниц она не попадает.

## Проверка каждой картинки

1. Фон прозрачный: по краям холста нет пикселей с альфой выше 8 (две
   крайние строки и столбца с каждой стороны).
2. Нет букв и цифр; знаки — только там, где их просит сцена.
3. Сцена соответствует описанию.
4. Серия: все на общей ленте на светлом и тёмном фоне — свет, масштаб,
   толщина стекла одинаковые.

## Журнал

| Имя | Сцена | Попыток |
| --- | --- | --- |
| `shapka-sekundomer` | a glass stopwatch with a blank dial without any marks or numbers and a softly glowing warm orange rim, standing alone. | 2 (№1 — ободок без оранжевого свечения) |
| `znak-plyus` | a single thick 3D glass plus sign, slightly tilted, alone. | 1 |
| `znak-minus` | a single thick 3D glass minus sign, slightly tilted, alone. | 1 |
| `znak-umnozhit` | a single thick 3D glass multiplication cross, slightly tilted, alone. | 1 |
| `znak-delit` | a single thick 3D glass division sign (a bar with one dot above and one dot below), slightly tilted, alone. | 1 |
| `gruppa-kvadraty` | a flat glass square tile divided into a 3 by 3 grid with a glass cube standing on its corner cell, one cell glowing warm orange. | 1 |
| `gruppa-umnozhenie` | a thick glass multiplication cross standing upright on a small round glass base, a warm orange glow in its centre. | 1 |
| `gruppa-delenie` | a thick glass division sign standing upright on a small round glass base, the two dots glowing warm orange. | 1 |
| `gruppa-slozhenie` | a thick glass plus sign and a thick glass minus sign standing side by side like tiles, the plus glowing slightly orange. | 1 |
| `gruppa-doli` | a thick glass percent sign standing next to a small glass pie with one quarter glowing warm orange. | 1 |
| `gruppa-uravneniya` | glass balance scales in perfect equilibrium, on each pan one glowing glass sphere, the left one warm orange and the right one blue. | 3 — лимит; взята №1 + чистка дымки (ниже) |
| `vieta` | a smooth glass parabola-shaped arch standing on a thin glass baseline, touching the baseline at exactly two points, each marked by a small glowing sphere, one warm orange and one blue. | 3 (№1, №2 — чаша касается прямой у дна; взята №3) |
| `tablica` | a glass board with a 10 by 10 grid of small raised glass cells, the main diagonal of cells glowing softly warm orange. | 1 |
| `reyting` | a glass podium with three steps, the top step glowing warm orange. | 1 |

### Замечания

- `vieta`: во всех трёх попытках «арка» вышла параболой ветвями вверх,
  пересекающей прямую в двух точках со сферами — оранжевой и синей. По
  смыслу это и есть график `x² + bx + c` с двумя корнями; взята №3
  (сферы лучше различимы).
- `gruppa-uravneniya`: во всех трёх попытках вокруг весов светящаяся
  дымка до краёв холста (альфа до 34). Лимит попыток исчерпан, взята №1
  и дымка снята: альфа гасится плавно дальше 10–22 px от «тела» рисунка
  (альфа > 90) — `node scripts/ochistit-dymku.mjs`. После чистки край холста
  прозрачный, проверка альфы `build-shapka` проходит.
- `shapka-sekundomer`: в обеих попытках у циферблата стрелка — меток и
  цифр нет, как просит сцена; оранжевый ободок дорисовывает SVG в шапке.
