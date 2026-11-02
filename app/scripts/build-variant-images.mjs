/**
 * Иллюстрация «три стеклянных листа» для шапки «Собрать вариант»:
 * AVIF и WebP в двух ширинах (360 и 720 px) и запасной PNG 720.
 *
 *   node scripts/build-variant-images.mjs
 *
 * Исходник — assets/variant/tri-lista.png (1448×1086, прозрачный фон).
 * Качество подбирается вниз, пока файл не уложится в бюджет; после
 * конвертации сверяется альфа-канал — по контуру не должно появиться
 * каймы (та же проверка, что у кристалла героя, lib/alpha-check.mjs).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';
import { EDGE_BIAS, LEAK_SHARE, compareAlpha, encodeWithinBudget, kb } from './lib/alpha-check.mjs';

const ROOT = path.join(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'assets', 'variant', 'tri-lista.png');
const OUT = path.join(ROOT, 'public', 'variant');
const WIDTHS = [360, 720];
const TARGETS = [
  { ext: 'avif', budget: 40 * 1024, start: 70, floor: 40 },
  { ext: 'webp', budget: 70 * 1024, start: 85, floor: 55 },
];

let failed = false;
await mkdir(OUT, { recursive: true });

const meta = await sharp(SRC).metadata();
console.log(`tri-lista.png — ${meta.width}×${meta.height}`);
if (meta.width !== 1448 || meta.height !== 1086 || !meta.hasAlpha) {
  console.error('  ✗ ожидался PNG 1448×1086 с альфа-каналом');
  process.exit(1);
}

for (const width of WIDTHS) {
  const input = await sharp(SRC).resize({ width }).png({ compressionLevel: 9 }).toBuffer();
  const name = `tri-lista-${width}`;
  if (width === 720) {
    const png = await sharp(input).png({ compressionLevel: 9, effort: 10 }).toBuffer();
    await writeFile(path.join(OUT, `${name}.png`), png);
    console.log(`  ${name}.png ${kb(png.length)}`);
  }
  for (const target of TARGETS) {
    const { buffer, quality } = await encodeWithinBudget(input, target);
    await writeFile(path.join(OUT, `${name}.${target.ext}`), buffer);
    const check = await compareAlpha(input, buffer);
    const clean = check.leakShare <= LEAK_SHARE && Math.abs(check.bias) <= EDGE_BIAS;
    console.log(
      `  ${name}.${target.ext} ${kb(buffer.length)} (q ${quality})` +
        ` — контур: смещение ${check.bias.toFixed(2)}, утечка ${(check.leakShare * 100).toFixed(3)} %` +
        (clean ? '' : ' ✗'),
    );
    if (!clean) failed = true;
  }
}

process.exit(failed ? 1 : 0);
