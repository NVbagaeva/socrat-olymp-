/**
 * Картинки вводной карточки вкладки «Ключевые схемы» №18: AVIF и WebP
 * двух ширин из исходных PNG.
 *
 *   node scripts/build-vvodnaya-18.mjs
 *
 * Исходники лежат вне public: assets/zadanie18/vvodnaya/<имя>.png
 * (прозрачный фон). В сборку уезжают только готовые файлы
 * public/images/zadaniya/18/vvodnaya/<имя>-<ширина>.{avif,webp}.
 * Ширины и натуральные размеры повторены в
 * components/zadanie18/Vvodnaya18.tsx (KARTINKI) — поменял здесь,
 * поменяй и там.
 *
 * Качество подбирается так, чтобы альфа осталась цела — прозрачность
 * сохранилась и по контуру нет каймы (scripts/lib/alpha-check.mjs), —
 * и файл уложился в бюджет (см. podobrat).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';
import { EDGE_BIAS, LEAK_SHARE, compareAlpha, encode, kb } from './lib/alpha-check.mjs';

const ROOT = path.join(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'assets', 'zadanie18', 'vvodnaya');
const OUT = path.join(ROOT, 'public', 'images', 'zadaniya', '18', 'vvodnaya');

/* Главная: на телефоне не выше 160px (≈163px шириной), на планшете
   ≈150px, на компьютере 210px шириной; мини-карточки — до ≈340px.
   Ширины — 1x и 2x. Кадр главной отцентрирован по самой фигуре, запас
   под свечение симметричен — не обрезать. */
const KARTINKI = [
  { name: 'treugolnik-centr', width: 1220, height: 1200, widths: [220, 440] },
  { name: 'stomatolog', width: 934, height: 560, widths: [360, 720] },
  { name: 'payalnik', width: 1042, height: 508, widths: [360, 720] },
];
/** Бюджет на файл по ширине кадра: 1x — до 40 КБ, 2x — до 110 КБ. */
const budget = (width) => (width <= 360 ? 40 : 110) * 1024;
/** Качество: сверху вниз шагом 5, ниже floor не опускаемся. */
const KACHESTVO = { avif: { start: 90, floor: 60 }, webp: { start: 85, floor: 60 } };

const chisto = (check) => check.leakShare <= LEAK_SHARE && Math.abs(check.bias) <= EDGE_BIAS;

/**
 * WebP: самое высокое качество, которое влезает в бюджет (альфу WebP
 * хранит без потерь). AVIF: самое низкое, при котором контур ещё
 * чистый, — у этих картинок мягкие ореолы, и AVIF на среднем качестве
 * даёт альфу там, где её не было; идём вниз, пока проверка проходит.
 */
async function podobrat(frame, ext, limit) {
  let best = null;
  for (let q = KACHESTVO[ext].start; q >= KACHESTVO[ext].floor; q -= 5) {
    const buffer = await encode(frame, ext, q);
    const check = await compareAlpha(frame, buffer);
    if (!chisto(check)) break;
    best = { buffer, quality: q, check };
    if (ext === 'webp' && buffer.length <= limit) break;
  }
  return best;
}

let failed = false;
await mkdir(OUT, { recursive: true });

for (const k of KARTINKI) {
  const source = path.join(SRC, `${k.name}.png`);
  const meta = await sharp(source).metadata();
  console.log(`\n${k.name}.png — ${meta.width}×${meta.height}`);
  if (meta.width !== k.width || meta.height !== k.height) {
    console.error(`  ✗ ожидались размеры ${k.width}×${k.height}`);
    failed = true;
  }
  if (!meta.hasAlpha) {
    console.error('  ✗ в исходнике нет альфа-канала');
    failed = true;
    continue;
  }
  for (const width of k.widths) {
    const frame = await sharp(source).resize({ width }).png().toBuffer();
    for (const ext of ['avif', 'webp']) {
      const out = await podobrat(frame, ext, budget(width));
      if (out === null) {
        console.error(`  ✗ ${width}.${ext}: контур нечистый даже на q${KACHESTVO[ext].start}`);
        failed = true;
        continue;
      }
      await writeFile(path.join(OUT, `${k.name}-${width}.${ext}`), out.buffer);
      const { check } = out;
      const ok = out.buffer.length <= budget(width);
      console.log(
        `  ${ok ? '✓' : '✗'} ${width}.${ext}: ${kb(out.buffer.length)}, q${out.quality}, ` +
          `кайма ${check.bias.toFixed(2)}, утечка альфы ${(check.leakShare * 100).toFixed(3)} %`,
      );
      if (!ok) failed = true;
    }
  }
}

/* Миниатюры для превью строки «Почему нужны и знания, и инструменты»:
   квадратный узнаваемый фрагмент (кресло с лампой, паяльник с «?»),
   круг рисует CSS; 36 и 72px. Бюджет — 8 КБ на файл: превью видно
   сразу, грузиться должно мгновенно. */
const MINI = {
  stomatolog: { left: 60, top: 120, width: 440, height: 440 },
  payalnik: { left: 70, top: 20, width: 470, height: 470 },
};
const MINI_BUDGET = 8 * 1024;
for (const [name, kadr] of Object.entries(MINI)) {
  console.log(`\n${name}.png → миниатюры`);
  for (const size of [36, 72]) {
    /* extract и resize в одной цепочке sharp выполняет в своём порядке —
       сначала вырезаем, потом уменьшаем отдельным проходом. */
    const vyrez = await sharp(path.join(SRC, `${name}.png`))
      .extract(kadr)
      .png()
      .toBuffer();
    const frame = await sharp(vyrez).resize({ width: size, height: size }).png().toBuffer();
    for (const ext of ['avif', 'webp']) {
      const out = await podobrat(frame, ext, MINI_BUDGET);
      if (out === null) {
        console.error(`  ✗ mini-${size}.${ext}: контур нечистый`);
        failed = true;
        continue;
      }
      await writeFile(path.join(OUT, `${name}-mini-${size}.${ext}`), out.buffer);
      const ok = out.buffer.length <= MINI_BUDGET;
      console.log(
        `  ${ok ? '✓' : '✗'} mini-${size}.${ext}: ${kb(out.buffer.length)}, q${out.quality}`,
      );
      if (!ok) failed = true;
    }
  }
}

if (failed) {
  console.error('\nЕсть ошибки — см. ✗ выше.');
  process.exit(1);
}
