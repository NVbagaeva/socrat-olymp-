/* scripts/lib/stereo-luch.mjs — независимая проверка видимости лучом
   для чертежей стереометрии: тело задаётся своим описанием (выпуклая
   оболочка вершин, уравнения тел вращения), а не гранями движка.
   Общая для test:stereo-kachestvo и test:stereo-vydelenie. */

/* ── Независимый луч: выпуклые тела полупространствами ──────────── */

export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const lerp = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
export const len = (a) => Math.hypot(a[0], a[1], a[2]);

/** Полупространства выпуклой оболочки точек: n·x ≤ c, перебором троек. */
export function obolochka(pts) {
  const out = [];
  const size = Math.max(...pts.map((p) => len(p)), 1);
  const eps = size * 1e-9;
  for (let i = 0; i < pts.length; i += 1)
    for (let j = i + 1; j < pts.length; j += 1)
      for (let k = j + 1; k < pts.length; k += 1) {
        let n = cross(sub(pts[j], pts[i]), sub(pts[k], pts[i]));
        const l = len(n);
        if (l < eps) continue;
        n = [n[0] / l, n[1] / l, n[2] / l];
        let c = dot(n, pts[i]);
        const d = pts.map((p) => dot(n, p) - c);
        if (d.every((x) => x <= eps)) {
          /* уже наружу */
        } else if (d.every((x) => x >= -eps)) {
          n = [-n[0], -n[1], -n[2]];
          c = -c;
        } else continue;
        if (!out.some((h) => Math.abs(dot(h.n, n) - 1) < 1e-9 && Math.abs(h.c - c) < eps * 10))
          out.push({ n, c });
      }
  return out;
}

/**
 * Насколько глубоко луч x + s·k (s > 0) заходит внутрь выпуклого тела
 * (наибольший по s запас min(c − n·x) по полупространствам). > 0 —
 * луч входит в тело.
 */
export function glubinaLuchaPoluprostranstva(x, k, hs) {
  /* Запас — вогнутая кусочно-линейная функция s: максимум ищем по
     точкам излома и концам. */
  const cand = [1e-9];
  for (const h of hs) {
    const nk = dot(h.n, k);
    if (Math.abs(nk) > 1e-12) cand.push((h.c - dot(h.n, x)) / nk);
  }
  for (const a of hs)
    for (const b of hs) {
      const da = dot(a.n, k) - dot(b.n, k);
      if (Math.abs(da) > 1e-12) cand.push((a.c - dot(a.n, x) - (b.c - dot(b.n, x))) / da);
    }
  let best = -Infinity;
  for (const s of cand) {
    if (!(s > 0)) continue;
    const p = [x[0] + s * k[0], x[1] + s * k[1], x[2] + s * k[2]];
    const m = Math.min(...hs.map((h) => h.c - dot(h.n, p)));
    if (m > best) best = m;
  }
  return best;
}

/* ── Тела вращения: запас «внутри» аналитически, луч — шагами ───── */

function zapasTela(body, p) {
  switch (body.kind) {
    case 'cylinder': {
      const rho = Math.hypot(p[0] - body.base[0], p[1] - body.base[1]);
      return Math.min(body.r - rho, p[2] - body.base[2], body.base[2] + body.h - p[2]);
    }
    case 'cone': {
      const rho = Math.hypot(p[0] - body.base[0], p[1] - body.base[1]);
      if (body.inverted) {
        const z0 = body.base[2] - body.h;
        const t = (p[2] - z0) / body.h;
        return Math.min(body.r * t - rho, p[2] - z0, body.base[2] - p[2]) / 1.5;
      }
      const top = body.top ?? 0;
      const t = (p[2] - body.base[2]) / body.h;
      return (
        Math.min(
          body.r - (body.r - top) * t - rho,
          p[2] - body.base[2],
          body.base[2] + body.h - p[2],
        ) / 1.5
      );
    }
    case 'sphere':
      return body.r - len(sub(p, body.center));
    default:
      return -Infinity;
  }
}

export function glubinaLuchaTela(body, x, k, size) {
  if (body.kind === 'polyhedron') {
    body.__hs ??= obolochka(body.vertices);
    return glubinaLuchaPoluprostranstva(x, k, body.__hs);
  }
  let best = -Infinity;
  const N = 600;
  for (let i = 1; i <= N; i += 1) {
    const s = (4 * size * i) / N;
    const m = zapasTela(body, [x[0] + s * k[0], x[1] + s * k[1], x[2] + s * k[2]]);
    if (m > best) best = m;
  }
  return best;
}

/** Сравнить кусок с лучом: 'ok' | 'spor' (касание) | текст ошибки. */
export function sudKuska(pts, vidno, glubina, size) {
  const STROGO = size * 4e-3;
  const MIMO = size * 4e-4;
  let spor = 0;
  /* Длина ломаной — точки по длине, без 5 % у концов. */
  const dl = [];
  let L = 0;
  for (let i = 0; i + 1 < pts.length; i += 1) {
    const d = len(sub(pts[i + 1], pts[i]));
    dl.push(d);
    L += d;
  }
  if (L < size * 1e-3) return 'ok';
  const M = 9;
  for (let j = 0; j < M; j += 1) {
    const u = (0.05 + (0.9 * j) / (M - 1)) * L;
    let acc = 0;
    let i = 0;
    while (i < dl.length - 1 && acc + dl[i] < u) acc += dl[i++];
    const x = lerp(pts[i], pts[i + 1], dl[i] === 0 ? 0 : (u - acc) / dl[i]);
    const g = glubina(x);
    if (g > STROGO && vidno)
      return `видимый кусок закрыт телом (луч входит на ${((g / size) * 100).toFixed(2)} %)`;
    /* Точка на лицевой поверхности: запас по лучу сразу уходит в минус;
       у контура (скользящий луч) он около нуля в обе стороны — спор. */
    if (g < -MIMO && !vidno) return 'невидимый кусок ничем не закрыт';
    if (g >= -MIMO && g <= STROGO) spor += 1;
  }
  return spor > 0 ? 'spor' : 'ok';
}
