/**
 * Иллюстрации верхнего блока страниц заданий: WebP и запасной PNG трёх
 * ширин из исходников.
 *
 *   node scripts/build-zadanie-hero.mjs
 *
 * Исходник лежит вне public: assets/zadaniya/<задание>/hero.png (1536×1024,
 * прозрачный фон). В сборку уезжают только готовые файлы
 * public/images/zadaniya/<задание>/hero-<ширина>.{webp,png}.
 *
 * Качество WebP подбирается вниз, пока файл не уложится в бюджет. После
 * сжатия проверяется альфа: прозрачность сохранилась и по контуру нет ни
 * светлой, ни тёмной каймы (scripts/lib/alpha-check.mjs, как у картинок
 * героя и иконок разделов).
 */
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';
import { EDGE_BIAS, LEAK_SHARE, compareAlpha, encodeWithinBudget, kb } from './lib/alpha-check.mjs';

const ROOT = path.join(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'assets', 'zadaniya');
const OUT = path.join(ROOT, 'public', 'images', 'zadaniya');

/** Ширины для srcset: телефон 1x и 2x, компьютер 1x и 2x. */
const WIDTHS = [480, 768, 1152];
/** Бюджет WebP на ширину. Версия на телефон (480) — не больше 60 КБ. */
const BUDGET = { 480: 60 * 1024, 768: 110 * 1024, 1152: 200 * 1024 };
/** Натуральные размеры исходника: пропорции в разметке берутся отсюда. */
const SOURCE = { width: 1536, height: 1024 };

let failed = false;
const total = { webp: 0, png: 0 };

for (const task of await readdir(SRC)) {
  const source = path.join(SRC, task, 'hero.png');
  const out = path.join(OUT, task);
  await mkdir(out, { recursive: true });
  const meta = await sharp(source).metadata();
  console.log(
    `\n${task}/hero.png — ${meta.width}×${meta.height}, ${kb((await stat(source)).size)}`,
  );
  if (meta.width !== SOURCE.width || meta.height !== SOURCE.height) {
    console.error(`  ✗ ожидались размеры ${SOURCE.width}×${SOURCE.height}`);
    failed = true;
  }
  if (!meta.hasAlpha) {
    console.error('  ✗ в исходнике нет альфа-канала');
    failed = true;
    continue;
  }

  for (const width of WIDTHS) {
    /* Уменьшенный кадр без потерь — эталон, с которым сравниваем. */
    const frame = await sharp(source).resize({ width }).png().toBuffer();

    const webp = await encodeWithinBudget(frame, {
      ext: 'webp',
      budget: BUDGET[width],
      start: 85,
      floor: 45,
    });
    await writeFile(path.join(out, `hero-${width}.webp`), webp.buffer);

    /* Запасной PNG с палитрой: стеклянная композиция плавная, палитра
       весит в разы меньше полноцветного. Контур проверяется так же. */
    const png = await sharp(frame)
      .png({ palette: true, quality: 90, effort: 10, compressionLevel: 9 })
      .toBuffer();
    await writeFile(path.join(out, `hero-${width}.png`), png);

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
}

console.log(`\nВсего: WebP ${kb(total.webp)}, PNG ${kb(total.png)}`);
if (failed) {
  console.error('Есть замечания — смотрите строки со знаком ✗.');
  process.exit(1);
}
console.log('Готово: бюджеты соблюдены, прозрачность на месте, каймы нет.');
