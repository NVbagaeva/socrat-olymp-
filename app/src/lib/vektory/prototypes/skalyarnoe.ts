/**
 * Группа B — скалярное произведение: B1…B9.
 *
 * По координатам ответ целый всегда; по длинам и углу берутся только
 * «хорошие» пары: угол 60° с целыми длинами, 30° с длиной k√3, 45°
 * с длиной k√2. Рисунки без сетки (B6, B7) — в первой четверти, с
 * проекциями концов на оси. Для B8 и B9 кроме прямого счёта
 * показывается свойство (k·a)·b = k(a·b) и распределительность.
 */

import { OKNO_DVA, OKNO_TRI, razmestit } from '../razmeshchenie';
import { d, grad, kombinatsiya, kv, modul, mnozhitel, skalyarnoe, vec, vecKv } from '../tex';
import { skalyar } from '../troyki';
import type { Okno, Params, Prototype, Risunok, Shag, Tochka, Vektor } from '../types';
import {
  dany,
  izobrazheny,
  keys,
  koordinaty,
  naydiSkalyarnoe,
  naydiZnachenie,
  shagKombinatsiya,
  shagOtvet,
  shagPoRisunku,
  shagSkalyarnoe,
  signatureOf,
  sluchaynyy,
} from './common';

const OKNO_BEZ_SETKI: Okno = { xmin: -1, xmax: 10, ymin: -1, ymax: 10 };

function risunok(vectors: Vektor[], okno: Okno, grid = true): Risunok {
  const names = vectors.map((v) => v.name).join(', ');
  return {
    vectors,
    window: okno,
    grid,
    alt: grid
      ? `Векторы ${names} на координатной плоскости`
      : `Векторы ${names} на координатной плоскости без сетки, с проекциями концов на оси`,
  };
}

/* ── B1 ─────────────────────────────────────────────────────────── */

function uslovieDlinyUgol(la: string, lb: string, ugol: number): string {
  return `Длины векторов $${vec('a')}$ и $${vec('b')}$ равны $${la}$ и $${lb}$, а угол между ними равен $${grad(ugol)}$. ${naydiSkalyarnoe(skalyarnoe(vec('a'), vec('b')))}`;
}

function shagFormulaUgol(): Shag {
  return {
    zagolovok: 'Формула через длины и угол',
    stroki: [
      `$${skalyarnoe(vec('a'), vec('b'))} = ${modul(vec('a'))}\\cdot${modul(vec('b'))}\\cdot\\cos\\alpha$.`,
    ],
  };
}

export const B1: Prototype = {
  id: 'B1',
  gruppa: 'B',
  nazvanie: 'Через длины и угол 60°',
  format: 'text',
  formula: `${modul(vec('a'))}\\cdot${modul(vec('b'))}\\cdot\\cos 60^\\circ`,
  isklyucheniya: keys([
    { p: 3, q: 5 },
    { p: 3, q: 7 },
  ]),
  generate(r) {
    const p = r.int(2, 12);
    const q = r.int(2, 12);
    const otvet = (p * q) / 2;
    return {
      uslovie: uslovieDlinyUgol(String(p), String(q), 60),
      risunok: null,
      otvet,
      proverka: p * q * Math.cos(Math.PI / 3),
      shagi: [
        shagFormulaUgol(),
        {
          zagolovok: 'Подставляем',
          stroki: [
            `$${skalyarnoe(vec('a'), vec('b'))} = ${p}\\cdot${q}\\cdot\\cos 60^\\circ = ${p}\\cdot${q}\\cdot\\dfrac{1}{2} = ${d(otvet)}$.`,
          ],
        },
        shagOtvet(otvet),
      ],
      params: { p, q },
      signature: `${p}:${q}`,
    };
  },
};

/* ── B2 ─────────────────────────────────────────────────────────── */

export const B2: Prototype = {
  id: 'B2',
  gruppa: 'B',
  nazvanie: 'Длины с корнями, 30° и 45°',
  format: 'text',
  formula: `2\\sqrt{3}\\cdot 7\\cdot\\cos 30^\\circ`,
  isklyucheniya: keys([
    { k: 2, m: 7, ugol: 30, poryadok: 0 },
    { k: 3, m: 6, ugol: 45, poryadok: 0 },
  ]),
  generate(r) {
    const ugol = r.pick([30, 45]);
    const k = r.int(1, 6);
    const m = r.int(2, 9);
    /* Корень то у первого вектора, то у второго. */
    const poryadok = r.int(0, 1);
    const kornevaya = ugol === 30 ? `${k === 1 ? '' : k}\\sqrt{3}` : `${k === 1 ? '' : k}\\sqrt{2}`;
    const otvet = ugol === 30 ? (3 * k * m) / 2 : k * m;
    const cosTex = ugol === 30 ? '\\dfrac{\\sqrt{3}}{2}' : '\\dfrac{\\sqrt{2}}{2}';
    const kornevayaValue = ugol === 30 ? k * Math.sqrt(3) : k * Math.sqrt(2);
    const la = poryadok === 0 ? kornevaya : String(m);
    const lb = poryadok === 0 ? String(m) : kornevaya;
    const km = k === 1 ? String(m) : `${k}\\cdot${m}`;
    const raskrytie =
      ugol === 30
        ? `${km}\\cdot\\dfrac{\\sqrt{3}\\cdot\\sqrt{3}}{2} = \\dfrac{${k * m}\\cdot 3}{2}`
        : `${km}\\cdot\\dfrac{\\sqrt{2}\\cdot\\sqrt{2}}{2} = \\dfrac{${k * m}\\cdot 2}{2}`;
    return {
      uslovie: uslovieDlinyUgol(la, lb, ugol),
      risunok: null,
      otvet,
      proverka: kornevayaValue * m * Math.cos((ugol * Math.PI) / 180),
      shagi: [
        shagFormulaUgol(),
        {
          zagolovok: 'Подставляем',
          stroki: [
            `$${skalyarnoe(vec('a'), vec('b'))} = ${la}\\cdot${lb}\\cdot\\cos ${grad(ugol)} = ${la}\\cdot${lb}\\cdot${cosTex} = ${raskrytie} = ${d(otvet)}$.`,
          ],
        },
        shagOtvet(otvet),
      ],
      params: { k, m, ugol, poryadok },
      signature: `${k}:${m}:${ugol}`,
      vid: `${ugol}:${poryadok}`,
    };
  },
};

/* ── B3 ─────────────────────────────────────────────────────────── */

export const B3: Prototype = {
  id: 'B3',
  gruppa: 'B',
  nazvanie: 'Скалярное произведение по координатам',
  format: 'coords',
  formula: skalyarnoe(vec('a'), vec('b')),
  isklyucheniya: keys([
    { ax: -13, ay: 4, bx: -6, by: 1 },
    { ax: 14, ay: -2, bx: 5, by: -8 },
    { ax: -3, ay: 5, bx: 1, by: 13 },
    { ax: 5, ay: -7, bx: 14, by: 1 },
  ]),
  generate(r) {
    const a = sluchaynyy(r, 15, { pryamoy: 1 / 6 });
    const b = sluchaynyy(r, 15, { pryamoy: 1 / 6 });
    const otvet = skalyar(a, b);
    /* Ноль — законный ответ (перпендикулярные векторы), но редкий. */
    if (otvet === 0 && r.next() > 0.3) return null;
    return {
      uslovie: `${dany([
        ['a', a],
        ['b', b],
      ])} ${naydiSkalyarnoe(skalyarnoe(vec('a'), vec('b')))}`,
      risunok: null,
      otvet,
      proverka:
        Math.hypot(a[0], a[1]) *
        Math.hypot(b[0], b[1]) *
        Math.cos(Math.atan2(b[1], b[0]) - Math.atan2(a[1], a[0])),
      shagi: [shagSkalyarnoe(['a', a], ['b', b]), shagOtvet(otvet)],
      params: { ax: a[0], ay: a[1], bx: b[0], by: b[1] },
      signature: signatureOf([a, b]),
    };
  },
};

/* ── B4 и B8: произведение суммы или разности ───────────────────── */

type FormaSummy = 'ab_c' | 'a_bc';

interface Summa {
  forma: FormaSummy;
  znak: 1 | -1;
}

const FORMY: readonly Summa[] = [
  { forma: 'ab_c', znak: 1 },
  { forma: 'ab_c', znak: -1 },
  { forma: 'a_bc', znak: 1 },
  { forma: 'a_bc', znak: -1 },
];

/** Выражение вида (a+b)·c или a·(b−c) в TeX. */
function texSummy(s: Summa): string {
  return s.forma === 'ab_c'
    ? `(${kombinatsiya([
        [1, 'a'],
        [s.znak, 'b'],
      ])})\\cdot${vec('c')}`
    : `${vec('a')}\\cdot(${kombinatsiya([
        [1, 'b'],
        [s.znak, 'c'],
      ])})`;
}

/** Шаги для (a±b)·c или a·(b±c): сумма, произведение, свойство. */
function shagiSummy(
  s: Summa,
  a: Tochka,
  b: Tochka,
  c: Tochka,
): { shagi: Shag[]; otvet: number; proverka: number } {
  const summa: Tochka =
    s.forma === 'ab_c'
      ? [a[0] + s.znak * b[0], a[1] + s.znak * b[1]]
      : [b[0] + s.znak * c[0], b[1] + s.znak * c[1]];
  const terms =
    s.forma === 'ab_c'
      ? ([
          [1, 'a', a],
          [s.znak, 'b', b],
        ] as const)
      : ([
          [1, 'b', b],
          [s.znak, 'c', c],
        ] as const);
  const imya = s.forma === 'ab_c' ? 'u' : 'v';
  const left: readonly [string, Tochka] = s.forma === 'ab_c' ? [imya, summa] : ['a', a];
  const right: readonly [string, Tochka] = s.forma === 'ab_c' ? ['c', c] : [imya, summa];
  const otvet = skalyar(left[1], right[1]);
  const p1 = s.forma === 'ab_c' ? skalyar(a, c) : skalyar(a, b);
  const p2 = s.forma === 'ab_c' ? skalyar(b, c) : skalyar(a, c);
  const svoystvo =
    s.forma === 'ab_c'
      ? `$(${kombinatsiya([
          [1, 'a'],
          [s.znak, 'b'],
        ])})\\cdot${vec('c')} = ${vec('a')}\\cdot${vec('c')} ${s.znak === 1 ? '+' : '-'} ${vec('b')}\\cdot${vec('c')} = ${d(p1)} ${s.znak === 1 ? '+' : '-'} ${mnozhitel(p2)} = ${d(otvet)}$.`
      : `$${vec('a')}\\cdot(${kombinatsiya([
          [1, 'b'],
          [s.znak, 'c'],
        ])}) = ${vec('a')}\\cdot${vec('b')} ${s.znak === 1 ? '+' : '-'} ${vec('a')}\\cdot${vec('c')} = ${d(p1)} ${s.znak === 1 ? '+' : '-'} ${mnozhitel(p2)} = ${d(otvet)}$.`;
  return {
    otvet,
    proverka: p1 + s.znak * p2,
    shagi: [
      shagKombinatsiya(terms, summa, imya),
      shagSkalyarnoe(left, right),
      {
        zagolovok:
          'Замечание: то же по свойству $(\\vec{a}+\\vec{b})\\cdot\\vec{c} = \\vec{a}\\cdot\\vec{c} + \\vec{b}\\cdot\\vec{c}$',
        stroki: [svoystvo],
      },
      shagOtvet(otvet),
    ],
  };
}

export const B4: Prototype = {
  id: 'B4',
  gruppa: 'B',
  nazvanie: 'Скалярное произведение суммы',
  format: 'coords',
  formula: `(${vec('a')}+${vec('b')})\\cdot${vec('c')}`,
  isklyucheniya: keys([
    { ax: 0, ay: -4, bx: 7, by: 5, cx: -4, cy: 8, forma: 'ab_c', znak: 1 },
    { ax: 1, ay: 9, bx: -6, by: 0, cx: 10, cy: -2, forma: 'a_bc', znak: -1 },
  ]),
  generate(r) {
    const s = r.pick(FORMY);
    const a = sluchaynyy(r, 10, { pryamoy: 1 / 6 });
    const b = sluchaynyy(r, 10, { pryamoy: 1 / 6 });
    const c = sluchaynyy(r, 10, { pryamoy: 1 / 6 });
    const { shagi, otvet, proverka } = shagiSummy(s, a, b, c);
    if (otvet === 0 && r.next() > 0.3) return null;
    return {
      uslovie: `${dany([
        ['a', a],
        ['b', b],
        ['c', c],
      ])} ${naydiZnachenie(texSummy(s))}`,
      risunok: null,
      otvet,
      proverka,
      shagi,
      params: {
        ax: a[0],
        ay: a[1],
        bx: b[0],
        by: b[1],
        cx: c[0],
        cy: c[1],
        forma: s.forma,
        znak: s.znak,
      },
      signature: signatureOf([a, b, c]),
      vid: `${s.forma}:${s.znak}`,
    };
  },
};

/* ── B5 ─────────────────────────────────────────────────────────── */

export const B5: Prototype = {
  id: 'B5',
  gruppa: 'B',
  nazvanie: 'По рисунку на сетке',
  format: 'grid',
  formula: skalyarnoe(vec('a'), vec('b')),
  generate(r) {
    const a = sluchaynyy(r, 6, { pryamoy: 1 / 7 });
    const b = sluchaynyy(r, 6, { pryamoy: 1 / 7 });
    const otvet = skalyar(a, b);
    if (otvet === 0 && r.next() > 0.3) return null;
    const vectors = razmestit(r, [a, b], OKNO_DVA);
    if (vectors === null) return null;
    return {
      uslovie: `${izobrazheny(['a', 'b'])} ${naydiSkalyarnoe(skalyarnoe(vec('a'), vec('b')))}`,
      risunok: risunok(vectors, OKNO_DVA),
      otvet,
      proverka:
        Math.hypot(a[0], a[1]) *
        Math.hypot(b[0], b[1]) *
        Math.cos(Math.atan2(b[1], b[0]) - Math.atan2(a[1], a[0])),
      shagi: [shagPoRisunku(vectors), shagSkalyarnoe(['a', a], ['b', b]), shagOtvet(otvet)],
      params: { ax: a[0], ay: a[1], bx: b[0], by: b[1] },
      signature: signatureOf([a, b]),
    };
  },
};

/* ── B6, B7: без сетки ──────────────────────────────────────────── */

/** Чтение координат по проекциям — для рисунка без сетки. */
function shagPoProektsiyam(vectors: readonly Vektor[]): Shag {
  const stroki: string[] = [];
  for (const v of vectors) {
    const p = koordinaty(v);
    if (v.from[0] === 0 && v.from[1] === 0) {
      stroki.push(
        `Вектор $${vec(v.name)}$ выходит из начала координат, поэтому его координаты — это координаты конца: $${vecKv(v.name, p)}$.`,
      );
    } else {
      stroki.push(
        `Начало $${vec(v.name)}$ — точка $${kv(v.from[0], v.from[1])}$, конец — $${kv(v.to[0], v.to[1])}$ (читаем по проекциям на оси). Конец минус начало: $${vec(v.name)} = (${d(v.to[0])} - ${mnozhitel(v.from[0])};\\ ${d(v.to[1])} - ${mnozhitel(v.from[1])}) = ${kv(p[0], p[1])}$.`,
      );
    }
  }
  return { zagolovok: 'Координаты векторов по проекциям', stroki };
}

function bezSetki(id: string, nazvanie: string, izNachala: boolean): Prototype {
  return {
    id,
    gruppa: 'B',
    nazvanie,
    format: 'nogrid',
    formula: skalyarnoe(vec('a'), vec('b')),
    isklyucheniya: izNachala
      ? keys([
          { ax: 3, ay: 7, bx: 8, by: 5 },
          { ax: 2, ay: 8, bx: 10, by: 4 },
        ])
      : keys([
          { ax: 3, ay: 5, bx: 7, by: 1, a0x: 2, a0y: 4, b0x: 2, b0y: 2 },
          { ax: 6, ay: 7, bx: 7, by: 4, a0x: 1, a0y: 1, b0x: 3, b0y: 1 },
        ]),
    generate(r) {
      /* Первая четверть, обе координаты положительные: числа у осей
         читаются слева и снизу, как в ФИПИ. */
      const a: Tochka = [r.int(1, 8), r.int(1, 8)];
      const b: Tochka = [r.int(1, 8), r.int(1, 8)];
      if (a[0] === b[0] && a[1] === b[1]) return null;
      const vectors = razmestit(r, [a, b], OKNO_BEZ_SETKI, { izNachala, pervayaChetvert: true });
      if (vectors === null) return null;
      const otvet = skalyar(a, b);
      const params: Params = izNachala
        ? { ax: a[0], ay: a[1], bx: b[0], by: b[1] }
        : {
            ax: a[0],
            ay: a[1],
            bx: b[0],
            by: b[1],
            a0x: vectors[0]!.from[0],
            a0y: vectors[0]!.from[1],
            b0x: vectors[1]!.from[0],
            b0y: vectors[1]!.from[1],
          };
      return {
        uslovie: naydiSkalyarnoe(skalyarnoe(vec('a'), vec('b'))),
        risunok: risunok(vectors, OKNO_BEZ_SETKI, false),
        otvet,
        proverka:
          Math.hypot(a[0], a[1]) *
          Math.hypot(b[0], b[1]) *
          Math.cos(Math.atan2(b[1], b[0]) - Math.atan2(a[1], a[0])),
        shagi: [shagPoProektsiyam(vectors), shagSkalyarnoe(['a', a], ['b', b]), shagOtvet(otvet)],
        params,
        signature: izNachala
          ? signatureOf([a, b])
          : signatureOf([a, b, vectors[0]!.from, vectors[1]!.from]),
      };
    },
  };
}

export const B6 = bezSetki('B6', 'Без сетки, из начала координат', true);
export const B7 = bezSetki('B7', 'Без сетки, не из начала координат', false);

/* ── B8 ─────────────────────────────────────────────────────────── */

export const B8: Prototype = {
  id: 'B8',
  gruppa: 'B',
  nazvanie: 'По рисунку: три вектора',
  format: 'grid',
  formula: `(${vec('a')}-${vec('b')})\\cdot${vec('c')}`,
  generate(r) {
    const s = r.pick(FORMY);
    const a = sluchaynyy(r, 6, { pryamoy: 1 / 7 });
    const b = sluchaynyy(r, 6, { pryamoy: 1 / 7 });
    const c = sluchaynyy(r, 6, { pryamoy: 1 / 7 });
    const { shagi, otvet, proverka } = shagiSummy(s, a, b, c);
    if (otvet === 0 && r.next() > 0.3) return null;
    const vectors = razmestit(r, [a, b, c], OKNO_TRI);
    if (vectors === null) return null;
    return {
      uslovie: `${izobrazheny(['a', 'b', 'c'])} ${naydiZnachenie(texSummy(s))}`,
      risunok: risunok(vectors, OKNO_TRI),
      otvet,
      proverka,
      shagi: [shagPoRisunku(vectors), ...shagi],
      params: {
        ax: a[0],
        ay: a[1],
        bx: b[0],
        by: b[1],
        cx: c[0],
        cy: c[1],
        forma: s.forma,
        znak: s.znak,
      },
      signature: signatureOf([a, b, c]),
      vid: `${s.forma}:${s.znak}`,
    };
  },
};

/* ── B9 ─────────────────────────────────────────────────────────── */

export const B9: Prototype = {
  id: 'B9',
  gruppa: 'B',
  nazvanie: 'По рисунку: $2\\vec{a}$ и $\\vec{b}$',
  format: 'grid',
  formula: `2${vec('a')}\\cdot${vec('b')}`,
  generate(r) {
    const kto = r.pick(['a', 'b'] as const);
    const a = sluchaynyy(r, 6, { pryamoy: 1 / 7 });
    const b = sluchaynyy(r, 6, { pryamoy: 1 / 7 });
    const dot = skalyar(a, b);
    if (dot === 0 && r.next() > 0.3) return null;
    const vectors = razmestit(r, [a, b], OKNO_DVA);
    if (vectors === null) return null;
    const otvet = 2 * dot;
    const dvoynoy: Tochka = kto === 'a' ? [2 * a[0], 2 * a[1]] : [2 * b[0], 2 * b[1]];
    const imya = kto === 'a' ? 'u' : 'v';
    const left: readonly [string, Tochka] = kto === 'a' ? [imya, dvoynoy] : ['a', a];
    const right: readonly [string, Tochka] = kto === 'a' ? ['b', b] : [imya, dvoynoy];
    const tex = kto === 'a' ? `2${vec('a')}` : `2${vec('b')}`;
    const voprosTex = kto === 'a' ? `2${vec('a')}$ и $${vec('b')}` : `${vec('a')}$ и $2${vec('b')}`;
    return {
      uslovie: `${izobrazheny(['a', 'b'])} ${naydiSkalyarnoe(voprosTex)}`,
      risunok: risunok(vectors, OKNO_DVA),
      otvet,
      proverka:
        2 *
        (Math.hypot(a[0], a[1]) *
          Math.hypot(b[0], b[1]) *
          Math.cos(Math.atan2(b[1], b[0]) - Math.atan2(a[1], a[0]))),
      shagi: [
        shagPoRisunku(vectors),
        shagKombinatsiya([[2, kto, kto === 'a' ? a : b]], dvoynoy, imya),
        shagSkalyarnoe(left, right),
        {
          zagolovok: 'Замечание: свойство $(k\\vec{a})\\cdot\\vec{b} = k(\\vec{a}\\cdot\\vec{b})$',
          stroki: [
            `Можно сначала найти $${skalyarnoe(vec('a'), vec('b'))} = ${d(dot)}$, а потом удвоить: $${kto === 'a' ? `(${tex})\\cdot${vec('b')}` : `${vec('a')}\\cdot(${tex})`} = 2\\cdot${mnozhitel(dot)} = ${d(otvet)}$.`,
          ],
        },
        shagOtvet(otvet),
      ],
      params: { ax: a[0], ay: a[1], bx: b[0], by: b[1], kto },
      signature: signatureOf([a, b]),
    };
  },
};

export const SKALYARNOE: Prototype[] = [B1, B2, B3, B4, B5, B6, B7, B8, B9];
