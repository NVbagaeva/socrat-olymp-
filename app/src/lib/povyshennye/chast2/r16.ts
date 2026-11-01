/**
 * №16 (варианты 31–36), свои задачи раздела. Три вида:
 *   pokazDrob — (b^{2x} − (b^α + b^β)·b^x + b^{α+β}) / (b^x − b^γ) ⋚ 0:
 *               t = b^x > 0, метод интервалов по t, обратно x = log_b t;
 *   logOdz    — log_q(x² − (u₁+u₂)x + u₁u₂) ≤ log_q(x + r): область
 *               определения и сравнение аргументов (q > 1 или q < 1);
 *   logKvadrat — log²_b(x + s) − (α+β)·log_b(x + s) + αβ ⋚ 0: квадратное
 *               относительно y = log_b(x + s).
 */

import type { Kusok, Mnozhestvo } from '@/lib/chast2/sravnenie';
import { rat, ratTex, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import type { Chast2Zadacha, Shablon2 } from './types';

export type PR16 =
  | { vid: 'pokazDrob'; b: 2 | 3; al: number; be: number; ga: number; znak: 'le' | 'ge' }
  | { vid: 'logOdz'; q: [number, number]; u1: number; u2: number; w1: number }
  | { vid: 'logKvadrat'; b: 2 | 3 | 5; s: number; al: number; be: number; znak: 'le' | 'ge' };

/** Точка числовой прямой: значение и запись. */
interface Tch {
  v: number;
  tex: string;
}
interface Kus {
  lo: Tch | null;
  hi: Tch | null;
  loZ: boolean;
  hiZ: boolean;
}

const tchInt = (n: number): Tch => ({ v: n, tex: `${n}` });
const tchRat = (q: Rat): Tch => ({ v: toNumber(q), tex: ratTex(q) });

/** Пересечение двух объединений промежутков. */
function peresech(a: Kus[], b: Kus[]): Kus[] {
  const out: Kus[] = [];
  for (const x of a)
    for (const y of b) {
      const loX = x.lo?.v ?? -Infinity;
      const loY = y.lo?.v ?? -Infinity;
      const hiX = x.hi?.v ?? Infinity;
      const hiY = y.hi?.v ?? Infinity;
      let lo: Tch | null;
      let loZ: boolean;
      if (loX > loY) [lo, loZ] = [x.lo, x.loZ];
      else if (loY > loX) [lo, loZ] = [y.lo, y.loZ];
      else [lo, loZ] = [x.lo, x.loZ && y.loZ];
      let hi: Tch | null;
      let hiZ: boolean;
      if (hiX < hiY) [hi, hiZ] = [x.hi, x.hiZ];
      else if (hiY < hiX) [hi, hiZ] = [y.hi, y.hiZ];
      else [hi, hiZ] = [x.hi, x.hiZ && y.hiZ];
      const l = lo?.v ?? -Infinity;
      const h = hi?.v ?? Infinity;
      if (l < h || (l === h && loZ && hiZ)) out.push({ lo, hi, loZ, hiZ });
    }
  return out.sort((p, q) => (p.lo?.v ?? -Infinity) - (q.lo?.v ?? -Infinity));
}

/** Знак-метод по корням (закрытые/открытые) и полюсам: множество, где выражение ⋚ 0. */
function znakMetod(
  tochki: { t: Tch; vid: 'nol' | 'polyus' }[],
  znakPravee: 1 | -1,
  nuzhno: 'le' | 'ge',
  levKray: Tch | null,
): Kus[] {
  const ts = [...tochki].sort((a, b) => a.t.v - b.t.v);
  /* Знак на каждом промежутке: справа от последней точки — znakPravee, при переходе через
     простой корень или полюс меняется. */
  const kuski: Kus[] = [];
  let znak = znakPravee;
  const znaki: number[] = [];
  for (let i = ts.length; i >= 0; i -= 1) {
    znaki[i] = znak;
    znak = -znak as 1 | -1;
  }
  for (let i = 0; i <= ts.length; i += 1) {
    const lo = i === 0 ? levKray : ts[i - 1]!.t;
    const hi = i === ts.length ? null : ts[i]!.t;
    const ok = nuzhno === 'le' ? znaki[i]! < 0 : znaki[i]! > 0;
    if (!ok) continue;
    const loZ = i > 0 && ts[i - 1]!.vid === 'nol';
    const hiZ = i < ts.length && ts[i]!.vid === 'nol';
    kuski.push({ lo, hi, loZ, hiZ });
  }
  /* Изолированные корни на стыке двух неподходящих промежутков в ответ не попадают (простые корни). */
  /* Склейка соседних промежутков через закрытую точку. */
  const sk: Kus[] = [];
  for (const k of kuski) {
    const prev = sk[sk.length - 1];
    if (prev && prev.hi && k.lo && prev.hi.v === k.lo.v && prev.hiZ && k.loZ) {
      prev.hi = k.hi;
      prev.hiZ = k.hiZ;
    } else sk.push({ ...k });
  }
  return sk;
}

const p2 = (b: number, e: number): Rat => (e >= 0 ? rat(b ** e) : rat(1, b ** -e));

export function chislaR16(p: PR16) {
  if (p.vid === 'pokazDrob') {
    const { al, be, ga } = p;
    if (new Set([al, be, ga]).size !== 3) throw new Error('r16: точки совпадают');
    /* По t: нули b^α, b^β (замкнуты при нестрогом), полюс b^γ; при t → +∞ дробь > 0.
       Отображение t ↦ log_b t монотонно, левый край t = 0 ⇔ x → −∞. */
    const tochki = [
      { t: tchInt(al), vid: 'nol' as const },
      { t: tchInt(be), vid: 'nol' as const },
      { t: tchInt(ga), vid: 'polyus' as const },
    ];
    const kuski = znakMetod(tochki, 1, p.znak, null);
    const S = toNumber(p2(p.b, al)) + toNumber(p2(p.b, be));
    const P = toNumber(p2(p.b, al + be));
    const G = toNumber(p2(p.b, ga));
    return { kuski, S, P, G };
  }
  if (p.vid === 'logKvadrat') {
    const { al, be, s, b } = p;
    if (!(al < be)) throw new Error('r16: α < β');
    const A = p2(b, al);
    const B = p2(b, be);
    const xA = tchRat({ n: A.n - BigInt(s) * A.d, d: A.d });
    const xB = tchRat({ n: B.n - BigInt(s) * B.d, d: B.d });
    const levyy = tchInt(-s);
    const kuski: Kus[] =
      p.znak === 'le'
        ? [{ lo: xA, hi: xB, loZ: true, hiZ: true }]
        : [
            { lo: levyy, hi: xA, loZ: false, hiZ: true },
            { lo: xB, hi: null, loZ: true, hiZ: false },
          ];
    return { kuski, A, B };
  }
  /* logOdz */
  const { u1, u2, w1 } = p;
  if (!(u1 < u2)) throw new Error('r16: u1 < u2');
  const w2 = u1 + u2 + 1 - w1;
  const r = u1 * u2 - w1 * w2;
  if (!(w1 < w2)) throw new Error('r16: w1 < w2');
  const q = toNumber(rat(p.q[0], p.q[1]));
  if (q === 1 || q <= 0) throw new Error('r16: основание');
  const odz1: Kus[] = [
    { lo: null, hi: tchInt(u1), loZ: false, hiZ: false },
    { lo: tchInt(u2), hi: null, loZ: false, hiZ: false },
  ];
  const odz2: Kus[] = [{ lo: tchInt(-r), hi: null, loZ: false, hiZ: false }];
  const sravn: Kus[] =
    q > 1
      ? [{ lo: tchInt(w1), hi: tchInt(w2), loZ: true, hiZ: true }]
      : [
          { lo: null, hi: tchInt(w1), loZ: false, hiZ: true },
          { lo: tchInt(w2), hi: null, loZ: true, hiZ: false },
        ];
  const kuski = peresech(peresech(odz1, odz2), sravn);
  if (kuski.length === 0) throw new Error('r16: пустое множество');
  return { kuski, w2, r, q };
}

function kusTex(k: Kus): string {
  if (k.lo !== null && k.hi !== null && k.lo.v === k.hi.v) return `\\{${k.lo.tex}\\}`;
  return `\\left${k.loZ ? '[' : '('}${k.lo?.tex ?? '-\\infty'};\\ ${k.hi?.tex ?? '+\\infty'}\\right${k.hiZ ? ']' : ')'}`;
}

function vPole(kuski: Kus[]): Mnozhestvo {
  const pl = (t: Tch | null, inf: string) =>
    t === null ? inf : t.tex.replace(/\\dfrac/g, '\\frac');
  return {
    kuski: kuski.map((k): Kusok =>
      k.lo !== null && k.hi !== null && k.lo.v === k.hi.v
        ? { t: 'tochka', x: pl(k.lo, '') }
        : {
            t: 'interval',
            lo: pl(k.lo, '-inf'),
            loZakr: k.loZ,
            hi: pl(k.hi, 'inf'),
            hiZakr: k.hiZ,
          },
    ),
  };
}

function osnTex(q: [number, number]): string {
  return q[1] === 1 ? `${q[0]}` : `\\frac{${q[0]}}{${q[1]}}`;
}

function sobrat(p: PR16): Chast2Zadacha {
  const ch = chislaR16(p);
  const otv = ch.kuski.map(kusTex).join('\\cup');
  let uslovie = '';
  let reshenie: Chast2Zadacha['reshenie'] = [];
  let razbor: Chast2Zadacha['razbor'] = [];
  if (p.vid === 'pokazDrob') {
    const c = ch as { S: number; P: number; G: number };
    const b2 = p.b * p.b;
    const zn = p.znak === 'le' ? '\\le' : '\\ge';
    uslovie = `Решите неравенство $\\dfrac{${b2}^x-${c.S}\\cdot${p.b}^x+${c.P}}{${p.b}^x-${c.G}}${zn}0$.`;
    const tA = p.b ** p.al;
    const tB = p.b ** p.be;
    reshenie = [
      {
        title: 'Замена',
        lines: [
          `Пусть $t=${p.b}^x>0$, тогда $${b2}^x=t^2$: $\\dfrac{t^2-${c.S}t+${c.P}}{t-${c.G}}${zn}0$.`,
          `Числитель раскладывается по теореме Виета: $t^2-${c.S}t+${c.P}=(t-${tA})(t-${tB})$.`,
        ],
      },
      {
        title: 'Метод интервалов по $t$',
        lines: [
          `Нули числителя $t=${tA}$ и $t=${tB}$${p.znak === 'le' || p.znak === 'ge' ? ' (входят в ответ)' : ''}, нуль знаменателя $t=${c.G}$ (не входит). При больших $t$ дробь положительна, знаки чередуются.`,
          `Учитываем $t>0$ и переходим к $x$: функция $${p.b}^x$ возрастает, $t=${tA}\\Leftrightarrow x=${p.al}$, $t=${tB}\\Leftrightarrow x=${p.be}$, $t=${c.G}\\Leftrightarrow x=${p.ga}$.`,
        ],
      },
      { title: 'Ответ', lines: [`$${otv}$.`] },
    ];
    razbor = [
      { slovo: 'Замена', formula: `t=${p.b}^x>0` },
      { slovo: 'Разложение числителя', formula: `(t-${tA})(t-${tB})` },
      { slovo: 'Метод интервалов', formula: `t-${c.G}\\ne0` },
      { slovo: 'Обратно к $x$', formula: otv },
    ];
  } else if (p.vid === 'logKvadrat') {
    const c = ch as { A: Rat; B: Rat };
    const zn = p.znak === 'le' ? '\\le' : '\\ge';
    const arg = p.s === 0 ? 'x' : `x${p.s > 0 ? '+' : ''}${p.s}`;
    const S = p.al + p.be;
    const P = p.al * p.be;
    const lin =
      S === 0
        ? ''
        : `${S > 0 ? '-' : '+'}${Math.abs(S) === 1 ? '' : Math.abs(S)}\\log_{${p.b}}(${arg})`;
    const svob = P === 0 ? '' : `${P > 0 ? '+' : ''}${P}`;
    uslovie = `Решите неравенство $\\log^2_{${p.b}}(${arg})${lin}${svob}${zn}0$.`;
    reshenie = [
      {
        title: 'Область определения и замена',
        lines: [
          `ОДЗ: $${arg}>0$. Пусть $y=\\log_{${p.b}}(${arg})$: $y^2${S === 0 ? '' : `${S > 0 ? '-' : '+'}${Math.abs(S)}y`}${svob}=(y${p.al > 0 ? '-' : '+'}${Math.abs(p.al)})(y${p.be > 0 ? '-' : '+'}${Math.abs(p.be)})${zn}0$.`
            .replace(/\(y\+0\)/g, 'y')
            .replace(/\(y-0\)/g, 'y'),
          p.znak === 'le' ? `$${p.al}\\le y\\le${p.be}$.` : `$y\\le${p.al}$ или $y\\ge${p.be}$.`,
        ],
      },
      {
        title: 'Обратно к $x$',
        lines: [
          `Основание $${p.b}>1$, логарифм возрастает: $\\log_{${p.b}}(${arg})=${p.al}\\Leftrightarrow ${arg}=${ratTex(c.A)}$, $\\log_{${p.b}}(${arg})=${p.be}\\Leftrightarrow ${arg}=${ratTex(c.B)}$.`,
          p.znak === 'le'
            ? `$${ratTex(c.A)}\\le ${arg}\\le ${ratTex(c.B)}$ (ОДЗ выполнена).`
            : `$0<${arg}\\le ${ratTex(c.A)}$ или $${arg}\\ge ${ratTex(c.B)}$.`,
        ],
      },
      { title: 'Ответ', lines: [`$${otv}$.`] },
    ];
    razbor = [
      { slovo: 'ОДЗ', formula: `${arg}>0` },
      { slovo: 'Замена', formula: `y=\\log_{${p.b}}(${arg})` },
      {
        slovo: 'Квадратное неравенство',
        formula:
          p.znak === 'le'
            ? `${p.al}\\le y\\le${p.be}`
            : `y\\le${p.al}\\ \\text{или}\\ y\\ge${p.be}`,
      },
      { slovo: 'Ответ', formula: otv },
    ];
  } else {
    const c = ch as { w2: number; r: number; q: number };
    const S1 = p.u1 + p.u2;
    const P1 = p.u1 * p.u2;
    const kv = `x^2${S1 === 0 ? '' : `${S1 > 0 ? '-' : '+'}${Math.abs(S1) === 1 ? '' : Math.abs(S1)}x`}${P1 === 0 ? '' : `${P1 > 0 ? '+' : ''}${P1}`}`;
    const lin = c.r === 0 ? 'x' : `x${c.r > 0 ? '+' : ''}${c.r}`;
    const oT = osnTex(p.q);
    uslovie = `Решите неравенство $\\log_{${oT}}\\left(${kv}\\right)\\le\\log_{${oT}}(${lin})$.`;
    const vozr = c.q > 1;
    const S2 = S1 + 1;
    const P2 = P1 - c.r;
    const kv2 = `x^2${S2 === 0 ? '' : `${S2 > 0 ? '-' : '+'}${Math.abs(S2) === 1 ? '' : Math.abs(S2)}x`}${P2 === 0 ? '' : `${P2 > 0 ? '+' : ''}${P2}`}`;
    reshenie = [
      {
        title: 'Область определения',
        lines: [
          `$${kv}=(x${p.u1 > 0 ? '-' : '+'}${Math.abs(p.u1)})(x${p.u2 > 0 ? '-' : '+'}${Math.abs(p.u2)})>0$: $x<${p.u1}$ или $x>${p.u2}$; $${lin}>0$: $x>${-c.r}$.`
            .replace(/\(x\+0\)/g, 'x')
            .replace(/\(x-0\)/g, 'x'),
        ],
      },
      {
        title: 'Сравнение аргументов',
        lines: [
          vozr
            ? `Основание больше $1$, логарифм возрастает: $${kv}\\le ${lin}$, $${kv2}\\le0$, $${p.w1}\\le x\\le${c.w2}$.`
            : `Основание меньше $1$, логарифм убывает — знак меняется: $${kv}\\ge ${lin}$, $${kv2}\\ge0$, $x\\le${p.w1}$ или $x\\ge${c.w2}$.`,
        ],
      },
      {
        title: 'Пересечение с ОДЗ',
        lines: [`Пересекаем найденное множество с областью определения: $${otv}$.`],
      },
    ];
    razbor = [
      {
        slovo: 'ОДЗ: оба аргумента положительны',
        formula: `x<${p.u1}\\ \\text{или}\\ x>${p.u2};\\ x>${-c.r}`,
      },
      {
        slovo: vozr ? 'Логарифм возрастает' : 'Логарифм убывает — знак меняется',
        formula: `${kv2}${vozr ? '\\le' : '\\ge'}0`,
      },
      { slovo: 'Пересечение', formula: otv },
    ];
  }
  return {
    no: 16,
    shablon: 'r16.neravenstvo',
    uslovie,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: 'Множество решений',
        pole: { vid: 'promezhutki', verno: vPole(ch.kuski) },
      },
    ],
    otvet: `$${otv}$`,
    reshenie,
    razbor,
    kontrol: {
      kuski: ch.kuski.flatMap((k) => [
        k.lo?.v ?? -1e9,
        k.hi?.v ?? 1e9,
        k.loZ ? 1 : 0,
        k.hiZ ? 1 : 0,
      ]),
    },
  };
}

export const R16_NERAVENSTVO: Shablon2<PR16> = {
  no: 16,
  prototip:
    'Неравенство: показательная дробь (замена t = bˣ), логарифмы с одним основанием и ОДЗ, квадратное относительно логарифма',
  sobrat,
};

/** Для проверки: истинность неравенства в точке x. */
export function istinaR16(p: PR16): (x: number) => boolean {
  if (p.vid === 'pokazDrob') {
    const t = (x: number) => p.b ** x;
    const S = p.b ** p.al + p.b ** p.be;
    const P = p.b ** (p.al + p.be);
    const G = p.b ** p.ga;
    return (x) => {
      const zn = t(x) - G;
      if (Math.abs(zn) < 1e-12) return false;
      const v = (t(x) ** 2 - S * t(x) + P) / zn;
      return p.znak === 'le' ? v <= 1e-9 : v >= -1e-9;
    };
  }
  if (p.vid === 'logKvadrat') {
    return (x) => {
      const a = x + p.s;
      if (a <= 0) return false;
      const y = Math.log(a) / Math.log(p.b);
      const v = y * y - (p.al + p.be) * y + p.al * p.be;
      return p.znak === 'le' ? v <= 1e-9 : v >= -1e-9;
    };
  }
  const w2 = p.u1 + p.u2 + 1 - p.w1;
  const r = p.u1 * p.u2 - p.w1 * w2;
  const q = p.q[0] / p.q[1];
  return (x) => {
    const A = x * x - (p.u1 + p.u2) * x + p.u1 * p.u2;
    const B = x + r;
    if (A <= 0 || B <= 0) return false;
    return Math.log(A) / Math.log(q) <= Math.log(B) / Math.log(q) + 1e-9;
  };
}
