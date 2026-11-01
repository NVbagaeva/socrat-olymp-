/* scripts/verify_schemes/obshchee.mjs — общее для проверок ключевых
   схем №18: случайные числа с зерном, сравнение с допуском, счётчик
   проверенных фактов и проверка экранной раскладки (подписи не
   касаются линий, в кадре нет NaN). */

import { requireSrc } from '../lib/load-ts.mjs';

/** Детерминированный генератор (mulberry32): прогон воспроизводим. */
export function zerno(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
export function ugol(a, v, b) {
  const p = [a[0] - v[0], a[1] - v[1]];
  const q = [b[0] - v[0], b[1] - v[1]];
  const c = (p[0] * q[0] + p[1] * q[1]) / (Math.hypot(...p) * Math.hypot(...q));
  return (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI;
}
export function opisannaya(a, b, c) {
  const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
  const a2 = a[0] ** 2 + a[1] ** 2;
  const b2 = b[0] ** 2 + b[1] ** 2;
  const c2 = c[0] ** 2 + c[1] ** 2;
  const ux = (a2 * (b[1] - c[1]) + b2 * (c[1] - a[1]) + c2 * (a[1] - b[1])) / d;
  const uy = (a2 * (c[0] - b[0]) + b2 * (a[0] - c[0]) + c2 * (b[0] - a[0])) / d;
  return { c: [ux, uy], r: Math.hypot(a[0] - ux, a[1] - uy) };
}
/** Скалярное произведение векторов PQ и RS. */
export const skal = (p, q, r, s) => (q[0] - p[0]) * (s[0] - r[0]) + (q[1] - p[1]) * (s[1] - r[1]);
/** Ориентированная площадь: 0 — точки на одной прямой. */
export const orient = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);

/**
 * Счётчик фактов: fakt(имя, условие, подробности) — одна проверка.
 * Итог печатает, сколько раз проверен каждый факт и сколько провалов.
 */
export function schetchik(nazvanie) {
  const fakty = new Map();
  return {
    fakt(imya, ok, podrobno = '') {
      const z = fakty.get(imya) ?? { n: 0, oshibki: [] };
      z.n += 1;
      if (!ok && z.oshibki.length < 3) z.oshibki.push(podrobno);
      if (!ok) z.provaly = (z.provaly ?? 0) + 1;
      fakty.set(imya, z);
    },
    itog() {
      let plokho = 0;
      console.log(`\n${nazvanie}`);
      for (const [imya, z] of fakty) {
        const pr = z.provaly ?? 0;
        plokho += pr;
        console.log(`  ${pr === 0 ? '✓' : '✗'} ${imya}: ${z.n - pr}/${z.n}`);
        for (const o of z.oshibki) console.log(`      ${o}`);
      }
      return plokho;
    },
  };
}

export const blizko = (x, y, eps = 1e-7) =>
  Math.abs(x - y) <= eps * Math.max(1, Math.abs(x), Math.abs(y));

const ekran = requireSrc('lib/skhemy/ekran');
const podpisi = requireSrc('lib/skhemy/podpisi');

/**
 * Экран схемы при случайном виде: в примитивах нет NaN, подписи не
 * касаются линий, окружностей, дуг и друг друга. Возвращает число
 * подписей, которым не нашлось чистого места (их печатаем как
 * предупреждение: при перетаскивании тесные положения бывают).
 */
export function proveritEkran(skhema, t, rnd, sch, lit = []) {
  const kadr = skhema.postroit(t);
  const vid = { ugol: rnd() * 360, otrazhenie: rnd() < 0.5 ? 1 : -1 };
  const sost = { lit: new Set(lit), shag: null, podpisi: true };
  const W = rnd() < 0.5 ? 343 : 640;
  const H = Math.round(W * 0.72);
  const ramka = ekran.ramkaKadra(kadr, vid, sost);
  const e = ekran.raskladka(kadr, vid, ramka, W, H, sost);
  const chisla = JSON.stringify({ l: e.linii, o: e.okr, u: e.ugly, t: e.tochki, p: e.podpisi });
  sch.fakt('экран: нет NaN', !/NaN|null,"y"|Infinity/.test(chisla));
  /* Все точки внутри поля чертежа. */
  sch.fakt(
    'экран: точки в кадре',
    e.tochki.every((p) => p.x >= 0 && p.x <= W && p.y >= 0 && p.y <= H),
  );
  /* Заново: каждая подпись против всех препятствий кадра. */
  const prep = { otrezki: [], okruzhnosti: [], tochki: [] };
  for (const l of e.linii)
    prep.otrezki.push([
      [l.x1, l.y1],
      [l.x2, l.y2],
    ]);
  for (const o of e.okr) prep.okruzhnosti.push([[o.cx, o.cy], o.r]);
  const zanyato = [];
  let tesno = 0;
  for (const p of e.podpisi) {
    const g = podpisi.gabaritBukvy(p.indeks ? `${p.bukva}_${p.indeks}` : p.bukva, ekran.SK.kegl);
    const pr = [p.x - g.hw, p.y - g.hh, p.x + g.hw, p.y + g.hh];
    const tochki = e.tochki
      .filter((q) => Math.hypot(q.x - p.x, q.y - p.y) > g.hw + 30)
      .map((q) => [q.x, q.y]);
    const n = podpisi.kasaniya(pr, { ...prep, tochki }, zanyato, null);
    if (n > 0) tesno += 1;
    zanyato.push(pr);
  }
  return tesno;
}
