/**
 * Стеклянные картинки страницы «Как пользоваться сайтом».
 *
 *   node scripts/build-kak-polzovatsya-kartinki.mjs generate [имя…]
 *       — нарисовать через OpenAI (images/edits) и положить исходник PNG
 *         в design-reference/kak-polzovatsya/<имя>.png. Ключа в скрипте
 *         нет: запросы к api.openai.com уходят без Authorization, ключ
 *         подставляет прокси окружения (network secret).
 *   node scripts/build-kak-polzovatsya-kartinki.mjs export
 *       — из исходников: обрезка по контуру, объект ~84 % квадрата по
 *         центру, WebP нужных размеров в public/images/kak-polzovatsya/.
 *   node scripts/build-kak-polzovatsya-kartinki.mjs lenta
 *       — лента всех картинок на светлом и тёмном фоне (для PR).
 *
 * Проверка прозрачности — автоматическая (по краю квадрата нет
 * непрозрачных пикселей); букв, цифр и соответствия сцене — глазами,
 * по ленте. Неудачную перерисовать: generate <имя>, не больше 3 попыток.
 * Журнал запросов и попыток — docs/plans/kak-polzovatsya-kartinki.md.
 */
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

const APP = path.join(import.meta.dirname, '..');
const ROOT = path.join(APP, '..');
const ISHODNIKI = path.join(ROOT, 'design-reference', 'kak-polzovatsya');
const VYHOD = path.join(APP, 'public', 'images', 'kak-polzovatsya');

/** Образцы стиля: шапки и картинки разделов той же серии. */
const OBRAZCY = [
  'public/images/zadanie-04/shapka-veroyatnost-prostaya.webp',
  'public/images/zadaniya/3/kub-shar-560.webp',
  'public/images/shapki/zadanie-05-560.webp',
];

export const STIL =
  'Use the reference images ONLY as a style reference (material, lighting, palette, render quality) — do not copy their objects. Create a NEW 3D render in exactly the same style: clear pale icy-blue glass with soft refraction and smooth bevels, crisp bright edges with a soft blue glow, subtle warm amber rim highlights on a few edges, soft studio light from the top left, gentle inner glow, premium minimal product-render look, not cartoonish. Fully transparent background: no backdrop, no floor, no ground shadow, no frame. No text, no letters, no numbers, no logos, no symbols. Single composition centered, filling about 80% of the square, three-quarter view from slightly above. Scene: ';

export const STSENY = {
  shapka:
    'a glass compass with a softly glowing needle lying on an open glass book, and a small glass signpost with three blank arrow plates beside them.',
  bank: 'a neat fan of glass cards standing like a catalogue, one card in the middle glowing warm orange.',
  teoriya: 'an open glass book with a softly glowing lightbulb hovering above its pages.',
  opornye: 'a round glass target with one realistic orange dart in the very centre.',
  trenazher:
    'a glass dumbbell and above it a small glass speech bubble with a glowing lightbulb inside.',
  progress:
    'a thick glass ring like a progress indicator, about two thirds of it glowing warm orange, with a small glass flag on top.',
  generator:
    'two interlocking glass gears with three blank sheets of paper fanning out from between them.',
  listy:
    'two blank glass sheets of paper overlapping, the front one with a large glowing orange check mark.',
  uroki:
    'a glass clipboard with three blank lines, a glowing orange check mark next to each line, and a glass pencil.',
  pechat: 'a compact glass printer with a blank sheet of paper coming out of it.',
  start: 'a glass paper plane taking off with a soft glowing trail behind it.',
};

/** Какие размеры у какой картинки. */
const RAZMERY = {
  shapka: [560, 280],
  bank: [192, 96],
  teoriya: [192, 96, 360, 180],
  opornye: [192, 96, 360, 180],
  trenazher: [192, 96, 360, 180],
  generator: [192, 96, 360, 180],
  pechat: [192, 96],
  progress: [360, 180],
  listy: [360, 180],
  uroki: [360, 180],
  start: [360, 180],
};

const MODEL = process.env.HOWTO_IMAGE_MODEL ?? 'gpt-image-2.6-sunburst';
/** Объект занимает ~84 % стороны квадрата. */
const DOLYA = 0.84;
const POROG_ALFY = 16;

async function obrazecPng(p) {
  return sharp(path.join(APP, p)).png().toBuffer();
}

async function narisovat(imya) {
  const form = new FormData();
  form.set('model', MODEL);
  form.set('prompt', STIL + STSENY[imya]);
  form.set('size', '1024x1024');
  form.set('quality', 'high');
  form.set('background', 'transparent');
  form.set('output_format', 'png');
  for (const p of OBRAZCY) {
    form.append('image[]', new Blob([await obrazecPng(p)], { type: 'image/png' }), path.basename(p, '.webp') + '.png');
  }
  const res = await fetch('https://api.openai.com/v1/images/edits', { method: 'POST', body: form });
  const json = await res.json();
  if (!res.ok) throw new Error(`${imya}: ${res.status} ${JSON.stringify(json.error ?? json)}`);
  return Buffer.from(json.data[0].b64_json, 'base64');
}

/** По краю квадрата (полоса 4 px) нет непрозрачных пикселей. */
export async function kraiProzrachny(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  const POLOSA = 4;
  let plohih = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x >= POLOSA && x < w - POLOSA && y >= POLOSA && y < h - POLOSA) continue;
      if (data[(y * w + x) * c + 3] > POROG_ALFY) plohih++;
    }
  }
  return plohih === 0;
}

/** Обрезка по контуру и центр в квадрате: объект — DOLYA стороны. */
async function vKvadrat(buf, storona) {
  const trimmed = await sharp(buf).ensureAlpha().trim({ threshold: POROG_ALFY }).toBuffer({ resolveWithObject: true });
  const { width, height } = trimmed.info;
  const k = (storona * DOLYA) / Math.max(width, height);
  const w = Math.max(1, Math.round(width * k));
  const h = Math.max(1, Math.round(height * k));
  const obj = await sharp(trimmed.data).resize(w, h, { kernel: 'lanczos3' }).toBuffer();
  return sharp({
    create: { width: storona, height: storona, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: obj, left: Math.round((storona - w) / 2), top: Math.round((storona - h) / 2) }])
    .png()
    .toBuffer();
}

async function generate(imena) {
  await mkdir(ISHODNIKI, { recursive: true });
  for (const imya of imena) {
    const png = await narisovat(imya);
    const prozr = await kraiProzrachny(png);
    await writeFile(path.join(ISHODNIKI, `${imya}.png`), png);
    console.log(`${imya}: ${prozr ? 'фон прозрачный' : 'ПО КРАЮ ЕСТЬ НЕПРОЗРАЧНОЕ — перерисовать'}`);
  }
}

async function exportAll() {
  await mkdir(VYHOD, { recursive: true });
  for (const [imya, razmery] of Object.entries(RAZMERY)) {
    const src = path.join(ISHODNIKI, `${imya}.png`);
    if (!existsSync(src)) {
      console.log(`${imya}: нет исходника`);
      continue;
    }
    const buf = await readFile(src);
    for (const r of razmery) {
      const kv = await vKvadrat(buf, r);
      await sharp(kv).webp({ quality: 86, alphaQuality: 100, effort: 6 }).toFile(path.join(VYHOD, `${imya}-${r}.webp`));
    }
    console.log(`${imya}: ${razmery.join(', ')}`);
  }
}

async function lenta() {
  const imena = (await readdir(ISHODNIKI)).filter((f) => f.endsWith('.png') && !f.startsWith('lenta'));
  const S = 200;
  const plitki = await Promise.all(imena.map(async (f) => vKvadrat(await readFile(path.join(ISHODNIKI, f)), S)));
  for (const [tema, fon] of [
    ['svetlaya', { r: 244, g: 248, b: 255, alpha: 1 }],
    ['tyomnaya', { r: 14, g: 24, b: 44, alpha: 1 }],
  ]) {
    await sharp({ create: { width: S * plitki.length, height: S, channels: 4, background: fon } })
      .composite(plitki.map((p, i) => ({ input: p, left: i * S, top: 0 })))
      .png()
      .toFile(path.join(ISHODNIKI, `lenta-${tema}.png`));
  }
  console.log(`лента: ${imena.join(', ')}`);
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'generate') await generate(rest.length > 0 ? rest : Object.keys(STSENY));
else if (cmd === 'export') await exportAll();
else if (cmd === 'lenta') await lenta();
else {
  console.log('generate [имя…] | export | lenta');
  process.exitCode = 1;
}
