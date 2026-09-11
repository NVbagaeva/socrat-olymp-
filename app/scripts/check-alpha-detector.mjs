/**
 * Проверка самого детектора каймы: он обязан ловить порчу,
 * а не молча пропускать всё подряд.
 *
 *   node scripts/check-alpha-detector.mjs
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';
import { EDGE_BIAS, LEAK_SHARE, compareAlpha } from './lib/alpha-check.mjs';

const source = path.join(import.meta.dirname, '..', 'public', 'hero', 'hero-desktop.png');
const png = await readFile(source);
const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

const asPng = (pixels) =>
  sharp(Buffer.from(pixels), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();

/** Порча 1: полупрозрачный контур подмешан к белому — светлый ореол. */
const whiteFringe = Buffer.from(data);
for (let i = 0; i < whiteFringe.length; i += 4) {
  const a = whiteFringe[i + 3];
  if (a > 0 && a < 255) {
    for (let c = 0; c < 3; c++)
      whiteFringe[i + c] = Math.round(whiteFringe[i + c] * 0.4 + 255 * 0.6);
  }
}

/** Порча 2: прозрачное залито непрозрачным фоном — альфа потеряна. */
const flattened = Buffer.from(data);
for (let i = 0; i < flattened.length; i += 4) {
  if (flattened[i + 3] === 0) {
    flattened[i] = 255;
    flattened[i + 1] = 255;
    flattened[i + 2] = 255;
    flattened[i + 3] = 255;
  }
}

/** Порча 3: тёмная обводка по контуру. */
const darkFringe = Buffer.from(data);
for (let i = 0; i < darkFringe.length; i += 4) {
  const a = darkFringe[i + 3];
  if (a > 0 && a < 255) {
    for (let c = 0; c < 3; c++) darkFringe[i + c] = Math.round(darkFringe[i + c] * 0.45);
  }
}

const cases = [
  ['чистая копия (ожидается: проходит)', png, true],
  ['светлый ореол по контуру', await asPng(whiteFringe), false],
  ['потеряна прозрачность', await asPng(flattened), false],
  ['тёмная обводка по контуру', await asPng(darkFringe), false],
];

let failed = false;
for (const [name, candidate, shouldPass] of cases) {
  const r = await compareAlpha(png, candidate);
  const passes = r.leakShare <= LEAK_SHARE && Math.abs(r.bias) <= EDGE_BIAS;
  const correct = passes === shouldPass;
  if (!correct) failed = true;
  console.log(
    `${correct ? '  ок  ' : '  ✗    '} ${name.padEnd(38)}` +
      ` протекло ${(r.leakShare * 100).toFixed(2)}%, смещение ${r.bias >= 0 ? '+' : ''}${r.bias.toFixed(2)}` +
      ` → детектор ${passes ? 'пропустил' : 'поймал'}`,
  );
}

if (failed) {
  console.error('\nДетектор ведёт себя не так, как должен.');
  process.exit(1);
}
console.log('\nДетектор различает чистую конвертацию и порчу.');
