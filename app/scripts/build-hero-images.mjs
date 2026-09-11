/**
 * Готовит AVIF и WebP для изображений героя из исходных PNG.
 *
 *   node scripts/build-hero-images.mjs
 *
 * Качество подбирается вниз, пока файл не уложится в бюджет.
 * После конвертации проверяется альфа-канал: прозрачность должна
 * сохраниться, а по контуру не должно появиться светлой или тёмной каймы.
 */
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';
import { EDGE_BIAS, LEAK_SHARE, compareAlpha, encodeWithinBudget, kb } from './lib/alpha-check.mjs';

const ROOT = path.join(import.meta.dirname, '..');
const DIR = path.join(ROOT, 'public', 'hero');

/** Натуральные размеры исходников. Несовпадение — повод остановиться. */
const SOURCES = [
  { name: 'hero-desktop', width: 1672, height: 941 },
  { name: 'hero-mobile', width: 1122, height: 1402 },
];

const TARGETS = [
  { ext: 'avif', budget: 120 * 1024, start: 70, floor: 40 },
  { ext: 'webp', budget: 200 * 1024, start: 85, floor: 55 },
];

let failed = false;

for (const source of SOURCES) {
  const png = path.join(DIR, `${source.name}.png`);
  let meta;
  try {
    meta = await sharp(png).metadata();
  } catch {
    console.error(`✗ ${source.name}.png не найден в public/hero/`);
    failed = true;
    continue;
  }

  console.log(`\n${source.name}.png — ${meta.width}×${meta.height}, ${kb((await stat(png)).size)}`);

  if (meta.width !== source.width || meta.height !== source.height) {
    console.error(`  ✗ ожидались размеры ${source.width}×${source.height}`);
    failed = true;
  }
  if (!meta.hasAlpha) {
    console.error('  ✗ в исходнике нет альфа-канала');
    failed = true;
    continue;
  }

  const input = await readFile(png);

  for (const target of TARGETS) {
    const { buffer, quality, withinBudget } = await encodeWithinBudget(input, target);
    const out = path.join(DIR, `${source.name}.${target.ext}`);
    await mkdir(DIR, { recursive: true });
    await writeFile(out, buffer);

    const check = await compareAlpha(input, buffer);
    const clean = check.leakShare <= LEAK_SHARE && Math.abs(check.bias) <= EDGE_BIAS;

    console.log(
      `  ${target.ext.toUpperCase().padEnd(4)} q=${quality} ${kb(buffer.length).padStart(9)}` +
        ` (бюджет ${kb(target.budget)})${withinBudget ? '' : '  ✗ НЕ УЛОЖИЛСЯ'}`,
    );
    const halo = check.bias > 0 ? 'светлее' : 'темнее';
    console.log(
      `       прозрачных ${check.transparent}, протекло ${check.leaked}` +
        ` (${(check.leakShare * 100).toFixed(4)}%, макс. альфа ${check.maxLeak})`,
    );
    console.log(
      `       контур: ${check.edge} пикселей, смещение ${check.bias >= 0 ? '+' : ''}` +
        `${check.bias.toFixed(2)} (${halo}), разброс ${check.spread.toFixed(2)}` +
        ` ${clean ? '— каймы нет' : '— ✗ КАЙМА'}`,
    );

    if (!withinBudget || !clean) failed = true;
  }
}

if (failed) {
  console.error('\nЕсть замечания — смотрите строки со знаком ✗.');
  process.exit(1);
}
console.log('\nГотово: бюджеты соблюдены, прозрачность на месте, каймы нет.');
