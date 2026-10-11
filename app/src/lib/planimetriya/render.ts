/**
 * Движок планиметрических чертежей: renderPlan(scena, optsii) → SVG.
 *
 * Чистая функция без React. Порядок работы:
 *   1. построения сцены (geom.resolve) — точки и окружности;
 *   2. вариант генератора: отражение, поворот, переименование букв;
 *   3. видимые элементы по режиму: лист ученика — только условие,
 *      подсказка N — условие и шаги 1…N (шаг N подсвечен), лист
 *      учителя — всё;
 *   4. масштаб: фигура вписывается в shirina × vysota;
 *   5. рисование: штриховка, окружности, линии, дуги углов и значки
 *      прямого угла, штрихи равенства, точки;
 *   6. подписи точек: курсив шрифтом KaTeX, снаружи фигуры по
 *      биссектрисе внешнего угла, с проверкой зазора до всех линий,
 *      кривых и других подписей. Нет чистого места — нарушение в
 *      отчёте (генератор такой вариант отбраковывает);
 *   7. проверки: вырожденность, углы не меньше порога, вспомогательные
 *      построения не в условии, ответ не читается с рисунка.
 *
 * Цвета — токены дизайн-системы, те же, что у чертежей №12: линии —
 * --graph-axis, искомое — --color-primary, подсказки и построения
 * учителя — --graph-accent. В ч/б теме печати все три чёрные, и
 * различаются толщиной и штрихом.
 */

import { THEME, esc, px } from '@/lib/graph/renderer.js';
import { POROG } from './figury';
import {
  type Krug,
  RAD,
  add,
  angleAt,
  angleOf,
  dist,
  mul,
  polar,
  resolve,
  rotate,
  sub,
  unit,
} from './geom';
import { type Prepyatstvie, type Pryam, blizhayshee } from './kollizii';
import type { Element, Optsii, Otchet, Ramka, Rezhim, Scena, Sloy, T2 } from './types';

/* ── Оформление ──────────────────────────────────────────────────── */

export const PL = {
  ink: THEME.colors.axis,
  iskomoe: THEME.colors.lineA,
  podskazka: THEME.colors.accent,
  bg: THEME.colors.bg,
  width: { line: 1.9, iskomoe: 2.9, novoe: 2.8, mark: 1.5, tick: 1.6 },
  dash: { punktir: '6 4', prodolzhenie: '5 4' },
  /* Подписи точек — курсив KaTeX_Math, как буквы в формулах сайта. */
  font: {
    bukva: "KaTeX_Math, 'Latin Modern Roman', 'Times New Roman', serif",
    chislo: "KaTeX_Main, 'Latin Modern Roman', 'Times New Roman', serif",
    razmer: 19,
    razmerZnach: 15,
  },
  /* Зазор подписи до линий и других подписей, px. */
  gap: 2.5,
  /* Ступени отступа подписи от точки, px. */
  otstupy: [4, 7, 11, 16, 22, 29],
  ugol: { r: 17, shag: 4, min: 8, rPryamoy: 9 },
  tick: { half: 5, shag: 4 },
  tochkaR: 2.6,
  /* Наименьшие размеры на экране: короче — фигура вырождена. */
  minOtrezok: 12,
  minMezhduTochkami: 10,
  minUgolMnogougolnika: 7,
  razmer: { shirina: 280, vysota: 220 },
  pole: 4,
} as const;

/* Ширина глифов KaTeX_Math (курсив) и KaTeX_Main в долях кегля. */
const SHIRINA: Record<string, number> = {
  A: 0.75,
  B: 0.76,
  C: 0.72,
  D: 0.83,
  E: 0.74,
  F: 0.64,
  G: 0.79,
  H: 0.83,
  I: 0.44,
  J: 0.55,
  K: 0.85,
  L: 0.68,
  M: 0.97,
  N: 0.8,
  O: 0.76,
  P: 0.64,
  Q: 0.79,
  R: 0.76,
  S: 0.61,
  T: 0.58,
  U: 0.68,
  V: 0.58,
  W: 0.94,
  X: 0.83,
  Y: 0.58,
  Z: 0.68,
  '°': 0.4,
  ',': 0.28,
  '.': 0.28,
  '√': 0.83,
  ' ': 0.25,
  x: 0.57,
  y: 0.49,
  r: 0.45,
  h: 0.58,
  a: 0.53,
  b: 0.43,
  c: 0.43,
  d: 0.52,
  R1: 0.76,
};

function shirinaTeksta(t: string, size: number): number {
  let w = 0;
  for (const ch of t) w += /\d/.test(ch) ? 0.5 : (SHIRINA[ch] ?? 0.7);
  return w * size;
}

/* ── Слои и режимы ───────────────────────────────────────────────── */

function sloyOf(e: Element): Sloy {
  return e.sloy ?? 'uslovie';
}

export function vidim(sloy: Sloy, r: Rezhim): boolean {
  if (r.rezhim === 'uchitel') return true;
  if (sloy === 'uslovie') return true;
  if (r.rezhim === 'podskazka') return typeof sloy === 'number' && sloy <= r.shag;
  return false;
}

/** Число шагов подсказки в сцене. */
export function shagovPodskazki(scena: Scena): number {
  let n = scena.shagov ?? 0;
  for (const e of scena.elementy) {
    const s = sloyOf(e);
    if (typeof s === 'number') n = Math.max(n, s);
    for (const p of e.podsvetka ?? []) n = Math.max(n, p);
  }
  return n;
}

/** Точки, через которые проходит элемент. */
function tochkiElementa(e: Element): string[] {
  switch (e.tip) {
    case 'otrezok':
    case 'pryamaya':
      return [e.a, e.b];
    case 'prodolzhenie':
      return e.doTochki ? [e.a, e.b, e.doTochki] : [e.a, e.b];
    case 'mnogougolnik':
    case 'oblast':
      return [...e.tochki];
    case 'duga':
      return [e.ot, e.do];
    case 'ugol':
      return [e.a, e.v, e.b];
    case 'tochka':
      return [e.t];
    default:
      return [];
  }
}

export function pustoyOtchet(): Otchet {
  return {
    width: 0,
    height: 0,
    ekran: {},
    ramki: [],
    vidimye: 0,
    problems: [],
    teksty: [],
    prepyatstviya: [],
  };
}

/** Отрезки элемента в координатах сцены (для подписей соседей и проверок). */
interface Liniya {
  a: T2;
  b: T2;
}

/* Хеш строки — стабильный id узора штриховки в одном SVG (без счётчика:
   один и тот же рисунок на сервере и в браузере даёт один id). */
function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

const ZNACHENIE_CHISLO = /^[\d\s,.√°+\-−]+$/;

/* ── Рендер ──────────────────────────────────────────────────────── */

export function renderPlan(scena: Scena, optsii: Optsii = {}, otchet?: Otchet): string {
  const R = otchet ?? pustoyOtchet();
  Object.assign(R, pustoyOtchet());
  const zadaniyaZnach: ZadanieZnach[] = [];
  const problems = R.problems;
  const rezhim: Rezhim = optsii.rezhim ?? { rezhim: 'uchenik' };
  const shag = rezhim.rezhim === 'podskazka' ? rezhim.shag : -1;
  const variant = optsii.variant;
  const imya = (n: string) => variant?.bukvy[n] ?? n;

  /* 1. Построения. */
  const v = resolve(scena);

  /* 2. Вариант: отражение, затем поворот вокруг начала координат. */
  const otr = variant?.otrazhenie === true;
  const pov = variant?.povorot ?? 0;
  const T = (p: T2): T2 => rotate(otr ? [-p[0], p[1]] : p, [0, 0], pov);
  const P: Record<string, T2> = {};
  for (const [n, p] of Object.entries(v.tochki)) P[n] = T(p);
  const K: Record<string, Krug> = {};
  for (const [n, k] of Object.entries(v.okruzhnosti)) K[n] = { c: T(k.c), r: k.r };
  const pt = (n: string): T2 => {
    const p = P[n];
    if (p === undefined) throw new Error(`точка ${n} не определена`);
    return p;
  };
  const kr = (n: string): Krug => {
    const k = K[n];
    if (k === undefined) throw new Error(`окружность ${n} не определена`);
    return k;
  };

  /* 3. Видимые элементы. */
  const vidimye = scena.elementy.filter((e) => vidim(sloyOf(e), rezhim));
  R.vidimye = vidimye.length;
  const novoe = (e: Element) =>
    shag > 0 && (sloyOf(e) === shag || (e.podsvetka ?? []).includes(shag));
  for (const e of scena.elementy) {
    if (sloyOf(e) !== 'uslovie') continue;
    if ((e.tip === 'otrezok' || e.tip === 'okruzhnost') && e.stil === 'punktir') {
      problems.push(
        `вспомогательное построение (пунктир) в слое условия: ${tochkiElementa(e).join('') || e.tip}`,
      );
    }
    if (e.tip === 'oblast' && e.vydelit !== 'dano' && e.vydelit !== 'iskomoe') {
      problems.push('штриховка в условии без роли (данное или искомое)');
    }
  }

  /* Концы продолжений и прямых — в координатах сцены. */
  const konecProdolzheniya = (e: Element & { tip: 'prodolzhenie' }): T2 => {
    const a = pt(e.a);
    const b = pt(e.b);
    if (e.doTochki) return pt(e.doTochki);
    return add(b, mul(sub(b, a), e.dolya ?? 0.35));
  };
  const koncyPryamoy = (e: Element & { tip: 'pryamaya' }): [T2, T2] => {
    const a = pt(e.a);
    const b = pt(e.b);
    const d = sub(b, a);
    return [sub(a, mul(d, e.zaA ?? 0.3)), add(b, mul(d, e.zaB ?? 0.3))];
  };

  /* 4. Масштаб по видимой геометрии. */
  const ext: T2[] = [];
  for (const e of vidimye) {
    for (const n of tochkiElementa(e)) ext.push(pt(n));
    if (e.tip === 'prodolzhenie') ext.push(konecProdolzheniya(e));
    if (e.tip === 'pryamaya') ext.push(...koncyPryamoy(e));
    if (e.tip === 'okruzhnost') {
      const k = kr(e.okr);
      ext.push([k.c[0] - k.r, k.c[1] - k.r], [k.c[0] + k.r, k.c[1] + k.r]);
    }
  }
  if (ext.length === 0) {
    problems.push('на рисунке нет ни одного элемента');
    ext.push([0, 0], [1, 1]);
  }
  const minx = Math.min(...ext.map((p) => p[0]));
  const maxx = Math.max(...ext.map((p) => p[0]));
  const miny = Math.min(...ext.map((p) => p[1]));
  const maxy = Math.max(...ext.map((p) => p[1]));
  const W = optsii.shirina ?? PL.razmer.shirina;
  const H = optsii.vysota ?? PL.razmer.vysota;
  const s = Math.min(W / Math.max(maxx - minx, 1e-6), H / Math.max(maxy - miny, 1e-6));
  const S = (p: T2): T2 => [(p[0] - minx) * s, (maxy - p[1]) * s];

  for (const [n, p] of Object.entries(P)) R.ekran[n] = S(p);
  const E = (n: string): T2 => S(pt(n));

  /* 5. Рисование. Слои SVG: штриховка, окружности, линии, отметки, точки, подписи. */
  const sloyOblast: string[] = [];
  const sloyOkr: string[] = [];
  const sloyLinii: string[] = [];
  const sloyOtmetki: string[] = [];
  const sloyTochki: string[] = [];
  const sloyPodpisi: string[] = [];
  const prep: Prepyatstvie[] = [];
  const linii: Liniya[] = [];
  const geomTochki: T2[] = [];
  const patternId = `plh-${hash(JSON.stringify(scena.elementy) + JSON.stringify(rezhim) + pov + String(otr))}`;
  let nuzhenUzor = false;

  const stil = (e: Element) => {
    const n = novoe(e);
    const iz = e.vydelit === 'iskomoe';
    const vsp = sloyOf(e) !== 'uslovie';
    const color = n ? PL.podskazka : iz ? PL.iskomoe : vsp ? PL.podskazka : PL.ink;
    const w = n ? PL.width.novoe : iz ? PL.width.iskomoe : PL.width.line;
    const sl = sloyOf(e);
    const cls = [
      'pl-el',
      `pl-${e.tip}`,
      iz ? 'pl-iskomoe' : '',
      n ? 'pl-novoe' : '',
      typeof sl === 'number' ? `pl-shag pl-shag-${sl}` : sl === 'reshenie' ? 'pl-reshenie' : '',
    ]
      .filter(Boolean)
      .join(' ');
    return { color, w, cls, data: e.id ? ` data-id="${esc(e.id)}"` : '' };
  };

  const otrezokSvg = (
    a: T2,
    b: T2,
    color: string,
    w: number,
    cls: string,
    data: string,
    dash?: string,
  ) => {
    sloyLinii.push(
      `<path class="${cls}"${data} d="M${px(a[0])} ${px(a[1])}L${px(b[0])} ${px(b[1])}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`,
    );
    prep.push({
      tip: 'otrezok',
      a,
      b,
      r: w / 2,
      chto: `линия ${cls.includes('pl-shag') ? 'подсказки' : ''}`.trim(),
    });
  };

  /* Окружности. */
  for (const e of vidimye) {
    if (e.tip !== 'okruzhnost') continue;
    const k = kr(e.okr);
    const c = S(k.c);
    const r = k.r * s;
    const st = stil(e);
    const dash = e.stil === 'punktir' ? ` stroke-dasharray="${PL.dash.punktir}"` : '';
    sloyOkr.push(
      `<circle class="${st.cls}"${st.data} cx="${px(c[0])}" cy="${px(c[1])}" r="${px(r)}" fill="none" stroke="${st.color}" stroke-width="${st.w}"${dash}/>`,
    );
    prep.push({ tip: 'krug', c, r, tolshchina: st.w, chto: `окружность ${e.okr}` });
  }

  /* Дуги окружностей (выделенные дуги AB). */
  for (const e of vidimye) {
    if (e.tip !== 'duga') continue;
    const k = kr(e.okr);
    const c = S(k.c);
    const r = k.r * s;
    /* Против часовой стрелки в координатах сцены; отражение меняет направление. */
    const [ot, d0] = otr ? [e.do, e.ot] : [e.ot, e.do];
    const a1 = angleOf(sub(pt(ot), k.c));
    let a2 = angleOf(sub(pt(d0), k.c));
    if (a2 <= a1) a2 += 360;
    const st = stil(e);
    const p1 = S(add(k.c, polar(a1, k.r)));
    const p2 = S(add(k.c, polar(a2, k.r)));
    const large = a2 - a1 > 180 ? 1 : 0;
    sloyOtmetki.push(
      `<path class="${st.cls} pl-duga"${st.data} d="M${px(p1[0])} ${px(p1[1])}A${px(r)} ${px(r)} 0 ${large} 0 ${px(p2[0])} ${px(p2[1])}" fill="none" stroke="${e.vydelit === 'iskomoe' || novoe(e) ? st.color : PL.podskazka}" stroke-width="${Math.max(st.w, 3.4)}" stroke-linecap="round" opacity="0.9"/>`,
    );
    /* Концы дуги — короткие засечки поперёк окружности: две соседние
       дуги одного цвета так не сливаются в одну. */
    const zas: string[] = [];
    for (const q of [p1, p2]) {
      const n = unit(sub(q, c));
      const q1 = add(q, mul(n, 4.5));
      const q2 = sub(q, mul(n, 4.5));
      zas.push(`M${px(q1[0])} ${px(q1[1])}L${px(q2[0])} ${px(q2[1])}`);
      prep.push({ tip: 'otrezok', a: q1, b: q2, r: 1, chto: `засечка дуги ${e.ot}${e.do}` });
    }
    sloyOtmetki.push(
      `<path class="pl-duga-konec" d="${zas.join('')}" stroke="${e.vydelit === 'iskomoe' || novoe(e) ? st.color : PL.podskazka}" stroke-width="1.8" stroke-linecap="round"/>`,
    );
    if (e.znachenie !== undefined) {
      const am = (a1 + a2) / 2;
      zadaniyaZnach.push({
        e,
        yakor: S(add(k.c, polar(am, k.r))),
        napr: unit(sub(S(add(k.c, polar(am, k.r))), c)),
        vdol: null,
      });
    }
  }

  /* Многоугольники, отрезки, продолжения, прямые. */
  for (const e of vidimye) {
    const st = stil(e);
    if (e.tip === 'mnogougolnik') {
      const pts = e.tochki.map(E);
      sloyLinii.push(
        `<path class="${st.cls}"${st.data} d="${pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${px(p[0])} ${px(p[1])}`).join('')}Z" fill="none" stroke="${st.color}" stroke-width="${st.w}" stroke-linejoin="round"/>`,
      );
      for (let i = 0; i < pts.length; i += 1) {
        const a = pts[i]!;
        const b = pts[(i + 1) % pts.length]!;
        prep.push({
          tip: 'otrezok',
          a,
          b,
          r: st.w / 2,
          chto: `сторона ${e.tochki[i]}${e.tochki[(i + 1) % pts.length]}`,
        });
        linii.push({ a: pt(e.tochki[i]!), b: pt(e.tochki[(i + 1) % pts.length]!) });
      }
      /* Углы многоугольника: вырожденная фигура не рисуется. */
      for (let i = 0; i < pts.length; i += 1) {
        const u = angleAt(
          pts[(i + pts.length - 1) % pts.length]!,
          pts[i]!,
          pts[(i + 1) % pts.length]!,
        );
        if (u < PL.minUgolMnogougolnika) {
          problems.push(
            `угол многоугольника при ${e.tochki[i]} меньше ${PL.minUgolMnogougolnika}°`,
          );
        }
      }
    } else if (e.tip === 'otrezok') {
      const a = E(e.a);
      const b = E(e.b);
      if (!e.tolkoShtrihi) {
        otrezokSvg(
          a,
          b,
          st.color,
          st.w,
          st.cls,
          st.data,
          e.stil === 'punktir' ? PL.dash.punktir : undefined,
        );
        prep[prep.length - 1] = { tip: 'otrezok', a, b, r: st.w / 2, chto: `отрезок ${e.a}${e.b}` };
        linii.push({ a: pt(e.a), b: pt(e.b) });
      }
      if (dist(a, b) < PL.minOtrezok)
        problems.push(`отрезок ${e.a}${e.b} короче ${PL.minOtrezok} px`);
      if (e.shtrihi) {
        const m: T2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        const u = unit(sub(b, a));
        const nrm: T2 = [-u[1], u[0]];
        const d: string[] = [];
        for (let i = 0; i < e.shtrihi; i += 1) {
          const off = (i - (e.shtrihi - 1) / 2) * PL.tick.shag;
          const c = add(m, mul(u, off));
          const p1 = add(c, mul(nrm, PL.tick.half));
          const p2 = sub(c, mul(nrm, PL.tick.half));
          d.push(`M${px(p1[0])} ${px(p1[1])}L${px(p2[0])} ${px(p2[1])}`);
          prep.push({
            tip: 'otrezok',
            a: p1,
            b: p2,
            r: PL.width.tick / 2,
            chto: `штрих ${e.a}${e.b}`,
          });
        }
        sloyOtmetki.push(
          `<path class="pl-shtrih${novoe(e) ? ' pl-novoe' : ''}" d="${d.join('')}" stroke="${novoe(e) ? PL.podskazka : PL.ink}" stroke-width="${PL.width.tick}" stroke-linecap="round"/>`,
        );
      }
      if (e.znachenie !== undefined) {
        zadaniyaZnach.push({
          e,
          yakor: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2],
          napr: null,
          vdol: [a, b],
        });
      }
    } else if (e.tip === 'prodolzhenie') {
      const b = E(e.b);
      const c = S(konecProdolzheniya(e));
      otrezokSvg(
        b,
        c,
        st.color,
        PL.width.line,
        st.cls,
        st.data,
        e.sploshnoe ? undefined : PL.dash.prodolzhenie,
      );
      prep[prep.length - 1] = {
        tip: 'otrezok',
        a: b,
        b: c,
        r: PL.width.line / 2,
        chto: `продолжение ${e.a}${e.b}`,
      };
      linii.push({ a: pt(e.b), b: konecProdolzheniya(e) });
    } else if (e.tip === 'pryamaya') {
      const [a0, b0] = koncyPryamoy(e);
      const a = S(a0);
      const b = S(b0);
      otrezokSvg(a, b, st.color, st.w, st.cls, st.data);
      prep[prep.length - 1] = { tip: 'otrezok', a, b, r: st.w / 2, chto: `прямая ${e.a}${e.b}` };
      linii.push({ a: a0, b: b0 });
    }
  }

  /* Области со штриховкой. */
  for (const e of vidimye) {
    if (e.tip !== 'oblast') continue;
    nuzhenUzor = true;
    const pts = e.tochki.map(E);
    const st = stil(e);
    sloyOblast.push(
      `<path class="${st.cls}"${st.data} d="${pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${px(p[0])} ${px(p[1])}`).join('')}Z" fill="url(#${patternId})" stroke="none"/>`,
    );
  }

  /* Углы: дуги (1–3) и значки прямого угла. */
  const ugly = vidimye.filter((e): e is Element & { tip: 'ugol' } => e.tip === 'ugol');
  /* Вложенные углы при одной вершине — разными радиусами: больший угол дальше. */
  const radiusUgla = new Map<Element, number>();
  for (const e of ugly) {
    if (e.pryamoy) continue;
    const vtx = E(e.v);
    const a = E(e.a);
    const b = E(e.b);
    const th = angleAt(a, vtx, b);
    const korotkaya = Math.min(dist(a, vtx), dist(b, vtx));
    let r = Math.max(PL.ugol.r, 7.5 / (th * RAD));
    const sosedi = ugly.filter((o) => o !== e && !o.pryamoy && o.v === e.v);
    const vlozhen = sosedi.filter((o) => {
      const tO = angleAt(E(o.a), vtx, E(o.b));
      if (tO >= th - 1e-6) return false;
      const ua = angleOf(sub(a, vtx));
      const ub = angleOf(sub(b, vtx));
      const uo1 = angleOf(sub(E(o.a), vtx));
      const uo2 = angleOf(sub(E(o.b), vtx));
      const vnutri = (x: number) => {
        let lo = ua;
        let hi = ub;
        if ((hi - lo + 360) % 360 > 180) [lo, hi] = [hi, lo];
        const span = (hi - lo + 360) % 360;
        return (x - lo + 360) % 360 <= span + 1e-6;
      };
      return vnutri(uo1) && vnutri(uo2);
    }).length;
    r += vlozhen * (PL.ugol.shag * 3 + 2);
    r = Math.min(r, korotkaya * 0.6);
    radiusUgla.set(e, r);
  }
  for (const e of ugly) {
    const vtx = E(e.v);
    const u = unit(sub(E(e.a), vtx));
    const w = unit(sub(E(e.b), vtx));
    const st = stil(e);
    const iz = e.vydelit === 'iskomoe';
    const color = novoe(e)
      ? PL.podskazka
      : iz
        ? PL.iskomoe
        : sloyOf(e) !== 'uslovie'
          ? PL.podskazka
          : PL.ink;
    const wid = iz || novoe(e) ? 2.4 : PL.width.mark;
    const th = angleAt(E(e.a), vtx, E(e.b));
    if (e.pryamoy) {
      const k = PL.ugol.rPryamoy;
      const p1 = add(vtx, mul(u, k));
      const p2 = add(p1, mul(w, k));
      const p3 = add(vtx, mul(w, k));
      sloyOtmetki.push(
        `<path class="${st.cls}"${st.data} d="M${px(p1[0])} ${px(p1[1])}L${px(p2[0])} ${px(p2[1])}L${px(p3[0])} ${px(p3[1])}" fill="none" stroke="${color}" stroke-width="${wid}"/>`,
      );
      prep.push({ tip: 'otrezok', a: p1, b: p2, r: wid / 2, chto: `прямой угол ${e.v}` });
      prep.push({ tip: 'otrezok', a: p2, b: p3, r: wid / 2, chto: `прямой угол ${e.v}` });
      if (Math.abs(th - 90) > 0.5 && !scena.skhematichno) {
        problems.push(`значок прямого угла при ${e.v}, а угол ${th.toFixed(1)}°`);
      }
      continue;
    }
    if (th < POROG - 0.01) {
      problems.push(
        `отмеченный угол ${e.a}${e.v}${e.b} = ${th.toFixed(1)}° меньше порога ${POROG}°`,
      );
    }
    const r0 = radiusUgla.get(e) ?? PL.ugol.r;
    const n = e.dugi ?? 1;
    const sweep = u[0] * w[1] - u[1] * w[0] > 0 ? 1 : 0;
    const d: string[] = [];
    for (let i = 0; i < n; i += 1) {
      const r = r0 + i * PL.ugol.shag;
      const p1 = add(vtx, mul(u, r));
      const p2 = add(vtx, mul(w, r));
      d.push(`M${px(p1[0])} ${px(p1[1])}A${px(r)} ${px(r)} 0 0 ${sweep} ${px(p2[0])} ${px(p2[1])}`);
      /* Дуга для проверки подписей — ломаной. */
      const a0 = Math.atan2(u[1], u[0]);
      const steps = 8;
      let prev = p1;
      for (let k = 1; k <= steps; k += 1) {
        const t = a0 + (sweep ? 1 : -1) * th * RAD * (k / steps);
        const q: T2 = [vtx[0] + Math.cos(t) * r, vtx[1] + Math.sin(t) * r];
        prep.push({ tip: 'otrezok', a: prev, b: q, r: wid / 2, chto: `дуга угла ${e.v}` });
        prev = q;
      }
    }
    if (iz) {
      /* Искомый угол — с лёгкой заливкой сектора: видно и в ч/б. */
      const p1 = add(vtx, mul(u, r0));
      const p2 = add(vtx, mul(w, r0));
      sloyOtmetki.push(
        `<path class="pl-sektor" d="M${px(vtx[0])} ${px(vtx[1])}L${px(p1[0])} ${px(p1[1])}A${px(r0)} ${px(r0)} 0 0 ${sweep} ${px(p2[0])} ${px(p2[1])}Z" fill="${PL.iskomoe}" fill-opacity="0.14" stroke="none"/>`,
      );
    }
    sloyOtmetki.push(
      `<path class="${st.cls}"${st.data} d="${d.join('')}" fill="none" stroke="${color}" stroke-width="${wid}"/>`,
    );
    if (e.znachenie !== undefined) {
      const bis = unit(add(u, w));
      zadaniyaZnach.push({
        e,
        yakor: add(vtx, mul(bis, r0 + (n - 1) * PL.ugol.shag)),
        napr: bis,
        vdol: null,
      });
    }
  }

  /* Точки (центр окружности и отмеченные точки). */
  for (const e of vidimye) {
    if (e.tip !== 'tochka') continue;
    const c = E(e.t);
    const st = stil(e);
    sloyTochki.push(
      `<circle class="${st.cls}"${st.data} cx="${px(c[0])}" cy="${px(c[1])}" r="${PL.tochkaR}" fill="${novoe(e) ? PL.podskazka : PL.ink}"/>`,
    );
    prep.push({ tip: 'tochka', c, r: PL.tochkaR, chto: `точка ${e.t}` });
  }

  /* Видимые точки: для проверок вырожденности и подписей. */
  const vidimyeTochki = new Set<string>();
  for (const e of vidimye) for (const n of tochkiElementa(e)) vidimyeTochki.add(n);
  for (const n of vidimyeTochki) geomTochki.push(E(n));

  const imena = [...vidimyeTochki];

  /* 6. Подписи точек. */
  const podpisi = scena.podpisi ?? true;
  const bez = new Set(scena.bezPodpisi ?? []);
  const kPodpisi = imena.filter(
    (n) => !bez.has(n) && (podpisi === true || (Array.isArray(podpisi) && podpisi.includes(n))),
  );
  /* Близкие точки: подписанные — не ближе minMezhduTochkami (иначе
     буквы не различить), неподписанные — просто не слипаются. */
  const podpisany = new Set(kPodpisi);
  for (let i = 0; i < imena.length; i += 1) {
    for (let j = i + 1; j < imena.length; j += 1) {
      const d = dist(E(imena[i]!), E(imena[j]!));
      const min = podpisany.has(imena[i]!) && podpisany.has(imena[j]!) ? PL.minMezhduTochkami : 4;
      if (d < min) problems.push(`точки ${imena[i]} и ${imena[j]} ближе ${min} px`);
    }
  }
  const centr: T2 = geomTochki.length
    ? [
        geomTochki.reduce((a, p) => a + p[0], 0) / geomTochki.length,
        geomTochki.reduce((a, p) => a + p[1], 0) / geomTochki.length,
      ]
    : [0, 0];

  /* Соседи точки по видимым линиям — для направления «наружу». */
  const napravlenie = (n: string): T2 => {
    const p = E(n);
    let sum: T2 = [0, 0];
    let cnt = 0;
    for (const l of linii) {
      const a = S(l.a);
      const b = S(l.b);
      for (const [x, y] of [
        [a, b],
        [b, a],
      ] as const) {
        if (dist(x, p) < 0.5 && dist(y, p) > 0.5) {
          sum = add(sum, unit(sub(y, p)));
          cnt += 1;
        }
      }
      /* Точка внутри отрезка: обе стороны отрезка — соседи. */
      const t =
        ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / (dist(a, b) ** 2 || 1);
      if (t > 0.001 && t < 0.999) {
        const q = add(a, mul(sub(b, a), t));
        if (dist(q, p) < 0.5) {
          sum = add(sum, unit(sub(a, p)));
          sum = add(sum, unit(sub(b, p)));
          cnt += 2;
        }
      }
    }
    /* Точка на окружности — наружу по радиусу. */
    for (const e of vidimye) {
      if (e.tip !== 'okruzhnost') continue;
      const k = kr(e.okr);
      const c = S(k.c);
      if (Math.abs(dist(c, p) - k.r * s) < 0.5) {
        sum = add(sum, mul(unit(sub(c, p)), 1.2));
        cnt += 1;
      }
    }
    const naruzhu = unit(sub(p, centr));
    if (cnt === 0 || len2(sum) < 0.02) {
      if (cnt > 0) {
        /* Точка посреди прямой: перпендикуляр к ней, со стороны от центра фигуры. */
        return len2(naruzhu) > 0 ? naruzhu : [0, -1];
      }
      return len2(naruzhu) > 0 ? naruzhu : [0, -1];
    }
    const d = unit(mul(sum, -1));
    /* Смесь с направлением от центра: подпись не уходит внутрь фигуры. */
    return unit(add(mul(d, 1), mul(naruzhu, 0.35)));
  };

  const size = PL.font.razmer;
  const ramki: Ramka[] = R.ramki;
  const ramkaPryam = (r: Ramka): Pryam => ({
    left: r.x,
    top: r.y,
    right: r.x + r.w,
    bottom: r.y + r.h,
  });
  const zanyato: Prepyatstvie[] = [];

  /* Сначала точки с большим числом линий: им тесно. */
  const poryadok = [...kPodpisi].sort((a, b) => stepen(b) - stepen(a));
  function stepen(n: string): number {
    const p = E(n);
    let c = 0;
    for (const l of linii) if (dist(S(l.a), p) < 0.5 || dist(S(l.b), p) < 0.5) c += 1;
    return c;
  }

  for (const n of poryadok) {
    const tekst = imya(n);
    const p = E(n);
    const osn = tekst.replace(/_?\d+$/, '');
    const ind = tekst.slice(osn.length).replace('_', '');
    const w = shirinaTeksta(osn, size) + (ind ? shirinaTeksta(ind, size * 0.7) : 0) + 2;
    const h = size * 0.74 + (ind ? size * 0.2 : 0);
    const d0 = napravlenie(n);
    const a0 = Math.atan2(d0[1], d0[0]);
    const chuzhie = geomTochki
      .filter((q) => dist(q, p) > 0.5)
      .map((q) => ({ tip: 'tochka' as const, c: q, r: 3, chto: 'чужая точка' }));
    const vse = [...prep, ...zanyato, ...chuzhie];
    let luchshiy: { r: Ramka; score: number; min: number; chto: string } | null = null;
    let vybran: Ramka | null = null;
    for (const otst of PL.otstupy) {
      const kandidaty: { r: Ramka; score: number }[] = [];
      for (let k = 0; k < 24; k += 1) {
        const da = (Math.ceil(k / 2) * (k % 2 === 0 ? 1 : -1) * 15 * Math.PI) / 180;
        const t = a0 + da;
        const dx = Math.cos(t);
        const dy = Math.sin(t);
        const ext2 = (Math.abs(dx) * w) / 2 + (Math.abs(dy) * h) / 2;
        const cx = p[0] + dx * (otst + ext2);
        const cy = p[1] + dy * (otst + ext2);
        kandidaty.push({
          r: { kind: 'tochka', id: n, x: cx - w / 2, y: cy - h / 2, w, h },
          score: Math.abs(da) * 20 + otst,
        });
      }
      kandidaty.sort((x, y) => x.score - y.score);
      for (const c of kandidaty) {
        const b = blizhayshee(ramkaPryam(c.r), vse);
        if (b.min >= PL.gap) {
          vybran = c.r;
          break;
        }
        if (luchshiy === null || b.min > luchshiy.min)
          luchshiy = { r: c.r, score: c.score, min: b.min, chto: b.chto };
      }
      if (vybran) break;
    }
    if (vybran === null) {
      vybran = (luchshiy as { r: Ramka }).r;
      problems.push(
        `подпись ${tekst} не помещается: мешает ${(luchshiy as { chto: string }).chto}`,
      );
    }
    ramki.push(vybran);
    zanyato.push({ tip: 'pryam', p: ramkaPryam(vybran), chto: `подпись ${tekst}` });
    const base = vybran.y + size * 0.72;
    const tx = vybran.x + 1;
    sloyPodpisi.push(
      `<text class="pl-bukva" x="${px(tx)}" y="${px(base)}" font-family="${PL.font.bukva}" font-style="italic" font-size="${size}" fill="${PL.ink}" stroke="${PL.bg}" stroke-width="3" paint-order="stroke" stroke-linejoin="round">${esc(osn)}${ind ? `<tspan font-size="${px(size * 0.7)}" font-style="normal" font-family="${PL.font.chislo}" dy="${px(size * 0.22)}">${esc(ind)}</tspan>` : ''}</text>`,
    );
    R.teksty.push(tekst);
  }

  /* Значения у элементов: числа условия (по настройке), подсказки, решение. */
  const naUchitel = rezhim.rezhim === 'uchitel';
  /* Значения, по которым проверяется «ответ не виден»: данные условия не в счёт. */
  const proverochnye: string[] = [];
  for (const z of zadaniyaZnach) {
    const e = z.e;
    if (e.znachenie === undefined) continue;
    if (e.otvet && !naUchitel) continue;
    /* Слой условия: на листе ученика числа — только по настройке chisla;
       в подсказке подписаны данные, у учителя — данные и ответ. */
    if (sloyOf(e) === 'uslovie' && !optsii.chisla && !novoe(e)) {
      const pokazat =
        (rezhim.rezhim === 'podskazka' && e.vydelit === 'dano') ||
        (naUchitel && (e.vydelit === 'dano' || e.otvet === true));
      if (!pokazat) continue;
    }
    const tekst = e.znachenie;
    const chislo = ZNACHENIE_CHISLO.test(tekst);
    const zs = PL.font.razmerZnach;
    const w = shirinaTeksta(tekst, zs) + 3;
    const h = zs * 0.78;
    const vse = [...prep, ...zanyato];
    const kandidaty: Ramka[] = [];
    if (z.vdol) {
      const [a, b] = z.vdol;
      const u = unit(sub(b, a));
      const nr: T2 = [-u[1], u[0]];
      const m = z.yakor;
      const naruzhu = (m[0] - centr[0]) * nr[0] + (m[1] - centr[1]) * nr[1] >= 0 ? 1 : -1;
      for (const otst of [4, 8, 13, 19, 26, 34]) {
        for (const t of [0, 0.12, -0.12, 0.25, -0.25, 0.36, -0.36]) {
          for (const side of [naruzhu, -naruzhu]) {
            const ext2 = (Math.abs(nr[0]) * w) / 2 + (Math.abs(nr[1]) * h) / 2;
            const c = add(add(m, mul(sub(b, a), t)), mul(nr, side * (otst + ext2)));
            kandidaty.push({
              kind: 'znachenie',
              id: tekst,
              x: c[0] - w / 2,
              y: c[1] - h / 2,
              w,
              h,
            });
          }
        }
      }
    } else if (z.napr) {
      const d = z.napr;
      /* Ближе к биссектрисе и к дуге — лучше; кандидаты по возрастанию цены. */
      const s: { r: Ramka; cena: number }[] = [];
      for (const otst of [3, 7, 12, 18, 25, 34, 45, 58, 72, 90]) {
        for (const da of [0, 8, -8, 16, -16, 28, -28, 45, -45, 70, -70, 110, -110, 180]) {
          const dd = rotate(d, [0, 0], da);
          const ext2 = (Math.abs(dd[0]) * w) / 2 + (Math.abs(dd[1]) * h) / 2;
          const c = add(z.yakor, mul(dd, otst + ext2));
          s.push({
            r: { kind: 'znachenie', id: tekst, x: c[0] - w / 2, y: c[1] - h / 2, w, h },
            cena: otst + Math.abs(da) * 0.5,
          });
        }
      }
      s.sort((x, y) => x.cena - y.cena);
      kandidaty.push(...s.map((x) => x.r));
    }
    let vybran: Ramka | null = null;
    let luchshiy: { r: Ramka; min: number; chto: string } | null = null;
    for (const c of kandidaty) {
      const b = blizhayshee(ramkaPryam(c), vse);
      if (b.min >= PL.gap) {
        vybran = c;
        break;
      }
      if (luchshiy === null || b.min > luchshiy.min) luchshiy = { r: c, min: b.min, chto: b.chto };
    }
    if (vybran === null) {
      if (luchshiy === null) continue;
      vybran = luchshiy.r;
      problems.push(`значение ${tekst} не помещается: мешает ${luchshiy.chto}`);
    }
    ramki.push(vybran);
    if (e.vydelit !== 'dano') proverochnye.push(tekst);
    zanyato.push({ tip: 'pryam', p: ramkaPryam(vybran), chto: `значение ${tekst}` });
    const color =
      novoe(e) || sloyOf(e) !== 'uslovie'
        ? PL.podskazka
        : e.vydelit === 'iskomoe'
          ? PL.iskomoe
          : PL.ink;
    sloyPodpisi.push(
      `<text class="pl-znachenie" x="${px(vybran.x + vybran.w / 2)}" y="${px(vybran.y + zs * 0.74)}" text-anchor="middle" font-family="${chislo ? PL.font.chislo : PL.font.bukva}"${chislo ? '' : ' font-style="italic"'} font-size="${zs}" fill="${color}" stroke="${PL.bg}" stroke-width="3" paint-order="stroke" stroke-linejoin="round">${esc(tekst)}</text>`,
    );
    R.teksty.push(tekst);
  }

  R.prepyatstviya = prep;

  /* 7. Ответ не читается с рисунка. */
  if (scena.otvet !== undefined && !naUchitel) {
    const norm = (t: string) => t.replace(/\s|°/g, '').replace('.', ',');
    const o = norm(scena.otvet);
    for (const t of proverochnye) {
      if (norm(t) === o) problems.push(`на рисунке виден ответ ${scena.otvet}`);
    }
  }

  /* Проверки согласованности с условием (на точной геометрии сцены). */
  problems.push(...proverit(scena, v.tochki, v.okruzhnosti));

  /* Рамка рисунка: геометрия + подписи + поле. */
  const xs: number[] = [];
  const ys: number[] = [];
  for (const q of geomTochki) {
    xs.push(q[0]);
    ys.push(q[1]);
  }
  for (const o of prep) {
    if (o.tip === 'otrezok') {
      xs.push(o.a[0], o.b[0]);
      ys.push(o.a[1], o.b[1]);
    } else if (o.tip === 'krug') {
      xs.push(o.c[0] - o.r, o.c[0] + o.r);
      ys.push(o.c[1] - o.r, o.c[1] + o.r);
    }
  }
  for (const r of ramki) {
    xs.push(r.x, r.x + r.w);
    ys.push(r.y, r.y + r.h);
  }
  const f = PL.pole;
  const vx = Math.min(...xs) - f;
  const vy = Math.min(...ys) - f;
  const vw = Math.max(...xs) + f - vx;
  const vh = Math.max(...ys) + f - vy;
  R.width = vw;
  R.height = vh;

  const alt = optsii.alt;
  const head =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${px(vx)} ${px(vy)} ${px(vw)} ${px(vh)}" width="${px(vw)}" height="${px(vh)}" class="pl" role="img"` +
    (alt ? ` aria-label="${esc(alt)}"` : ' aria-hidden="true"') +
    ' style="max-width:100%;height:auto">' +
    (alt ? `<title>${esc(alt)}</title>` : '');
  const defs = nuzhenUzor
    ? `<defs><pattern id="${patternId}" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)"><rect width="7" height="7" fill="${PL.iskomoe}" fill-opacity="0.08"/><line x1="0" y1="0" x2="0" y2="7" stroke="${PL.iskomoe}" stroke-width="1.1" stroke-opacity="0.55"/></pattern></defs>`
    : '';
  return [
    head,
    defs,
    `<rect x="${px(vx)}" y="${px(vy)}" width="${px(vw)}" height="${px(vh)}" fill="${PL.bg}"/>`,
    ...sloyOblast,
    ...sloyOkr,
    ...sloyLinii,
    ...sloyOtmetki,
    ...sloyTochki,
    ...sloyPodpisi,
    '</svg>',
  ].join('');
}

/* Значения ставятся после подписей точек; список заполняется по ходу рисования. */
interface ZadanieZnach {
  e: Element;
  yakor: T2;
  napr: T2 | null;
  vdol: [T2, T2] | null;
}
function len2(v: T2): number {
  return v[0] * v[0] + v[1] * v[1];
}

/* ── Проверки согласованности ────────────────────────────────────── */

export function proverit(scena: Scena, P: Record<string, T2>, K: Record<string, Krug>): string[] {
  const out: string[] = [];
  const p = (n: string) => {
    const q = P[n];
    if (q === undefined) throw new Error(`проверка: точки ${n} нет`);
    return q;
  };
  const tol = 1e-6;
  for (const pr of scena.proverki ?? []) {
    if ('ravny' in pr) {
      const d = pr.ravny.map(([a, b]) => dist(p(a), p(b)));
      if (Math.max(...d) - Math.min(...d) > tol * Math.max(...d)) {
        out.push(`отрезки ${pr.ravny.map((x) => x.join('')).join(', ')} не равны`);
      }
    } else if ('gradusy' in pr) {
      if (scena.skhematichno) continue;
      const [a, b, c] = pr.ugol;
      const u = angleAt(p(a), p(b), p(c));
      if (Math.abs(u - pr.gradusy) > 1e-6)
        out.push(`угол ${a}${b}${c} = ${u.toFixed(3)}°, а в условии ${pr.gradusy}°`);
    } else if ('vid' in pr) {
      const [a, b, c] = pr.ugol;
      const u = angleAt(p(a), p(b), p(c));
      const ok =
        pr.vid === 'tupoy'
          ? u > 90 + 1e-6
          : pr.vid === 'ostryy'
            ? u < 90 - 1e-6
            : Math.abs(u - 90) < 1e-6;
      if (!ok) out.push(`угол ${a}${b}${c} = ${u.toFixed(1)}°, а должен быть ${pr.vid}`);
    } else if ('naPryamoy' in pr) {
      const [a, b, ...rest] = pr.naPryamoy.map(p);
      for (const q of rest) {
        const cr = (b![0] - a![0]) * (q[1] - a![1]) - (b![1] - a![1]) * (q[0] - a![0]);
        if (Math.abs(cr) > 1e-6 * (dist(a!, b!) ** 2 + 1))
          out.push(`точки ${pr.naPryamoy.join('')} не на одной прямой`);
      }
    } else if ('parallelny' in pr) {
      const [[a, b], [c, d]] = pr.parallelny;
      const u = sub(p(b), p(a));
      const w = sub(p(d), p(c));
      if (Math.abs(u[0] * w[1] - u[1] * w[0]) > 1e-6 * Math.hypot(...u) * Math.hypot(...w)) {
        out.push(`${a}${b} не параллельна ${c}${d}`);
      }
    } else if ('naOkruzhnosti' in pr) {
      const k = K[pr.naOkruzhnosti];
      if (k === undefined) throw new Error(`проверка: окружности ${pr.naOkruzhnosti} нет`);
      for (const n of pr.tochki) {
        if (Math.abs(dist(k.c, p(n)) - k.r) > 1e-6 * k.r)
          out.push(`точка ${n} не на окружности ${pr.naOkruzhnosti}`);
      }
    }
  }
  return out;
}
