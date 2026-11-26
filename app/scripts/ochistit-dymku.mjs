/**
 * Снять светящуюся дымку вокруг стеклянного рисунка: альфа плавно
 * гасится дальше R px от «тела» (альфа выше POROG). Нужен, когда
 * генератор дорисовал ореол до краёв холста и фон перестал быть
 * прозрачным (журнал — docs/plans/ustnyy-schet-kartinki.md).
 *
 *   node scripts/ochistit-dymku.mjs vhod.png vyhod.png
 */
import process from 'node:process';
import sharp from 'sharp';

const POROG = 90;
const R = 10;
const FADE = 12;

const [vhod, vyhod] = process.argv.slice(2);
if (vhod === undefined || vyhod === undefined) {
  console.error('node scripts/ochistit-dymku.mjs vhod.png vyhod.png');
  process.exit(1);
}

const { data, info } = await sharp(vhod).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;
/* Расстояние до ближайшего пикселя «тела» — два прохода (chamfer 1 / √2). */
const d = new Float32Array(W * H).fill(1e9);
for (let i = 0; i < W * H; i += 1) if (data[i * 4 + 3] > POROG) d[i] = 0;
const D = Math.SQRT2;
for (let y = 0; y < H; y += 1) {
  for (let x = 0; x < W; x += 1) {
    const i = y * W + x;
    let v = d[i];
    if (x > 0) v = Math.min(v, d[i - 1] + 1);
    if (y > 0) v = Math.min(v, d[i - W] + 1);
    if (x > 0 && y > 0) v = Math.min(v, d[i - W - 1] + D);
    if (x < W - 1 && y > 0) v = Math.min(v, d[i - W + 1] + D);
    d[i] = v;
  }
}
for (let y = H - 1; y >= 0; y -= 1) {
  for (let x = W - 1; x >= 0; x -= 1) {
    const i = y * W + x;
    let v = d[i];
    if (x < W - 1) v = Math.min(v, d[i + 1] + 1);
    if (y < H - 1) v = Math.min(v, d[i + W] + 1);
    if (x < W - 1 && y < H - 1) v = Math.min(v, d[i + W + 1] + D);
    if (x > 0 && y < H - 1) v = Math.min(v, d[i + W - 1] + D);
    d[i] = v;
  }
}
for (let i = 0; i < W * H; i += 1) {
  const k = d[i] <= R ? 1 : d[i] >= R + FADE ? 0 : 1 - (d[i] - R) / FADE;
  data[i * 4 + 3] = Math.round(data[i * 4 + 3] * k);
}
await sharp(data, { raw: { width: W, height: H, channels: 4 } })
  .png()
  .toFile(vyhod);
console.log(`${vyhod}: дымка снята (порог ${POROG}, радиус ${R}+${FADE} px)`);
