/**
 * Иконки разделов (подтем) задания: WebP и запасной PNG трёх ширин
 * из исходников 1024px.
 *
 *   node scripts/build-razdely-icons.mjs
 *
 * Исходники лежат вне public (assets/razdely/<задание>/<имя>.webp,
 * без потерь): в сборку уезжают только готовые файлы
 * public/images/razdely/<задание>/<имя>-<ширина>.{webp,png}.
 *
 * Фон у исходников уже прозрачный. После сжатия проверяется альфа:
 * прозрачность сохранилась, по контуру стеклянной плитки нет ни светлой,
 * ни тёмной каймы (scripts/lib/alpha-check.mjs, как у картинок героя).
 */
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';
import { EDGE_BIAS, LEAK_SHARE, compareAlpha, encodeWithinBudget, kb } from './lib/alpha-check.mjs';

const ROOT = path.join(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'assets', 'razdely');
const OUT = path.join(ROOT, 'public', 'images', 'razdely');

/** Ширины для srcset: плитка в меню 64–72px, на экране с плотностью 1–3. */
export const WIDTHS = [96, 192, 384];

/** Бюджет WebP на ширину: на телефоне меню не должно ждать картинок. */
const BUDGET = { 96: 6 * 1024, 192: 16 * 1024, 384: 48 * 1024 };

let failed = false;
let total = { webp: 0, png: 0 };

for (const task of await readdir(SRC)) {
  const dir = path.join(SRC, task);
  const out = path.join(OUT, task);
  await mkdir(out, { recursive: true });

  for (const file of (await readdir(dir)).filter((name) => name.endsWith('.webp')).sort()) {
    const name = file.replace(/\.webp$/, '');
    const source = path.join(dir, file);
    const meta = await sharp(source).metadata();
    console.log(
      `\n${task}/${name} — ${meta.width}×${meta.height}, ${kb((await stat(source)).size)}`,
    );
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
        floor: 60,
      });
      await writeFile(path.join(out, `${name}-${width}.webp`), webp.buffer);

      /* Запасной PNG — с палитрой: плитка почти одноцветная, и палитра
         весит в разы меньше полноцветного. Контур проверяется так же. */
      const png = await sharp(frame)
        .png({ palette: true, quality: 90, effort: 10, compressionLevel: 9 })
        .toBuffer();
      await writeFile(path.join(out, `${name}-${width}.png`), png);

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
          `  ${String(width).padStart(3)} ${ext.padEnd(4)} ${kb(buffer.length).padStart(8)}` +
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
}

console.log(`\nВсего: WebP ${kb(total.webp)}, PNG ${kb(total.png)}`);
if (failed) {
  console.error('Есть замечания — смотрите строки со знаком ✗.');
  process.exit(1);
}
console.log('Готово: бюджеты соблюдены, прозрачность на месте, каймы нет.');
