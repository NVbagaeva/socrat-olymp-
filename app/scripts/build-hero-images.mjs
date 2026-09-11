/**
 * Готовит AVIF и WebP для изображений героя из исходных PNG.
 *
 *   node scripts/build-hero-images.mjs
 *
 * Качество подбирается вниз, пока файл не уложится в бюджет.
 * После конвертации проверяется альфа-канал: прозрачность должна
 * сохраниться, а по контуру не должно появиться светлой или тёмной каймы.
 */
import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';
import { EDGE_BIAS, LEAK_SHARE, compareAlpha, encodeWithinBudget, kb } from './lib/alpha-check.mjs';

const ROOT = path.join(import.meta.dirname, '..');
/** Исходники лежат вне public: в сборку уезжают только готовые файлы. */
const SRC = path.join(ROOT, 'assets', 'hero');
const OUT = path.join(ROOT, 'public', 'hero');

/**
 * Натуральные размеры исходников и подготовка кадра.
 *
 * У десктопного объект стоит справа, слева 805px пустоты. Первый экран
 * ставит его слева, поэтому кадр отражается по горизонтали и обрезается
 * по границе прозрачности: тогда срез у стыка колонок приходится
 * на прозрачную кромку, а каустика не выглядит обрубленной.
 */
const SOURCES = [
  {
    name: 'hero-desktop',
    width: 1672,
    height: 941,
    flop: true,
    crop: { left: 800, top: 0, width: 872, height: 941 },
  },
  {
    name: 'hero-mobile',
    width: 1122,
    height: 1402,
    /* Снизу 499px пустоты — треть кадра. Она отодвигает заголовок
       за нижнюю кромку экрана, поэтому срезается с запасом под объектом.
       Ширина не меняется: предел показа 561px остаётся половиной от 1122. */
    crop: { left: 0, top: 0, width: 1122, height: 946 },
  },
];

const TARGETS = [
  { ext: 'avif', budget: 120 * 1024, start: 70, floor: 40 },
  { ext: 'webp', budget: 200 * 1024, start: 85, floor: 55 },
];

let failed = false;

await mkdir(OUT, { recursive: true });

for (const source of SOURCES) {
  const png = path.join(SRC, `${source.name}.png`);
  let meta;
  try {
    meta = await sharp(png).metadata();
  } catch {
    console.error(`✗ ${source.name}.png не найден в assets/hero/`);
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

  // Готовый кадр: отражение и обрезка, если они заданы для исходника.
  let prepared = sharp(png);
  if (source.crop) prepared = prepared.extract(source.crop);
  if (source.flop) prepared = prepared.flop();
  const input = await prepared.png({ compressionLevel: 9, effort: 10 }).toBuffer();
  const prep = await sharp(input).metadata();

  if (source.crop || source.flop) {
    console.log(
      `  кадр подготовлен: ${source.flop ? 'отражён, ' : ''}` +
        `обрезан до ${prep.width}×${prep.height}`,
    );
  }

  // PNG остаётся запасным вариантом. effort: 10 слегка квантует цвет,
  // зато весит впятеро меньше строго обратимого; отклонение измеряем.
  const fallback = await sharp(input).png({ compressionLevel: 9, effort: 10 }).toBuffer();
  await writeFile(path.join(OUT, `${source.name}.png`), fallback);
  const pngCheck = await compareAlpha(input, fallback);
  console.log(
    `  PNG  запасной ${kb(fallback.length).padStart(9)}` +
      ` — отклонение от кадра: смещение ${pngCheck.bias >= 0 ? '+' : ''}${pngCheck.bias.toFixed(2)},` +
      ` разброс ${pngCheck.spread.toFixed(2)} из 255`,
  );
  if (pngCheck.leakShare > LEAK_SHARE || Math.abs(pngCheck.bias) > EDGE_BIAS) {
    console.error('       ✗ запасной PNG искажает контур');
    failed = true;
  }

  for (const target of TARGETS) {
    const { buffer, quality, withinBudget } = await encodeWithinBudget(input, target);
    await writeFile(path.join(OUT, `${source.name}.${target.ext}`), buffer);

    const check = await compareAlpha(input, buffer);
    const clean = check.leakShare <= LEAK_SHARE && Math.abs(check.bias) <= EDGE_BIAS;

    console.log(
      `  ${target.ext.toUpperCase().padEnd(4)} q=${quality} ${kb(buffer.length).padStart(9)}` +
        ` (бюджет ${kb(target.budget)})${withinBudget ? '' : '  ✗ НЕ УЛОЖИЛСЯ'}`,
    );
    console.log(
      `       прозрачных ${check.transparent}, протекло ${check.leaked}` +
        ` (${(check.leakShare * 100).toFixed(4)}%, макс. альфа ${check.maxLeak})`,
    );
    const halo = check.bias > 0 ? 'светлее' : 'темнее';
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
