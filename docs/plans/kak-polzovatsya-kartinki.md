# Картинки страницы «Как пользоваться сайтом» — журнал

Скрипт: `app/scripts/build-kak-polzovatsya-kartinki.mjs` (`pnpm build:kak-polzovatsya generate|export|lenta`).
Модель — `gpt-image-2.6-sunburst`, эндпоинт `/v1/images/edits`; образцы стиля в `image[]`:
`zadanie-04/shapka-veroyatnost-prostaya.webp`, `zadaniya/3/kub-shar-560.webp`, `shapki/zadanie-05-560.webp` (в PNG).
Параметры: 1024×1024, quality high, background transparent, output_format png.

## Состояние

**Картинки ещё не нарисованы.** Ключ api.openai.com, сохранённый в окружении сессии 2026-11-24,
OpenAI отклоняет (401 «Incorrect API key»), поэтому попыток генерации не было. Страница
показывает только те картинки, что есть в сборке (`HOWTO_ASSET_VERSIONS`): без них шаги
показывают номер вместо значка, карточки и шапка — без картинок. Когда ключ заработает:

```bash
cd app
pnpm build:kak-polzovatsya generate   # исходники в design-reference/kak-polzovatsya/
pnpm build:kak-polzovatsya lenta      # лента на светлом и тёмном фоне — проверить глазами
pnpm build:kak-polzovatsya export     # WebP в public/images/kak-polzovatsya/
```

Проверка каждой: фон прозрачный (скрипт смотрит край квадрата), нет букв и цифр, сцена
совпадает. Неудачную — `generate <имя>`, не больше 3 попыток; число попыток записать ниже.

## Запрос

Стиль (общий): 

> Use the reference images ONLY as a style reference (material, lighting, palette, render quality) — do not copy their objects. Create a NEW 3D render in exactly the same style: clear pale icy-blue glass with soft refraction and smooth bevels, crisp bright edges with a soft blue glow, subtle warm amber rim highlights on a few edges, soft studio light from the top left, gentle inner glow, premium minimal product-render look, not cartoonish. Fully transparent background: no backdrop, no floor, no ground shadow, no frame. No text, no letters, no numbers, no logos, no symbols. Single composition centered, filling about 80% of the square, three-quarter view from slightly above. Scene: 

| Имя | Сцена | Размеры | Попыток |
|---|---|---|---|
| shapka | a glass compass with a softly glowing needle lying on an open glass book, and a small glass signpost with three blank arrow plates beside them. | 560, 280 | 0 (ключ отклонён) |
| bank | a neat fan of glass cards standing like a catalogue, one card in the middle glowing warm orange. | 192, 96 | 0 (ключ отклонён) |
| teoriya | an open glass book with a softly glowing lightbulb hovering above its pages. | 192, 96, 360, 180 | 0 (ключ отклонён) |
| opornye | a round glass target with one realistic orange dart in the very centre. | 192, 96, 360, 180 | 0 (ключ отклонён) |
| trenazher | a glass dumbbell and above it a small glass speech bubble with a glowing lightbulb inside. | 192, 96, 360, 180 | 0 (ключ отклонён) |
| progress | a thick glass ring like a progress indicator, about two thirds of it glowing warm orange, with a small glass flag on top. | 360, 180 | 0 (ключ отклонён) |
| generator | two interlocking glass gears with three blank sheets of paper fanning out from between them. | 192, 96, 360, 180 | 0 (ключ отклонён) |
| listy | two blank glass sheets of paper overlapping, the front one with a large glowing orange check mark. | 360, 180 | 0 (ключ отклонён) |
| uroki | a glass clipboard with three blank lines, a glowing orange check mark next to each line, and a glass pencil. | 360, 180 | 0 (ключ отклонён) |
| pechat | a compact glass printer with a blank sheet of paper coming out of it. | 192, 96 | 0 (ключ отклонён) |
| start | a glass paper plane taking off with a soft glowing trail behind it. | 360, 180 | 0 (ключ отклонён) |
