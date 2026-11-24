# Задание №5 — главы ключевых методов: картинки

Журнал стеклянных картинок к разобранным задачам глав теории (20 шт.).

Карточки «Ключевые методы решения» №5 своих новых картинок не получили:
как и у №4 после PR #504, картинка метода — в стеклянной плашке сверху
карточки, и это прежние рисунки из PR #477
(`public/images/zadanie-05/metod-<метод>-*`, `lib/veroyatnost/metody-kartinki.ts`).
Квадратные картинки карточек, сгенерированные в этом PR, удалены.

## Статус

Все картинки сгенерированы 24.11.2026 (первая попытка упёрлась в
нулевой баланс OpenAI; после пополнения — заново, с нуля). Каждая
проверена: края прозрачные (скрипт), нет букв и цифр, сцена совпадает с
описанием и не спорит с задачей (глазами). Отбраковано 2 попытки
`primer-10a`: у одной непрозрачные пиксели по краям, другую (арбалет)
отклонил фильтр безопасности OpenAI.
Обрезка по контуру, объект ~84 % квадрата, по центру.

Перегенерировать одну картинку:

```bash
python3 tools/metody5/gen_images.py <имя>
```

Скрипт проверяет прозрачность краёв (до 3 попыток), кладёт исходник PNG в
`design-reference/zadanie-05/` и WebP — в
`app/public/images/zadanie-05/primery/` (360, 180).
Счётчик попыток — `tools/metody5/zhurnal.json`.

## Параметры

- Модель: `gpt-image-2.6-sunburst`, эндпоинт `/v1/images/edits`.
- `size=1024x1024`, `quality=high`, `background=transparent`,
  `output_format=png`.
- Образцы стиля (`image[]`): шапка №4, «куб и шар» №3, шапка №5.
- Промпт = общий стиль (`STYLE` в `tools/metody5/gen_images.py`) + сцена.

## Картинки: имя → попыток → сцена

| Имя | Попыток | Сцена |
| --- | --- | --- |
| `primer-1a` | 1 | a mighty oak tree made of blue glass with a realistic golden chain wound around its trunk, and an open old book with blank pages lying at its roots. |
| `primer-1b` | 1 | a wooden door made of blue glass standing slightly ajar, a small dovecote made of glass beside it with one realistic white dove on its roof, and a realistic school slate with a piece of chalk leaning against the door. |
| `primer-2a` | 1 | a primitive umbrella made of blue glass with a realistic green parrot perched on its handle, next to a wooden post with notches made of glass. |
| `primer-2b` | 1 | an old leather doctor's bag standing open with a long glass thermometer sticking out of it, and a small blue glass hippopotamus figurine beside the bag. |
| `primer-3a` | 1 | a realistic small golden key lying on an open school exercise book made of blue glass, next to a glass inkwell with a goose quill. |
| `primer-3b` | 1 | a blacksmith's anvil made of blue glass with a realistic iron horseshoe on it, a small hammer leaning against it, and a pair of realistic red embroidered women's slippers next to the anvil. |
| `primer-4a` | 1 | two small glass samovars side by side, several small glass teacups on saucers around them, and one realistic shiny copper coin lying in front of them. |
| `primer-4b` | 1 | a realistic round golden-brown bun lying on a small glass weighing scale with two pans, a glass rolling pin beside the scale. |
| `primer-5a` | 1 | a small picket fence made of blue glass, half of the planks painted realistic white, a realistic bucket of white paint with a brush, and two realistic white dice with dark pips lying in front of the fence. |
| `primer-5b` | 1 | a realistic wide-brimmed musketeer hat with a long white feather lying on a small blue glass tavern table, a blue glass dice cup lying on its side and two realistic white dice with dark pips rolling out of it. |
| `primer-6a` | 1 | a glass chessboard with a few blue glass chess pieces and one realistic dark queen chess piece standing on it, and a tall oval looking-glass mirror made of glass standing behind the board. |
| `primer-6b` | 1 | a longbow made of blue glass lying in front of four small round glass archery targets standing in a row, three realistic arrows with green fletching stuck in three of the targets. |
| `primer-7a` | 1 | three small glass oil lamps in the shape of classic oriental genie lamps, each with a small warm flame, standing on a heap of realistic gold coins and jewels. |
| `primer-7b` | 1 | three pointed old Russian warrior helmets made of blue glass standing in a row, a realistic wooden longbow and three arrows lying in front of them, and a small round glass target with one arrow in it. |
| `primer-8a` | 1 | a wicker basket made of blue glass holding six realistic golden-brown baked pies, and a small realistic clay pot of butter next to the basket. |
| `primer-8b` | 1 | a painter's palette made of blue glass with blobs of realistic paint, several realistic metal paint tubes in blue, red and green lying around it, and a slim brush. |
| `primer-9a` | 1 | a large rough boulder made of blue glass standing at a fork of two paths, a realistic old Russian knight's pointed steel helmet and a straight sword lying in front of the boulder. |
| `primer-9b` | 1 | a realistic painted tin toy soldier with a red coat and a rifle standing on one leg, next to a small blue glass figurine of a ballerina and an open glass toy box. |
| `primer-10a` | 3 | a crossbow made of blue glass and a realistic red apple pierced by a short crossbow bolt lying in front of it. |
| `primer-10b` | 1 | a fishing net made of blue glass threads spread on the ground, an old cracked wooden trough beside it, and a realistic golden fish leaping above the net. |
