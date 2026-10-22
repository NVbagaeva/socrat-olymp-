#!/usr/bin/env node
/* scripts/build-intro-layers.mjs — слои цветка для заставки первого визита.

   Запуск: pnpm build:intro-layers

   Исходники — PNG с прозрачным фоном в docs/mockups/intro/layers/:
     A-cvetok      эталон собранного цветка;
     B-chashechka  чашечка из граней (основание цветка);
     C-vneshnie    внешний ярус лепестков;
     D-vnutrennie  внутренний ярус;
     E-tychinki    тычинки и сердцевина;
     F-oktaedr     октаэдр, G-korona — раскрытая корона (запасные слои).

   Что делает:
     1. Выравнивает B, C, D, E по A: перебирает масштаб и сдвиг и берёт
        тот, при котором больше всего непрозрачных точек слоя совпадает
        с A по цвету (точки, закрытые в A другими слоями, просто не
        совпадают и не мешают). Сначала грубо на 1/16, потом точнее.
     2. F и G ставит по общей точке основания (нижняя вершина) с
        масштабом чашечки B.
     3. Края: полупрозрачные точки получают цвет соседних плотных
        (alpha bleeding) — так на любом фоне нет белой каймы. Считает
        «белёсые» полупрозрачные точки до и после.
     4. Складывает B + C + D + E в разных порядках и сравнивает с A:
        средняя разница цвета и доля совпавших точек. Лучший порядок
        записывает; картинки сравнения — в docs/screenshots/intro/sloi/.
     5. Каждый слой обрезает по своей рамке в системе A и сохраняет
        WebP и PNG для ширин 768 и 1536 (ширина — у всей рамки A) в
        app/public/intro/.
     6. Находит вершины для искр у октаэдра F, короны G и чашечки B:
        острые углы выпуклой оболочки силуэта и самые яркие точки
        (раскалённые золотые вершины — тёплый белый, не голубые блики).
     7. Пишет src/components/onboarding/intro/layers.gen.ts: рамки слоёв,
        порядок, точку основания, сердцевину и вершины. */

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { APP } from './lib/load-ts.mjs';

const SRC = path.join(APP, '..', 'docs', 'mockups', 'intro', 'layers');
const OUT = path.join(APP, 'public', 'intro');
const REPORT = path.join(APP, '..', 'docs', 'screenshots', 'intro', 'sloi');
const GEN = path.join(APP, 'src', 'components', 'onboarding', 'intro', 'layers.gen.ts');
const NAMES = {
  A: 'A-cvetok',
  B: 'B-chashechka',
  C: 'C-vneshnie',
  D: 'D-vnutrennie',
  E: 'E-tychinki',
  F: 'F-oktaedr',
  G: 'G-korona',
};
const WIDTHS = [768, 1536];

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(REPORT, { recursive: true });

/* ── Загрузка ───────────────────────────────────────────────── */

async function load(id, size) {
  const img = sharp(path.join(SRC, NAMES[id] + '.png')).ensureAlpha();
  const { data, info } = await (size ? img.resize(size, size, { kernel: 'lanczos3' }) : img)
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

const N = 1254;
const full = {};
for (const id of Object.keys(NAMES)) {
  full[id] = await load(id);
  if (full[id].w !== N || full[id].h !== N) throw new Error(`${id}: ожидался ${N}×${N}`);
}

/* ── Края: alpha bleeding ───────────────────────────────────── */

function boxBlur(src, w, h, ch, r) {
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  for (let y = 0; y < h; y += 1) {
    for (let c = 0; c < ch; c += 1) {
      let acc = 0;
      for (let x = -r; x <= r; x += 1)
        acc += src[(y * w + Math.min(w - 1, Math.max(0, x))) * ch + c];
      for (let x = 0; x < w; x += 1) {
        tmp[(y * w + x) * ch + c] = acc / (2 * r + 1);
        const xa = Math.min(w - 1, x + r + 1);
        const xr = Math.max(0, x - r);
        acc += src[(y * w + xa) * ch + c] - src[(y * w + xr) * ch + c];
      }
    }
  }
  for (let x = 0; x < w; x += 1) {
    for (let c = 0; c < ch; c += 1) {
      let acc = 0;
      for (let y = -r; y <= r; y += 1)
        acc += tmp[(Math.min(h - 1, Math.max(0, y)) * w + x) * ch + c];
      for (let y = 0; y < h; y += 1) {
        out[(y * w + x) * ch + c] = acc / (2 * r + 1);
        const ya = Math.min(h - 1, y + r + 1);
        const yr = Math.max(0, y - r);
        acc += tmp[(ya * w + x) * ch + c] - tmp[(yr * w + x) * ch + c];
      }
    }
  }
  return out;
}

/** Белёсые полупрозрачные точки: альфа 0,02–0,35 и все каналы > 0,9. */
function fringeCount(img) {
  let n = 0;
  for (let i = 0; i < img.w * img.h; i += 1) {
    const a = img.data[i * 4 + 3] / 255;
    if (
      a > 0.02 &&
      a < 0.35 &&
      Math.min(img.data[i * 4], img.data[i * 4 + 1], img.data[i * 4 + 2]) > 230
    )
      n += 1;
  }
  return n;
}

function defringe(img) {
  const { w, h, data } = img;
  const pm = new Float32Array(w * h * 4);
  for (let i = 0; i < w * h; i += 1) {
    const a = data[i * 4 + 3] / 255;
    pm[i * 4] = (data[i * 4] / 255) * a;
    pm[i * 4 + 1] = (data[i * 4 + 1] / 255) * a;
    pm[i * 4 + 2] = (data[i * 4 + 2] / 255) * a;
    pm[i * 4 + 3] = a;
  }
  const bl = boxBlur(boxBlur(pm, w, h, 4, 2), w, h, 4, 2);
  const out = Buffer.from(data);
  for (let i = 0; i < w * h; i += 1) {
    const a = data[i * 4 + 3] / 255;
    if (a >= 0.6 || bl[i * 4 + 3] < 1e-4) continue;
    const k = 1 - a / 0.6;
    for (let c = 0; c < 3; c += 1) {
      const bleed = (bl[i * 4 + c] / bl[i * 4 + 3]) * 255;
      out[i * 4 + c] = Math.round(data[i * 4 + c] * (1 - k) + bleed * k);
    }
  }
  return { w, h, data: out };
}

const fringe = {};
for (const id of Object.keys(NAMES)) {
  const before = fringeCount(full[id]);
  full[id] = defringe(full[id]);
  fringe[id] = { before, after: fringeCount(full[id]) };
}

/* ── Выравнивание по A ──────────────────────────────────────── */

function small(img, k) {
  const w = Math.floor(img.w / k);
  const out = new Float32Array(w * w * 4);
  for (let y = 0; y < w; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const acc = [0, 0, 0, 0];
      for (let j = 0; j < k; j += 1) {
        for (let i = 0; i < k; i += 1) {
          const p = ((y * k + j) * img.w + x * k + i) * 4;
          const a = img.data[p + 3] / 255;
          acc[0] += (img.data[p] / 255) * a;
          acc[1] += (img.data[p + 1] / 255) * a;
          acc[2] += (img.data[p + 2] / 255) * a;
          acc[3] += a;
        }
      }
      for (let c = 0; c < 4; c += 1) out[(y * w + x) * 4 + c] = acc[c] / (k * k);
    }
  }
  return { w, data: out };
}

/** Доля плотных точек слоя, которые совпали с A по цвету (на чёрном). */
function score(L, A, s, dx, dy, sample) {
  let hit = 0;
  for (const i of sample) {
    const x = i % L.w;
    const y = (i / L.w) | 0;
    const ax = Math.round(x * s + dx);
    const ay = Math.round(y * s + dy);
    if (ax < 0 || ay < 0 || ax >= A.w || ay >= A.w) continue;
    const p = (ay * A.w + ax) * 4;
    const d =
      Math.abs(L.data[i * 4] - A.data[p]) +
      Math.abs(L.data[i * 4 + 1] - A.data[p + 1]) +
      Math.abs(L.data[i * 4 + 2] - A.data[p + 2]);
    if (d < 0.18 && A.data[p + 3] > 0.5) hit += 1;
  }
  return hit / sample.length;
}

function align(id) {
  let best = { s: 1, dx: 0, dy: 0, score: -1 };
  /* Грубо: 1/16. Сдвиги — в точках исходника (1254). */
  for (const [k, sRange, sStep, dRange, dStep, center] of [
    [16, [0.3, 1.35], 0.02, 320, 16, null],
    [4, [-0.03, 0.03], 0.005, 40, 4, 'best'],
    [2, [-0.008, 0.008], 0.002, 8, 2, 'best'],
  ]) {
    const L = small(full[id], k);
    const A = small(full.A, k);
    const sample = [];
    for (let i = 0; i < L.w * L.w; i += 1) if (L.data[i * 4 + 3] > 0.7) sample.push(i);
    const c = center === 'best' ? { ...best } : { s: 0, dx: 0, dy: 0 };
    const sFrom = center ? c.s + sRange[0] : sRange[0];
    const sTo = center ? c.s + sRange[1] : sRange[1];
    let local = { ...best, score: -1 };
    for (let s = sFrom; s <= sTo + 1e-9; s += sStep) {
      /* Без подсказки: сдвиг вокруг того, что совмещает центры рамок. */
      const cx = center ? c.dx : (N - s * N) / 2;
      const cy = center ? c.dy : (N - s * N) / 2;
      for (let dx = cx - dRange; dx <= cx + dRange; dx += dStep) {
        for (let dy = cy - dRange; dy <= cy + dRange; dy += dStep) {
          const sc = score(L, A, s, dx / k, dy / k, sample);
          if (sc > local.score) local = { s, dx, dy, score: sc };
        }
      }
    }
    best = local;
  }
  return best;
}

/** Нижняя вершина: самая низкая плотная точка (центр нижней строки). */
function basePoint(img) {
  for (let y = img.h - 1; y >= 0; y -= 1) {
    let sx = 0;
    let n = 0;
    for (let x = 0; x < img.w; x += 1) {
      if (img.data[(y * img.w + x) * 4 + 3] > 200) {
        sx += x;
        n += 1;
      }
    }
    if (n > 0) return { x: sx / n, y };
  }
  throw new Error('пустой слой');
}

const T = { A: { s: 1, dx: 0, dy: 0, score: 1 } };
for (const id of ['B', 'C', 'D', 'E']) {
  T[id] = align(id);
  console.log(
    `${id}: масштаб ${T[id].s.toFixed(3)}, сдвиг ${T[id].dx}, ${T[id].dy}; совпало ${(T[id].score * 100).toFixed(1)} %`,
  );
}
/* F и G: основание — в основание чашечки B, масштаб — как у B. */
const bB = basePoint(full.B);
const baseA = { x: bB.x * T.B.s + T.B.dx, y: bB.y * T.B.s + T.B.dy };
for (const id of ['F', 'G']) {
  const b = basePoint(full[id]);
  T[id] = { s: T.B.s, dx: baseA.x - b.x * T.B.s, dy: baseA.y - b.y * T.B.s, score: null };
}

/* ── Слой в системе A ───────────────────────────────────────── */

async function placed(id) {
  const t = T[id];
  const size = Math.round(N * t.s);
  const scaled = await sharp(full[id].data, { raw: { width: N, height: N, channels: 4 } })
    .resize(size, size, { kernel: 'lanczos3' })
    .raw()
    .toBuffer();
  /* Холст шире A: корона и октаэдр могут выходить за рамку цветка. */
  const pad = 400;
  const W = N + 2 * pad;
  const canvas = Buffer.alloc(W * W * 4);
  const ox = Math.round(t.dx) + pad;
  const oy = Math.round(t.dy) + pad;
  for (let y = 0; y < size; y += 1) {
    const ty = y + oy;
    if (ty < 0 || ty >= W) continue;
    for (let x = 0; x < size; x += 1) {
      const tx = x + ox;
      if (tx < 0 || tx >= W) continue;
      scaled.copy(canvas, (ty * W + tx) * 4, (y * size + x) * 4, (y * size + x) * 4 + 4);
    }
  }
  return { data: canvas, w: W, h: W, pad };
}

function bbox(img) {
  let x0 = img.w;
  let y0 = img.h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < img.h; y += 1) {
    for (let x = 0; x < img.w; x += 1) {
      if (img.data[(y * img.w + x) * 4 + 3] > 3) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
    }
  }
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

const P = {};
for (const id of Object.keys(NAMES)) P[id] = await placed(id);
const pad = P.A.pad;

/* ── Склейка B + C + D + E против A ─────────────────────────── */

function over(dst, src) {
  for (let i = 0; i < dst.length; i += 4) {
    const a = src[i + 3] / 255;
    if (a === 0) continue;
    for (let c = 0; c < 3; c += 1) dst[i + c] = src[i + c] * a + dst[i + c] * (1 - a);
    dst[i + 3] = 255 * (a + (dst[i + 3] / 255) * (1 - a));
  }
}

function compose(order) {
  const W = P.A.w;
  const out = new Float32Array(W * W * 4);
  for (const id of order) over(out, P[id].data);
  return out;
}

function diff(comp) {
  /* Сравнение на тёмно-синем фоне — как на сайте. */
  const bg = [40, 55, 90];
  const W = P.A.w;
  let sum = 0;
  let n = 0;
  let close = 0;
  for (let i = 0; i < W * W; i += 1) {
    const aa = P.A.data[i * 4 + 3] / 255;
    const ca = comp[i * 4 + 3] / 255;
    if (aa < 0.05 && ca < 0.05) continue;
    let d = 0;
    for (let c = 0; c < 3; c += 1) {
      const va = P.A.data[i * 4 + c] * aa + bg[c] * (1 - aa);
      const vc = comp[i * 4 + c] * ca + bg[c] * (1 - ca);
      d += Math.abs(va - vc);
    }
    d /= 3 * 255;
    sum += d;
    n += 1;
    if (d < 0.08) close += 1;
  }
  return { mean: sum / n, close: close / n };
}

const ORDERS = [
  ['C', 'B', 'D', 'E'],
  ['B', 'C', 'D', 'E'],
  ['C', 'D', 'B', 'E'],
  ['C', 'B', 'E', 'D'],
  ['C', 'E', 'D', 'B'],
  ['C', 'D', 'E', 'B'],
];
const results = ORDERS.map((order) => ({ order, ...diff(compose(order)) }));
results.sort((a, b) => a.mean - b.mean);
for (const r of results) {
  console.log(
    `  ${r.order.join('+')}: разница ${(r.mean * 100).toFixed(1)} %, совпало ${(r.close * 100).toFixed(1)} %`,
  );
}
const best = results[0];

/* Картинка сравнения: A | склейка | разница. */
{
  const W = P.A.w;
  const comp = compose(best.order);
  const bg = [40, 55, 90];
  const crop = { left: pad - 40, top: pad - 40, width: N + 80, height: N + 80 };
  const flat = (rgba, alphaFrom) => {
    const buf = Buffer.alloc(W * W * 3);
    for (let i = 0; i < W * W; i += 1) {
      const a = alphaFrom[i * 4 + 3] / 255;
      for (let c = 0; c < 3; c += 1)
        buf[i * 3 + c] = Math.round(rgba[i * 4 + c] * a + bg[c] * (1 - a));
    }
    return buf;
  };
  const a = flat(P.A.data, P.A.data);
  const c = flat(comp, comp);
  const d = Buffer.alloc(W * W * 3);
  for (let i = 0; i < d.length; i += 1) d[i] = Math.min(255, Math.abs(a[i] - c[i]) * 3);
  const tiles = [];
  for (const buf of [a, c, d]) {
    tiles.push(
      await sharp(buf, { raw: { width: W, height: W, channels: 3 } })
        .extract(crop)
        .resize(640)
        .png()
        .toBuffer(),
    );
  }
  await sharp({ create: { width: 640 * 3, height: 640, channels: 3, background: '#ffffff' } })
    .composite(tiles.map((input, i) => ({ input, left: i * 640, top: 0 })))
    .jpeg({ quality: 85 })
    .toFile(path.join(REPORT, 'skleyka-A-protiv-BCDE.jpg'));
}

/* ── Экспорт ────────────────────────────────────────────────── */

const boxes = {};
for (const id of Object.keys(NAMES)) {
  const img = P[id];
  const b = bbox(img);
  boxes[id] = { x: b.x - pad, y: b.y - pad, w: b.w, h: b.h };
  const crop = await sharp(img.data, { raw: { width: img.w, height: img.h, channels: 4 } })
    .extract({ left: b.x, top: b.y, width: b.w, height: b.h })
    .png()
    .toBuffer();
  for (const width of WIDTHS) {
    const k = width / N;
    const w = Math.max(1, Math.round(b.w * k));
    const name = `${NAMES[id]}-${width}`;
    const resized = sharp(crop).resize(w, null, { kernel: 'lanczos3' });
    await resized
      .clone()
      .webp({ quality: 80, alphaQuality: 90, effort: 6 })
      .toFile(path.join(OUT, name + '.webp'));
    /* PNG — запасной (браузер без WebP): палитра с альфой, в разы легче. */
    await resized
      .clone()
      .png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 })
      .toFile(path.join(OUT, name + '.png'));
  }
}

/* Сердцевина: яркий центр тычинок — по слою E, взвешенно по яркости. */
const core = (() => {
  const img = P.E;
  let sx = 0;
  let sy = 0;
  let sw = 0;
  for (let i = 0; i < img.w * img.h; i += 1) {
    const r = img.data[i * 4];
    const g = img.data[i * 4 + 1];
    const b = img.data[i * 4 + 2];
    const a = img.data[i * 4 + 3];
    const lum = Math.min(r, g, b);
    if (a > 200 && lum > 235) {
      sx += i % img.w;
      sy += (i / img.w) | 0;
      sw += 1;
    }
  }
  return { x: sx / sw - pad, y: sy / sw - pad };
})();

/* ── Вершины для искр ───────────────────────────────────────── */

function hull(points) {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0)
      lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (const p of pts.reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0)
      upper.pop();
    upper.push(p);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

function vertices(id) {
  const img = P[id];
  const step = 2;
  const pts = [];
  const bright = [];
  for (let y = 0; y < img.h; y += step) {
    for (let x = 0; x < img.w; x += step) {
      const i = (y * img.w + x) * 4;
      if (img.data[i + 3] < 160) continue;
      pts.push([x, y]);
      /* Раскалённое золото — тёплый белый; блики на стекле — голубоватые. */
      const r = img.data[i];
      const g = img.data[i + 1];
      const bl = img.data[i + 2];
      if (r > 245 && g > 200 && r - bl > 45) bright.push([x, y]);
    }
  }
  /* Острые углы оболочки (угол < 150°), соседние ближе 60 px — один. */
  const h = hull(pts);
  const corners = [];
  for (let i = 0; i < h.length; i += 1) {
    const a = h[(i - 1 + h.length) % h.length];
    const b = h[i];
    const c = h[(i + 1) % h.length];
    let j = i;
    /* Ищем соседей подальше: на растре оболочка из коротких отрезков. */
    let pa = a;
    let pc = c;
    for (let k = 1; k < h.length && Math.hypot(pa[0] - b[0], pa[1] - b[1]) < 40; k += 1)
      pa = h[(i - k + h.length) % h.length];
    for (let k = 1; k < h.length && Math.hypot(pc[0] - b[0], pc[1] - b[1]) < 40; k += 1)
      pc = h[(j + k) % h.length];
    const v1 = [pa[0] - b[0], pa[1] - b[1]];
    const v2 = [pc[0] - b[0], pc[1] - b[1]];
    const ang = Math.acos(
      (v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(...v1) * Math.hypot(...v2) + 1e-9),
    );
    if (ang < (150 * Math.PI) / 180) corners.push({ x: b[0], y: b[1], w: 1 });
  }
  /* Яркие пятна: сетка 24 px, в каждой — центр ярких точек. */
  const cells = new Map();
  for (const [x, y] of bright) {
    const key = `${Math.floor(x / 24)},${Math.floor(y / 24)}`;
    const c = cells.get(key) ?? { x: 0, y: 0, n: 0 };
    c.x += x;
    c.y += y;
    c.n += 1;
    cells.set(key, c);
  }
  const blobs = [...cells.values()]
    .filter((c) => c.n >= 6)
    .sort((a, b) => b.n - a.n)
    .map((c) => ({ x: c.x / c.n, y: c.y / c.n, w: 0.8 }));
  const out = [];
  for (const p of [...corners, ...blobs]) {
    if (out.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 60)) continue;
    out.push(p);
    if (out.length >= 12) break;
  }
  return out.map((p) => ({ x: Math.round(p.x - img.pad), y: Math.round(p.y - img.pad), w: p.w }));
}

const sparks = { F: vertices('F'), G: vertices('G'), B: vertices('B') };
for (const [id, v] of Object.entries(sparks)) console.log(`Вершины ${id}: ${v.length}`);

const sizes = {};
for (const id of Object.keys(NAMES)) {
  sizes[id] = {};
  for (const width of WIDTHS) {
    for (const ext of ['webp', 'png']) {
      sizes[id][`${width}.${ext}`] = fs.statSync(
        path.join(OUT, `${NAMES[id]}-${width}.${ext}`),
      ).size;
    }
  }
}

const gen = `/* Сгенерировано scripts/build-intro-layers.mjs — не править руками. */

/** Сторона рамки цветка (слой A), px исходника. */
export const FRAME = ${N};

export type LayerId = ${Object.keys(NAMES)
  .map((k) => `'${k}'`)
  .join(' | ')};

/** Рамка слоя в системе A (px исходника; может выходить за 0…FRAME). */
export interface LayerBox {
  file: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const LAYERS: Record<LayerId, LayerBox> = ${JSON.stringify(
  Object.fromEntries(Object.entries(boxes).map(([id, b]) => [id, { file: NAMES[id], ...b }])),
  null,
  2,
)};

/** Порядок цветка снизу вверх: так склейка ближе всего к A. */
export const ORDER: readonly LayerId[] = ${JSON.stringify(best.order)};

/** Нижняя вершина (точка основания) в системе A. */
export const BASE = { x: ${baseA.x.toFixed(1)}, y: ${baseA.y.toFixed(1)} };

/** Сердцевина — центр свечения тычинок. */
export const CORE = { x: ${core.x.toFixed(1)}, y: ${core.y.toFixed(1)} };

/** Вершины для искр (система A): углы силуэта и раскалённые точки. */
export const SPARKS: Record<'F' | 'G' | 'B', readonly { x: number; y: number; w: number }[]> = ${JSON.stringify(sparks)};

/** Ширины файлов слоёв (ширина всей рамки A). */
export const WIDTHS = ${JSON.stringify(WIDTHS)} as const;
`;
fs.writeFileSync(GEN, gen);

const report = {
  transforms: T,
  fringe,
  compose: results,
  boxes,
  base: baseA,
  core,
  sparks,
  bytes: sizes,
};
fs.writeFileSync(path.join(REPORT, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log('Кайма (белёсые полупрозрачные точки):', JSON.stringify(fringe));
console.log(
  `Лучший порядок: ${best.order.join(' + ')}; основание ${baseA.x.toFixed(0)}, ${baseA.y.toFixed(0)}`,
);
