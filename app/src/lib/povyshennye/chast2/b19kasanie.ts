/**
 * №19, шаблон b19.koren4 с оформлением «касание» (PB19.oformlenie):
 * то же уравнение √(R² − x⁴) + c = a·x² − m·a, но решение учителя
 * строится вокруг формулы расстояния от точки до прямой — рамка теории
 * перед выкладками, отбор касательных, граничные положения прямой,
 * поворот прямой вокруг точки A(m; −c), рисунок с тремя прямыми и
 * сноска «почему не в лоб» после ответа.
 *
 * Оформление рассчитано на точку A справа внизу от дуги (m > R, c > 0)
 * и на вопрос «ровно два решения»: на нём держатся слова «правее дуги»,
 * «ниже дуги» и порядок особых положений. Числа — точные (дроби
 * и u ± k√m), число решений на промежутках — тот же счёт, что у b19.
 */

import { add, div, mul, rat, ratTex, sub, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { THEME } from '@/lib/graph/renderer.js';
import { BUKVY, CHISLA } from '@/lib/risunki/shrifty.js';
import { skTex, skToNumber, type SKornem } from './chisla';
import { dec, sklon } from './tex';
import type { Etap, Ramka } from './types';

export interface DannyeKasaniya {
  R: number;
  c: number;
  m: number;
  /** Особые a по возрастанию: через (0; R) — 'A', через (R; 0) — 'B', касание дуги — 'kas'. */
  list: readonly { a: SKornem; vid: 'A' | 'B' | 'kas' }[];
  /** Касания окружности вне дуги. */
  kasVne: readonly SKornem[];
  /** Коэффициенты условия касания (m² − R²)a² + 2mca + c² − R² = 0. */
  kv: readonly [number, number, number];
  /** Точки дуги (значения t) на прямой с коэффициентом a. */
  tochki: (a: number) => number[];
  /** Множество ответа в TeX. */
  otvet: string;
}

export interface ReshenieKasaniya {
  reshenie: Etap[];
  snoska: Ramka;
}

const DA = '<span class="c2-znak c2-znak--da" aria-label="подходит">✔</span>';
const NET = '<span class="c2-znak c2-znak--net" aria-label="не подходит">✘</span>';

/** «+5», «−5», пусто для 0 — слагаемое в TeX. */
const sl = (k: number) => (k === 0 ? '' : k > 0 ? `+${k}` : `${k}`);
/** Коэффициент перед буквой: 1 → «», −1 → «−». */
const kf = (k: number) => (k === 1 ? '' : k === -1 ? '-' : `${k}`);
/** Многочлен αa² + βa + γ в TeX. */
const kvTex = ([A2, A1, A0]: readonly [number, number, number]) =>
  `${kf(A2)}a^2${A1 === 0 ? '' : A1 > 0 ? `+${kf(A1)}a` : `-${kf(-A1)}a`}${sl(A0)}`;
const resheniy = (n: number) => `${n} ${sklon(n, 'решение', 'решения', 'решений')}`;
/** Точка (t; y) с десятичной запятой, два знака. */
const pt = (t: number, y: number) => `(${dec(t, 2)};\\,${dec(y, 2)})`;

/** Корни αa² + βa + γ = 0 одной записью: «\dfrac{-20\pm12\sqrt{2}}{7}». */
function kornyPmTex(x: SKornem): string {
  /* x = u + k√m; знаменатель общий, k берётся по модулю. */
  const den = x.u.d > x.k.d ? x.u.d : x.k.d;
  const U = (x.u.n * den) / x.u.d;
  const K = ((x.k.n < 0n ? -x.k.n : x.k.n) * den) / x.k.d;
  const kor = `${K === 1n ? '' : K}\\sqrt{${x.m}}`;
  const chisl = U === 0n ? `\\pm${kor}` : `${U}\\pm${kor}`;
  return den === 1n ? chisl : `\\dfrac{${chisl}}{${den}}`;
}

export function reshenieKasaniya(d: DannyeKasaniya): ReshenieKasaniya {
  const { R, c, m, list, kasVne, kv, tochki } = d;
  if (!(m > R && c > 0)) throw new Error('b19 «касание»: точка A должна быть справа внизу от дуги');
  const R2 = R * R;
  const aB = list.find((o) => o.vid === 'B');
  const aA = list.find((o) => o.vid === 'A');
  if (aB === undefined || aA === undefined)
    throw new Error('b19 «касание»: нет граничных положений');

  /* Обе касательные — по возрастанию: a₁, a₂. */
  const kasVse = [...list.filter((o) => o.vid === 'kas').map((o) => o.a), ...kasVne].sort(
    (x, y) => skToNumber(x) - skToNumber(y),
  );
  const imya = new Map<SKornem, string>(kasVse.map((a, i) => [a, `a_${i + 1}`]));
  const naDuge = new Set(list.filter((o) => o.vid === 'kas').map((o) => o.a));

  const pryamaya = `a(t-${m})-${c}`;
  const At = `A(${m};\\,${-c})`;
  const tR = `t\\in(0;\\,${R}]`;

  /* ── 1. Замена ─────────────────────────────────────────────── */
  const zamena: Etap = {
    title: 'Замена',
    lines: [
      `Пусть $t=x^2$, $t\\ge0$. Уравнение принимает вид $\\sqrt{${R2}-t^2}=${pryamaya}$.`,
      'Каждому $t>0$ соответствуют **два** значения $x=\\pm\\sqrt t$, значению $t=0$ — **одно**: $x=0$.',
      `Значит, исходное уравнение имеет ровно два решения $\\Leftrightarrow$ уравнение относительно $t$ имеет ровно один корень на $(0;\\,${R}]$ и $t=0$ корнем не является.`,
      'Комбинация «$t=0$ и ещё корни $t>0$» даёт нечётное число решений: $1+2k\\ne2$.',
    ],
  };

  /* ── 2. Графическая интерпретация ──────────────────────────── */
  const grafiki: Etap = {
    title: 'Графическая интерпретация',
    lines: [
      `$y=\\sqrt{${R2}-t^2}$, $t\\in[0;\\,${R}]$, — четверть окружности $t^2+y^2=${R2}$ ($y\\ge0$, $t\\ge0$): дуга от $(0;\\,${R})$ до $(${R};\\,0)$.`,
      `$y=${pryamaya}$ — пучок прямых через точку $${At}$, $a$ — угловой коэффициент.`,
      `Нужно найти $a$, при которых прямая пересекает дугу ровно в одной точке с $${tR}$ и не проходит через $(0;\\,${R})$.`,
    ],
  };

  /* ── 3. Касание: формула расстояния ───────────────────────── */
  const teoriya: Ramka = {
    vid: 'teoriya',
    title: 'Расстояние от точки до прямой',
    lines: ['Расстояние от точки $M(x_0;\\,y_0)$ до прямой $Ax+By+C=0$:'],
    formula: 'd=\\dfrac{\\left|Ax_0+By_0+C\\right|}{\\sqrt{A^2+B^2}}',
    posle: ['Прямая касается окружности радиуса $R$ с центром $M$ $\\Leftrightarrow$ $d=R$.'],
  };
  const [A2, A1, A0] = kv;
  const kasanieStroki = kasVse.map((a) => {
    const av = skToNumber(a);
    const k = (m * av + c) / (av * av + 1);
    const t = k * av;
    const y = -k;
    const nazv = imya.get(a)!;
    return naDuge.has(a)
      ? `$${nazv}=${skTex(a)}\\approx${dec(av, 2)}$: точка касания $\\approx${pt(t, y)}$ лежит на дуге ${DA} — один корень $t\\in(0;\\,${R})$, два решения $x$.`
      : `$${nazv}=${skTex(a)}\\approx${dec(av, 2)}$: точка касания $\\approx${pt(t, y)}$ ${y < 0 ? 'в нижней полуплоскости' : 'вне дуги'} — не подходит ${NET}.`;
  });
  const kasanie: Etap = {
    title: 'Касание: формула расстояния',
    ramka: teoriya,
    lines: [
      `Запишем прямую в общем виде: $at-y-${m}a-${c}=0$ ($A=a$, $B=-1$, $C=-${m}a-${c}$).`,
      `Центр окружности $O(0;\\,0)$, радиус $R=${R}$. Условие касания $d=R$:`,
      `$\\dfrac{\\left|-${m}a-${c}\\right|}{\\sqrt{a^2+1}}=${R}$, $\\;(${m}a+${c})^2=${R2}(a^2+1)$, $\\;${kvTex([A2, A1, A0])}=0$, $\\;a=${kornyPmTex(kasVse[0]!)}$.`,
      'Отбор: точка касания должна лежать на нашей дуге ($t\\in(0;\\,' + R + ')$, $y\\ge0$).',
      ...kasanieStroki,
    ],
    melko: [
      `Точка касания — основание перпендикуляра из $O$ на прямую: $\\dfrac{${m}a+${c}}{a^2+1}\\cdot(a;\\,-1)$.`,
    ],
  };

  /* ── 4. Граничные положения ────────────────────────────────── */
  const aBr: Rat = rat(c, R - m);
  const aAr: Rat = rat(-(R + c), m);
  if (toNumber(aBr) !== skToNumber(aB.a) || toNumber(aAr) !== skToNumber(aA.a))
    throw new Error('b19 «касание»: граничные положения не сошлись');
  const kv1 = add(mul(aBr, aBr), rat(1));
  /* Через (R; 0): y = a(t − R), вторая точка t = R(a² − 1)/(a² + 1). */
  const tB2 = div(mul(rat(R), sub(mul(aBr, aBr), rat(1))), kv1);
  const yB2 = mul(aBr, sub(tB2, rat(R)));
  const tB2na = toNumber(tB2) >= 0 && toNumber(tB2) < R && toNumber(yB2) >= 0;
  const nB = tochki(toNumber(aBr)).reduce((s, t) => s + (t < 1e-9 ? 1 : 2), 0);
  /* Через (0; R): y = at + R, вторая точка t = −2aR/(a² + 1). */
  const kv2 = add(mul(aAr, aAr), rat(1));
  const tA2 = div(mul(rat(-2 * R), aAr), kv2);
  const yA2 = add(mul(aAr, tA2), rat(R));
  const tA2na = toNumber(tA2) > 0 && toNumber(tA2) <= R && toNumber(yA2) >= 0;
  const nA = tochki(toNumber(aAr)).reduce((s, t) => s + (t < 1e-9 ? 1 : 2), 0);
  const granicy: Etap = {
    title: 'Граничные положения прямой',
    lines: [
      `Через $(${R};\\,0)$: $0=a(${R}-${m})-${c}$, $a=${ratTex(aBr)}$. ` +
        (tB2na
          ? `Тогда общих точек с дугой **две**: $t=${R}$ и $t=${ratTex(tB2)}$ (при нём $y=${ratTex(yB2)}>0$) — ${resheniy(nB)} ${NET}.`
          : `Тогда общая точка с дугой одна, $t=${R}$ — ${resheniy(nB)}.`),
      `Через $(0;\\,${R})$: $${R}=a(0-${m})-${c}$, $a=${ratTex(aAr)}$. ` +
        (tA2na
          ? `Общих точек с дугой две: $t=0$ и $t=${ratTex(tA2)}$ — ${resheniy(nA)}.`
          : `Вторая точка пересечения с окружностью $t=${ratTex(tA2)}$ даёт $y=${ratTex(yA2)}<0$ — не на дуге. Общая точка одна, $t=0$, — ${resheniy(nA)} $x=0$ ${NET}.`),
    ],
  };

  /* ── 5. Поворот прямой вокруг A ────────────────────────────── */
  const kasA = list.find((o) => o.vid === 'kas');
  const vrashchenie: Etap = {
    title: `Поворот прямой вокруг точки $${At}$`,
    risunok: chertezh({
      R,
      c,
      m,
      aKas: kasA === undefined ? null : skToNumber(kasA.a),
      aB: toNumber(aBr),
      aA: toNumber(aAr),
      imyaKas: kasA === undefined ? '' : (imya.get(kasA.a) ?? ''),
    }),
    lines: [
      'Будем увеличивать угловой коэффициент $a$ — прямая поворачивается вокруг $A$ и проходит найденные выше особые положения — касание и прямые через концы дуги:',
      ...stroki(d, imya),
    ],
  };

  /* ── Сноска после ответа ───────────────────────────────────── */
  const snoska: Ramka = {
    vid: 'primechanie',
    title: 'Почему не решаем «в лоб»?',
    lines: [
      `Аналитически пришлось бы при условиях $${pryamaya}\\ge0$ и $t\\in[0;\\,${R}]$ возвести уравнение в квадрат и получить квадратное уравнение $(a^2+1)t^2-2a(${m}a+${c})t+(${m}a+${c})^2-${R2}=0$, у которого $\\dfrac D4=-(${kvTex([A2, A1, A0])})$.`,
      `Дальше — явно выразить корни $t$ через $a$ (с радикалом от выражения с параметром) и для каждого проверить сразу три условия: $0<t\\le${R}$, $t\\ne0$ и $${pryamaya}\\ge0$. Это расположение корней квадратного трёхчлена относительно отрезка плюс отсев посторонних корней после возведения в квадрат — много случаев и высокий риск ошибки.`,
      'Графически левая часть — неподвижная четверть окружности, правая — пучок прямых через одну точку. Число решений видно при повороте прямой, а ключевые значения $a$ дают лишь граничные положения и одно условие касания $d=R$.',
      `Итог: то же уравнение $${kvTex([A2, A1, A0])}=0$ возникает и здесь, но как естественное условие касания — без перебора случаев.`,
    ],
  };

  return { reshenie: [zamena, grafiki, kasanie, granicy, vrashchenie], snoska };
}

/* ── Строки поворота: промежутки между особыми a и сами особые a ── */

type Vid = 'net-pravee' | 'net-nizhe' | 'dve' | 'odna' | 'kas' | 'nol' | 'nol-i-odna';

interface Stroka {
  lo: SKornem | null;
  hi: SKornem | null;
  loZ: boolean;
  hiZ: boolean;
  vid: Vid;
  n: number;
}

function vidPri(d: DannyeKasaniya, a: number, kas: boolean): { vid: Vid; n: number } {
  const ts = d.tochki(a);
  const n = ts.reduce((s, t) => s + (t < 1e-9 ? 1 : 2), 0);
  if (ts.length === 0) {
    /* Где прямая относительно дуги — по точке дуги на биссектрисе. */
    const q = d.R / Math.SQRT2;
    return { vid: a * (q - d.m) - d.c > q ? 'net-pravee' : 'net-nizhe', n };
  }
  const nol = ts.some((t) => t < 1e-9);
  if (nol) return { vid: ts.length === 1 ? 'nol' : 'nol-i-odna', n };
  if (ts.length === 2) return { vid: 'dve', n };
  return { vid: kas ? 'kas' : 'odna', n };
}

function stroki(d: DannyeKasaniya, imya: Map<SKornem, string>): string[] {
  const { R, list } = d;
  const vals = list.map((o) => skToNumber(o.a));
  const ryad: Stroka[] = [];
  for (let i = 0; i <= list.length; i += 1) {
    const lo = i === 0 ? null : list[i - 1]!.a;
    const hi = i === list.length ? null : list[i]!.a;
    const lv = lo === null ? vals[0]! - 10 : vals[i - 1]!;
    const hv = hi === null ? vals[list.length - 1]! + 10 : vals[i]!;
    ryad.push({ lo, hi, loZ: false, hiZ: false, ...vidPri(d, (lv + hv) / 2, false) });
    if (hi !== null)
      ryad.push({
        lo: hi,
        hi,
        loZ: true,
        hiZ: true,
        ...vidPri(d, vals[i]!, list[i]!.vid === 'kas'),
      });
  }
  /* Соседние куски с одной картиной сливаются: «a₁ < a ≤ −5». */
  const slit: Stroka[] = [];
  for (const s of ryad) {
    const last = slit[slit.length - 1];
    if (last && last.vid === s.vid && last.n === s.n) {
      last.hi = s.hi;
      last.hiZ = s.hiZ;
    } else slit.push({ ...s });
  }
  const nazv = (x: SKornem) => imya.get(x) ?? skTex(x);
  const OPIS: Record<Vid, string> = {
    'net-pravee': 'прямая проходит правее дуги',
    'net-nizhe': 'прямая проходит ниже дуги',
    dve: 'две общие точки с дугой',
    odna: `одна общая точка с дугой, $t\\in(0;\\,${R}]$`,
    kas: `касание, одна точка $t\\in(0;\\,${R})$`,
    nol: 'общая точка только $t=0$',
    'nol-i-odna': 'общие точки $t=0$ и ещё одна',
  };
  return slit.map((s) => {
    const promezh =
      s.lo !== null && s.lo === s.hi
        ? `a=${nazv(s.lo)}`
        : s.hi === null
          ? `a${s.loZ ? '\\ge' : '>'}${nazv(s.lo!)}`
          : `${s.lo === null ? '' : `${nazv(s.lo)}${s.loZ ? '\\le' : '<'}`}a${s.hiZ ? '\\le' : '<'}${nazv(s.hi)}`;
    return `$${promezh}$ — ${OPIS[s.vid]}: ${resheniy(s.n)}${s.n === 2 ? ` ${DA}` : ''}.`;
  });
}

/* ── Рисунок ──────────────────────────────────────────────────────
   Свой SVG, а не движок планиметрии: прямым нужны разные цвета и
   штрихи (на ч/б печати они различаются штрихом), легенда и
   увеличенный фрагмент у точки (R; 0), где касательная и прямая через
   (R; 0) почти сливаются. Цвета — токены THEME (те же, что у графиков
   №12 и чертежей планиметрии), шрифты подписей — общие для рисунков. */

interface ParamRis {
  R: number;
  c: number;
  m: number;
  aKas: number | null;
  aB: number;
  aA: number;
  imyaKas: string;
}

const C = THEME.colors;
const MINUS = '−';
const f1 = (x: number) => (Math.round(x * 10) / 10).toString();
const chislo = (x: number) => `${x < 0 ? MINUS : ''}${Math.abs(x)}`;

function chertezh(p: ParamRis): string {
  const { R, c, m } = p;
  const u = 30;
  const t0 = -R - 0.7;
  const t1 = m + 2.4;
  const y0 = -c - 1.1;
  const y1 = R + 2.2;
  const W = Math.round((t1 - t0) * u);
  const Hp = Math.round((y1 - y0) * u);
  const legH = 66;
  const H = Hp + legH;
  const X = (t: number) => (t - t0) * u;
  const Y = (y: number) => (y1 - y) * u;
  const id = `c2b19-${R}-${c}-${m}`;

  /* Касание: точка B — основание перпендикуляра из O. */
  const B: [number, number] | null =
    p.aKas === null
      ? null
      : (() => {
          const k = (m * p.aKas + c) / (p.aKas * p.aKas + 1);
          return [k * p.aKas, -k];
        })();

  const txt = (
    x: number,
    y: number,
    s: string,
    o: { anchor?: 'start' | 'middle' | 'end'; size?: number; bukva?: boolean; fill?: string } = {},
  ) =>
    `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${o.anchor ?? 'start'}" font-family="${o.bukva ? BUKVY : CHISLA}"${o.bukva ? ' font-style="italic"' : ''} font-size="${o.size ?? 13}" fill="${o.fill ?? C.axis}" stroke="${C.bg}" stroke-width="3" paint-order="stroke" stroke-linejoin="round">${s}</text>`;

  /* Прямая y = a(t − m) − c в пределах окна (обрезает clipPath). */
  const pryamaya = (
    a: number,
    X_: (t: number) => number,
    Y_: (y: number) => number,
    ta: number,
    tb: number,
  ) => [X_(ta), Y_(a * (ta - m) - c), X_(tb), Y_(a * (tb - m) - c)];
  const STIL = {
    kas: { color: C.lineA, w: 2.25, dash: '' },
    B: { color: C.lineB, w: 2, dash: '7 4' },
    A: { color: C.lineC, w: 2, dash: '9 3 2 3' },
  } as const;
  const liniya = (xy: number[], s: { color: string; w: number; dash: string }, kx = 1) =>
    `<line x1="${f1(xy[0]!)}" y1="${f1(xy[1]!)}" x2="${f1(xy[2]!)}" y2="${f1(xy[3]!)}" stroke="${s.color}" stroke-width="${s.w * kx}"${s.dash ? ` stroke-dasharray="${s.dash}"` : ''} stroke-linecap="round"/>`;
  const dugaD = (X_: (t: number) => number, Y_: (y: number) => number, r: number) =>
    `M${f1(X_(R))} ${f1(Y_(0))}A${f1(r)} ${f1(r)} 0 0 0 ${f1(X_(0))} ${f1(Y_(R))}`;
  const tochka = (x: number, y: number, fill: string = C.axis) =>
    `<circle cx="${f1(x)}" cy="${f1(y)}" r="3" fill="${fill}" stroke="${C.bg}" stroke-width="1.2"/>`;

  const lines: { a: number; s: (typeof STIL)[keyof typeof STIL] }[] = [
    { a: p.aA, s: STIL.A },
    { a: p.aB, s: STIL.B },
    ...(p.aKas === null ? [] : [{ a: p.aKas, s: STIL.kas }]),
  ];

  const o: string[] = [];
  o.push(
    `<svg class="c2-graf" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Четверть окружности, точка A и три прямые через A: касательная, через (${R}; 0) и через (0; ${R})">`,
    `<defs><clipPath id="${id}-p"><rect x="0" y="0" width="${W}" height="${Hp}"/></clipPath>` +
      `<marker id="${id}-s" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 1L9 5L0 9" fill="none" stroke="${C.axis}" stroke-width="1.6"/></marker></defs>`,
  );

  /* Оси со стрелками, подписи осей. */
  o.push(
    `<line x1="0" y1="${f1(Y(0))}" x2="${W - 2}" y2="${f1(Y(0))}" stroke="${C.axis}" stroke-width="1.25" marker-end="url(#${id}-s)"/>`,
    `<line x1="${f1(X(0))}" y1="${Hp}" x2="${f1(X(0))}" y2="2" stroke="${C.axis}" stroke-width="1.25" marker-end="url(#${id}-s)"/>`,
    txt(W - 6, Y(0) + 17, 't', { anchor: 'end', size: 16, bukva: true }),
    txt(X(0) + 8, 14, 'y', { size: 16, bukva: true }),
  );

  /* Направляющие к точке A. */
  o.push(
    `<path d="M${f1(X(m))} ${f1(Y(0))}V${f1(Y(-c))}H${f1(X(0))}" fill="none" stroke="${C.grid}" stroke-width="1" stroke-dasharray="3 3"/>`,
  );

  /* Окружность целиком — бледный пунктир, дуга графика — сплошная. */
  o.push(
    `<circle cx="${f1(X(0))}" cy="${f1(Y(0))}" r="${R * u}" fill="none" stroke="${C.grid}" stroke-width="1.4" stroke-dasharray="4 4"/>`,
    `<path d="${dugaD(X, Y, R * u)}" fill="none" stroke="${C.axis}" stroke-width="2.75" stroke-linecap="round"/>`,
  );

  /* Прямые. */
  o.push(`<g clip-path="url(#${id}-p)">`);
  for (const l of lines) o.push(liniya(pryamaya(l.a, X, Y, t0 - 1, t1 + 1), l.s));
  o.push('</g>');

  /* Перпендикуляр OB и точки. */
  if (B)
    o.push(
      `<line x1="${f1(X(0))}" y1="${f1(Y(0))}" x2="${f1(X(B[0]))}" y2="${f1(Y(B[1]))}" stroke="${C.axis}" stroke-width="1.1"/>`,
    );
  o.push(tochka(X(0), Y(0)), tochka(X(m), Y(-c)), tochka(X(0), Y(R)), tochka(X(R), Y(0)));
  if (B) o.push(tochka(X(B[0]), Y(B[1]), C.lineA));

  /* Подписи: O, A, B, деления. */
  o.push(
    txt(X(0) - 5, Y(0) + 16, 'O', { anchor: 'end', size: 15, bukva: true }),
    txt(X(m) + 8, Y(-c) + 5, 'A', { size: 15, bukva: true }),
    txt(X(-R), Y(0) + 16, chislo(-R), { anchor: 'middle', size: 12 }),
    txt(X(R) - 3, Y(0) + 17, chislo(R), { anchor: 'end', size: 12 }),
    txt(X(m) + 3, Y(0) + 16, chislo(m), { size: 12 }),
    txt(X(0) - 6, Y(R) - 4, chislo(R), { anchor: 'end', size: 12 }),
    txt(X(0) - 6, Y(-c) + 4, chislo(-c), { anchor: 'end', size: 12 }),
  );
  if (B) o.push(txt(X(B[0]) - 10, Y(B[1]) - 9, 'B', { anchor: 'end', size: 15, bukva: true }));

  /* Увеличенный фрагмент у (R; 0): касательная и прямая через (R; 0). */
  if (B) {
    const pad = 0.22;
    const zt0 = Math.min(B[0], R) - pad - 0.1;
    const zt1 = Math.max(B[0], R) + pad;
    const zy0 = Math.min(B[1], 0) - pad;
    const zy1 = Math.max(B[1], 0) + pad;
    const ix = X(R + 0.5);
    /* Фрагмент — во всю ширину справа от дуги, но выше оси t и её подписей. */
    const s = Math.min((W - 6 - ix) / (zt1 - zt0), (Y(0) - 30) / (zy1 - zy0));
    const iw = (zt1 - zt0) * s;
    const ih = (zy1 - zy0) * s;
    const iy = 8;
    const Xi = (t: number) => ix + (t - zt0) * s;
    const Yi = (y: number) => iy + (zy1 - y) * s;
    /* Рамка участка на основном чертеже и выноска к фрагменту. */
    o.push(
      `<rect x="${f1(X(zt0))}" y="${f1(Y(zy1))}" width="${f1((zt1 - zt0) * u)}" height="${f1((zy1 - zy0) * u)}" fill="none" stroke="${C.axis}" stroke-width="0.8" stroke-dasharray="2 2"/>`,
      `<line x1="${f1(X(zt1))}" y1="${f1(Y(zy1))}" x2="${f1(ix)}" y2="${f1(iy + ih)}" stroke="${C.axis}" stroke-width="0.6" stroke-dasharray="2 2"/>`,
      `<defs><clipPath id="${id}-z"><rect x="${f1(ix)}" y="${f1(iy)}" width="${f1(iw)}" height="${f1(ih)}"/></clipPath></defs>`,
      `<rect x="${f1(ix)}" y="${f1(iy)}" width="${f1(iw)}" height="${f1(ih)}" rx="4" fill="${C.bg}" stroke="${C.axis}" stroke-width="0.9"/>`,
      `<g clip-path="url(#${id}-z)">`,
      `<line x1="${f1(ix)}" y1="${f1(Yi(0))}" x2="${f1(ix + iw)}" y2="${f1(Yi(0))}" stroke="${C.axis}" stroke-width="1"/>`,
      `<circle cx="${f1(Xi(0))}" cy="${f1(Yi(0))}" r="${f1(R * s)}" fill="none" stroke="${C.grid}" stroke-width="1.4" stroke-dasharray="4 4"/>`,
      `<path d="${dugaD(Xi, Yi, R * s)}" fill="none" stroke="${C.axis}" stroke-width="2.75"/>`,
      ...lines
        .filter((l) => l.s !== STIL.A)
        .map((l) => liniya(pryamaya(l.a, Xi, Yi, zt0 - 0.5, zt1 + 0.5), l.s)),
      `<line x1="${f1(Xi(B[0]))}" y1="${f1(Yi(B[1]))}" x2="${f1(Xi(B[0] * 0.8))}" y2="${f1(Yi(B[1] * 0.8))}" stroke="${C.axis}" stroke-width="1.1"/>`,
      '</g>',
    );
    /* Прямой угол OB ⟂ касательной — квадратик у B. */
    const ux = -B[0] / R;
    const uy = -B[1] / R;
    const vx = uy;
    const vy = -ux;
    const q = 7 / s;
    const P = (dx: number, dy: number) => `${f1(Xi(B[0] + dx))} ${f1(Yi(B[1] + dy))}`;
    o.push(
      `<path d="M${P(ux * q, uy * q)}L${P(ux * q + vx * q, uy * q + vy * q)}L${P(vx * q, vy * q)}" fill="none" stroke="${C.axis}" stroke-width="1"/>`,
      tochka(Xi(R), Yi(0)),
      tochka(Xi(B[0]), Yi(B[1]), C.lineA),
      txt(Xi(B[0]) + 7, Yi(B[1]) + 5, 'B', { size: 14, bukva: true }),
      txt(Xi(R) - 5, Yi(0) + 15, chislo(R), { anchor: 'end', size: 12 }),
      txt(ix + iw / 2, iy + ih + 14, 'увеличено', { anchor: 'middle', size: 11, fill: C.axis }),
    );
  }

  /* Легенда: образец штриха и подпись. */
  const leg = [
    ...(p.aKas === null
      ? []
      : [
          {
            s: STIL.kas,
            t: `касательная, `,
            a: `${p.imyaKas.replace('a_', 'a')}`,
            z: `≈ ${chislo(+p.aKas.toFixed(2)).replace('.', ',')}`,
          },
        ]),
    { s: STIL.B, t: `через (${R}; 0), `, a: '', z: `= ${chislo(p.aB)}` },
    { s: STIL.A, t: `через (0; ${R}), `, a: '', z: `= ${chislo(p.aA)}` },
  ];
  leg.forEach((l, i) => {
    const y = Hp + 18 + i * 19;
    o.push(liniya([8, y - 4, 38, y - 4], l.s));
    const ind = l.a.replace(/^a/, '');
    o.push(
      `<text x="46" y="${y}" font-family="${CHISLA}" font-size="13" fill="${C.axis}">${l.t}<tspan font-family="${BUKVY}" font-style="italic">a</tspan>${ind ? `<tspan font-size="9.5" dy="3">${ind}</tspan><tspan dy="-3"> </tspan>` : ' '}${l.z.replace(/-/g, MINUS)}</text>`,
    );
  });

  o.push('</svg>');
  return o.join('');
}
