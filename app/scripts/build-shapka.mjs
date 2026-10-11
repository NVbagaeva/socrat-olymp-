/**
 * Иллюстрации шапок разделов: обрезка по рисунку, WebP и запасной PNG
 * четырёх ширин из исходника.
 *
 *   node scripts/build-shapka.mjs
 *
 * Исходник лежит вне public: assets/zadanie-NN/<имя>.png (прозрачный
 * фон). В сборку уезжают только готовые файлы
 * public/images/zadanie-NN/<имя>-<ширина>.{webp,png} — та же папка, что
 * у картинки шапки №4.
 *
 * 1. Пустые прозрачные поля срезаются по границе рисунка (альфа выше
 *    порога), вокруг остаётся запас 2% его размера; где рисунок подходит
 *    к краю холста ближе запаса, холст достраивается прозрачным.
 * 2. Качество WebP подбирается вниз, пока файл не уложится в бюджет.
 * 3. После сжатия проверяется альфа: прозрачность сохранилась и по
 *    контуру нет ни светлой, ни тёмной каймы (scripts/lib/alpha-check.mjs,
 *    как у картинки шапки №12 и иконок разделов).
 *
 * Размеры обрезанного кадра печатаются в конце: их же ставит разметка
 * (width и height у img), чтобы место держалось до загрузки.
 */
import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';
import { EDGE_BIAS, LEAK_SHARE, compareAlpha, encodeWithinBudget, kb } from './lib/alpha-check.mjs';

const ROOT = path.join(import.meta.dirname, '..');

/** Шапки: исходник в assets, файлы в public/images. */
const SHAPKI = [{ papka: 'zadanie-01', imya: 'shapka-planimetriya' }];

/** Ширины для srcset: телефон 1x, планшет и компьютер 1x и 2x. */
const WIDTHS = [480, 768, 1200, 1536];
/** Бюджет WebP на ширину. */
const BUDGET = { 480: 60 * 1024, 768: 110 * 1024, 1200: 200 * 1024, 1536: 300 * 1024 };
/** Граница рисунка: альфа выше этого — уже рисунок, а не пустое поле. */
const POROG_ALFY = 16;
/** Запас вокруг рисунка — доля его ширины и высоты. */
const ZAPAS = 0.02;

/** Рамка рисунка по альфе: { left, top, width, height }. */
async function ramkaRisunka(source) {
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let x0 = info.width;
  let y0 = info.height;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      if (data[(y * info.width + x) * 4 + 3] > POROG_ALFY) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1, holst: info };
}

/** Кадр: рисунок с запасом, недостающее поле — прозрачное. */
async function kadr(source) {
  const r = await ramkaRisunka(source);
  const dx = Math.round(r.width * ZAPAS);
  const dy = Math.round(r.height * ZAPAS);
  const left = r.left - dx;
  const top = r.top - dy;
  const width = r.width + 2 * dx;
  const height = r.height + 2 * dy;
  /* Срез в пределах холста и добивка прозрачным там, где не хватило. */
  const cut = {
    left: Math.max(0, left),
    top: Math.max(0, top),
    width: Math.min(r.holst.width, left + width) - Math.max(0, left),
    height: Math.min(r.holst.height, top + height) - Math.max(0, top),
  };
  const buffer = await sharp(source)
    .extract(cut)
    .extend({
      left: cut.left - left,
      top: cut.top - top,
      right: left + width - (cut.left + cut.width),
      bottom: top + height - (cut.top + cut.height),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  return { buffer, width, height, ramka: r };
}

let failed = false;

for (const { papka, imya } of SHAPKI) {
  const source = path.join(ROOT, 'assets', papka, `${imya}.png`);
  const out = path.join(ROOT, 'public', 'images', papka);
  await mkdir(out, { recursive: true });
  const meta = await sharp(source).metadata();
  console.log(
    `\n${papka}/${imya}.png — ${meta.width}×${meta.height}, ${kb((await stat(source)).size)}`,
  );
  if (!meta.hasAlpha) {
    console.error('  ✗ в исходнике нет альфа-канала');
    failed = true;
    continue;
  }
  const k = await kadr(source);
  const r = k.ramka;
  console.log(
    `  рисунок: x ${r.left}…${r.left + r.width - 1}, y ${r.top}…${r.top + r.height - 1};` +
      ` кадр с запасом ${Math.round(ZAPAS * 100)}%: ${k.width}×${k.height}`,
  );
  const total = { webp: 0, png: 0 };

  for (const width of WIDTHS) {
    /* Уменьшенный кадр без потерь — эталон, с которым сравниваем. */
    const frame = await sharp(k.buffer).resize({ width }).png().toBuffer();

    const webp = await encodeWithinBudget(frame, {
      ext: 'webp',
      budget: BUDGET[width],
      start: 85,
      floor: 45,
    });
    await writeFile(path.join(out, `${imya}-${width}.webp`), webp.buffer);

    /* Запасной PNG с палитрой: стеклянная композиция плавная, палитра
       весит в разы меньше полноцветного. Контур проверяется так же. */
    const png = await sharp(frame)
      .png({ palette: true, quality: 90, effort: 10, compressionLevel: 9 })
      .toBuffer();
    await writeFile(path.join(out, `${imya}-${width}.png`), png);

    total.webp += webp.buffer.length;
    total.png += png.length;

    for (const [ext, buffer] of [
      ['webp', webp.buffer],
      ['png', png],
    ]) {
      const check = await compareAlpha(frame, buffer);
      const clean = check.leakShare <= LEAK_SHARE && Math.abs(check.bias) <= EDGE_BIAS;
      const over = ext === 'webp' && !webp.withinBudget;
      console.log(
        `  ${String(width).padStart(4)} ${ext.padEnd(4)} ${kb(buffer.length).padStart(9)}` +
          (ext === 'webp' ? ` q=${webp.quality}` : '     ') +
          `  контур: смещение ${check.bias >= 0 ? '+' : ''}${check.bias.toFixed(2)},` +
          ` протекло ${check.leaked}` +
          (clean ? ' — каймы нет' : ' — ✗ КАЙМА') +
          (over ? `  ✗ больше бюджета ${kb(BUDGET[width])}` : ''),
      );
      if (!clean || over) failed = true;
    }
  }
  console.log(`  всего: WebP ${kb(total.webp)}, PNG ${kb(total.png)}`);
  console.log(`  в разметку: width=${k.width} height=${k.height}`);
}

if (failed) {
  console.error('Есть замечания — смотрите строки со знаком ✗.');
  process.exit(1);
}
console.log('\nГотово: бюджеты соблюдены, прозрачность на месте, каймы нет.');
