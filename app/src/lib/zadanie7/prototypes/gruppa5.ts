/**
 * Группа V — простейшие тригонометрические уравнения (П-26 … П-28).
 *
 * sin, cos, tg от аргумента $\dfrac{\pi(kx+b)}{a}$ равны табличному
 * значению. План: найти углы на единичной окружности, записать серии
 * решений для всего аргумента, выразить $x$ и перебором целых $n$ найти
 * наименьший положительный или наибольший отрицательный корень.
 */

import {
  add,
  d,
  div,
  hint,
  hintOtbor,
  koef,
  lin,
  mul,
  num,
  piTex,
  podst,
  q,
  razbor,
  sub,
  t,
  tk,
  uslovieTekst,
  val,
  voprosIz,
  type Q,
} from '../kit';
import type { Params, Prototype, Solved, Vopros } from '../types';

export type Funkciya = 'sin' | 'cos' | 'tg';

/** Табличные значения и их запись. */
export const ZNACHENIYA = {
  sin: ['0', '1', '-1', '1/2', '-1/2', 'r2/2', '-r2/2', 'r3/2', '-r3/2'],
  cos: ['0', '1', '-1', '1/2', '-1/2', 'r2/2', '-r2/2', 'r3/2', '-r3/2'],
  tg: ['0', '1', '-1', 'r3', '-r3', '1/r3', '-1/r3'],
} as const;

/** Значение числом. */
export function znachenie(kod: string): number {
  const s = kod.startsWith('-') ? -1 : 1;
  const k = kod.replace(/^-/, '');
  const m: Record<string, number> = {
    '0': 0,
    '1': 1,
    '1/2': 0.5,
    'r2/2': Math.SQRT2 / 2,
    'r3/2': Math.sqrt(3) / 2,
    r3: Math.sqrt(3),
    '1/r3': 1 / Math.sqrt(3),
  };
  const v = m[k];
  if (v === undefined) {
    throw new Error(`нет значения ${kod}`);
  }
  return s * v;
}

/** Значение в TeX: «\dfrac{\sqrt{3}}{2}», «0{,}5», «-1». */
export function znachTex(kod: string, dec = false): string {
  const s = kod.startsWith('-') ? '-' : '';
  const k = kod.replace(/^-/, '');
  const m: Record<string, string> = {
    '0': '0',
    '1': '1',
    '1/2': dec ? '0{,}5' : '\\dfrac{1}{2}',
    'r2/2': '\\dfrac{\\sqrt{2}}{2}',
    'r3/2': '\\dfrac{\\sqrt{3}}{2}',
    r3: '\\sqrt{3}',
    '1/r3': '\\dfrac{1}{\\sqrt{3}}',
  };
  return k === '0' ? '0' : `${s}${m[k]}`;
}

/** Серия решений для аргумента t (в долях π): t = t0 + per·n. */
interface Seriya {
  t0: Q;
  per: number;
}

/** Серии решений f(t·π) = значение; t в долях π. */
export function serii(f: Funkciya, kod: string): Seriya[] {
  const S = (n: number, m: number, per = 2): Seriya => ({ t0: q(n, m), per });
  const tab: Record<Funkciya, Record<string, Seriya[]>> = {
    sin: {
      '0': [S(0, 1, 1)],
      '1': [S(1, 2)],
      '-1': [S(-1, 2)],
      '1/2': [S(1, 6), S(5, 6)],
      '-1/2': [S(-1, 6), S(-5, 6)],
      'r2/2': [S(1, 4), S(3, 4)],
      '-r2/2': [S(-1, 4), S(-3, 4)],
      'r3/2': [S(1, 3), S(2, 3)],
      '-r3/2': [S(-1, 3), S(-2, 3)],
    },
    cos: {
      '0': [S(1, 2, 1)],
      '1': [S(0, 1)],
      '-1': [S(1, 1)],
      '1/2': [S(1, 3), S(-1, 3)],
      '-1/2': [S(2, 3), S(-2, 3)],
      'r2/2': [S(1, 4), S(-1, 4)],
      '-r2/2': [S(3, 4), S(-3, 4)],
      'r3/2': [S(1, 6), S(-1, 6)],
      '-r3/2': [S(5, 6), S(-5, 6)],
    },
    tg: {
      '0': [S(0, 1, 1)],
      '1': [S(1, 4, 1)],
      '-1': [S(-1, 4, 1)],
      r3: [S(1, 3, 1)],
      '-r3': [S(-1, 3, 1)],
      '1/r3': [S(1, 6, 1)],
      '-1/r3': [S(-1, 6, 1)],
    },
  };
  const s = tab[f][kod];
  if (s === undefined) {
    throw new Error(`нет серий для ${f} = ${kod}`);
  }
  return s;
}

/** Углы серии словами для подсказки: «$\dfrac{\pi}{6}$ и $\dfrac{5\pi}{6}$». */
function ugly(f: Funkciya, kod: string): string {
  return serii(f, kod)
    .map((s) => `$${piTex(s.t0)}$`)
    .join(' и ');
}

const FTEX: Record<Funkciya, string> = { sin: '\\sin', cos: '\\cos', tg: '\\tg' };
const FSLOVO: Record<Funkciya, string> = { sin: 'синус', cos: 'косинус', tg: 'тангенс' };

/** Аргумент: «\dfrac{\pi x}{3}», «\dfrac{\pi(4x+1)}{6}». */
export function argTex(k: number, b: number, a: number): string {
  const ch = b === 0 ? koef(k, '\\pi x') : `\\pi(${lin(k, b)})`;
  return a === 1 ? ch : `\\dfrac{${ch}}{${d(a)}}`;
}

function parametry(p: Params) {
  return {
    k: num(p, 'k'),
    b: num(p, 'b'),
    a: num(p, 'a'),
    kod: String(p.z),
    dec: p.dec === 1,
  };
}

/** Корень серии: x = x0 + step·n. */
interface SeriyaX {
  s: Seriya;
  x0: Q;
  step: Q;
}

function seriiX(f: Funkciya, k: number, b: number, a: number, kod: string): SeriyaX[] {
  return serii(f, kod).map((s) => ({
    s,
    x0: div(sub(mul(q(a), s.t0), q(b)), q(k)),
    step: q(a * s.per, k),
  }));
}

/** Значение серии при n. */
function xn(sx: SeriyaX, n: number): Q {
  return add(sx.x0, mul(sx.step, q(n)));
}

/** Нужный корень: наименьший положительный или наибольший отрицательный. */
export function iskomyy(sx: SeriyaX[], v: Vopros): { x: Q; n: number; i: number } {
  let best: { x: Q; n: number; i: number } | null = null;
  sx.forEach((s, i) => {
    const st = val(s.step);
    /* n, при котором x переходит через ноль. */
    const n0 = Math.floor(-val(s.x0) / st);
    for (let n = n0 - 2; n <= n0 + 3; n += 1) {
      const x = xn(s, n);
      const xv = val(x);
      if (v === 'minPol' ? xv > 0 : xv < 0) {
        if (best === null || (v === 'minPol' ? xv < val(best.x) : xv > val(best.x))) {
          best = { x, n, i };
        }
      }
    }
  });
  if (best === null) {
    throw new Error('нет нужного корня');
  }
  return best;
}

function seriyaArgTex(s: Seriya): string {
  const per = s.per === 1 ? '\\pi n' : `${d(s.per)}\\pi n`;
  return s.t0.n === 0 ? per : `${piTex(s.t0)}+${per}`;
}

function xSeriiTex(x0: Q, step: Q): string {
  const st = step.n === 1 && step.m === 1 ? 'n' : `${t(step)}n`;
  return x0.n === 0 ? st : `${t(x0)}+${st}`;
}

function seriyaXTex(sx: SeriyaX): string {
  return xSeriiTex(sx.x0, sx.step);
}

function reshitTrig(f: Funkciya, p: Params, uravnenie: string, v: Vopros): Solved {
  const { k, b, a, kod, dec } = parametry(p);
  const A = argTex(k, b, a);
  const sx = seriiX(f, k, b, a, kod);
  const best = iskomyy(sx, v);
  const ans = val(best.x);
  const V = znachTex(kod, dec);
  const kandidaty: number[] = [];
  const perebor = sx.map((s) => {
    const n0 = Math.floor(-val(s.x0) / val(s.step));
    const ns = [n0 - 1, n0, n0 + 1, n0 + 2];
    const chasti = ns.map((n) => {
      const x = xn(s, n);
      kandidaty.push(val(x));
      return `$n=${d(n)}$: $x=${t(x)}$`;
    });
    return `Серия $x=${seriyaXTex(s)}$: ${chasti.join('; ')}.`;
  });
  const tPri = div(add(mul(q(k), best.x), q(b)), q(a));
  const argPri =
    b === 0 && k === 1
      ? `\\dfrac{\\pi\\cdot${tk(best.x)}}{${d(a)}}`
      : `\\dfrac{\\pi(${podst(k, b, best.x)})}{${d(a)}}`;
  const slovo = v === 'minPol' ? 'наименьший положительный' : 'наибольший отрицательный';
  const drugie = [...new Set(kandidaty)].filter((x) => x !== ans);
  const blizhniy = drugie
    .filter((x) => (v === 'minPol' ? x <= 0 : x >= 0))
    .sort((x, y) => (v === 'minPol' ? y - x : x - y))[0];
  const sled = drugie
    .filter((x) => (v === 'minPol' ? x > ans : x < ans))
    .sort((x, y) => (v === 'minPol' ? x - y : y - x))[0];
  /* Другие табличные значения той же функции — неверные варианты в подсказке. */
  const chuzhie = ZNACHENIYA[f]
    .filter((z) => z !== kod && serii(f, z).length === serii(f, kod).length)
    .slice(0, 3)
    .map((z) => ugly(f, z));
  return {
    answer: ans,
    uravnenie,
    korni: [...new Set(kandidaty)].sort((x, y) => x - y),
    postoronnie: [],
    etapy: razbor({
      plan: [
        `Простейшее тригонометрическое уравнение: ${FSLOVO[f]} аргумента $${A}$ равен табличному значению $${V}$. План: найти на единичной окружности углы с таким ${f === 'tg' ? 'тангенсом' : f === 'sin' ? 'синусом' : 'косинусом'}, записать серии решений для всего аргумента, выразить $x$ и перебрать целые $n$.`,
      ],
      ...(f === 'tg'
        ? {
            odz: [
              'Тангенс определён, когда косинус аргумента не равен нулю. У найденных углов тангенс равен числу — значит, ограничение выполнится само.',
            ],
          }
        : {}),
      preobr: [
        `$${FTEX[f]}\\alpha=${V}$ при ${serii(f, kod)
          .map((s) => `$\\alpha=${seriyaArgTex(s)}$`)
          .join(
            ' или ',
          )}, $n\\in\\mathbb{Z}$${serii(f, kod).length === 2 ? ' (две точки окружности — две серии)' : ''}.`,
        ...sx.map(
          (s) =>
            `$${A}=${seriyaArgTex(s.s)}$: делим на $\\pi$${a === 1 ? '' : ` и умножаем на $${d(a)}$`}: $${lin(k, b)}=${t(mul(q(a), s.s.t0))}+${d(a * s.s.per)}n$${lin(k, b) === 'x' ? '' : `, откуда $x=${seriyaXTex(s)}$`}.`,
        ),
      ],
      korni: [
        `${sx.length === 1 ? 'Серия корней' : 'Серии корней'}: ${sx.map((s) => `$x=${seriyaXTex(s)}$`).join(' и ')}, $n\\in\\mathbb{Z}$.`,
      ],
      otbor: [
        'Перебираем целые $n$ около нуля:',
        ...perebor,
        `${slovo[0]?.toUpperCase()}${slovo.slice(1)} корень — $${d(ans)}$ (при $n=${d(best.n)}$).`,
      ],
      proverka: [
        `$${FTEX[f]}${argPri}=${FTEX[f]}${tPri.n < 0 ? `\\left(${piTex(tPri)}\\right)` : piTex(tPri)}=${V}$ — верно.`,
      ],
      answer: ans,
    }),
    vychisleniya: [
      {
        tekst:
          'Шаг серии по $x$: период по аргументу, умноженный на знаменатель и делённый на коэффициент при $x$.',
        tex: `\\dfrac{${d(a)}\\cdot${d(sx[0]?.s.per ?? 2)}}{${d(k)}}=${t(sx[0]?.step ?? q(1))}`,
      },
    ],
    hints: [
      hint(
        `Где на круге точки, у которых ${FSLOVO[f]} равен $${V}$?`,
        ugly(f, kod),
        chuzhie,
        `${f === 'sin' ? 'Синус — ордината точки' : f === 'cos' ? 'Косинус — абсцисса точки' : 'Тангенс — отношение синуса к косинусу'}.`,
      ),
      hint(
        `Как записать серию решений для $${A}$?`,
        `$${A}=${seriyaArgTex(sx[0]?.s ?? { t0: q(0), per: 2 })}$`,
        [
          `$${A}=${piTex(sx[0]?.s.t0 ?? q(0))}$`,
          `$x=${seriyaArgTex(sx[0]?.s ?? { t0: q(0), per: 2 })}$`,
        ],
        'Серию пишем для всего аргумента, а не для $x$.',
      ),
      hint('Как выразить $x$ из этой серии?', `$x=${seriyaXTex(sx[0] as SeriyaX)}$`, [
        `$x=${xSeriiTex((sx[0] as SeriyaX).x0, q((sx[0] as SeriyaX).s.per))}$`,
        `$x=${xSeriiTex(add((sx[0] as SeriyaX).x0, q(1)), (sx[0] as SeriyaX).step)}$`,
      ]),
      hintOtbor(
        v,
        `$${d(ans)}$`,
        [blizhniy, sled].filter((x): x is number => x !== undefined).map((x) => `$${d(x)}$`),
        `Перебираем $n$ и смотрим на числовую прямую: ${slovo} — ближайший к нулю с нужной стороны.`,
      ),
    ],
  };
}

function trigPrototype(f: Funkciya, no: number, nazv: string, fipiNos: string): Prototype {
  return {
    id: `P${no}`,
    no,
    group: 'V',
    title: nazv,
    formula: `${FTEX[f]}\\dfrac{\\pi(kx+b)}{a}=c`,
    skills: ['trig-krug'],
    fipiNos,
    uravnenie(p) {
      const { k, b, a, kod, dec } = parametry(p);
      return `${FTEX[f]}${argTex(k, b, a)}=${znachTex(kod, dec)}`;
    },
    uslovie(p) {
      return uslovieTekst(this.uravnenie(p), this.vopros(p));
    },
    vopros: (p) => voprosIz(p, ['minPol', 'maxOtr']),
    chisla(p) {
      const { k, b, a, kod } = parametry(p);
      const c = znachenie(kod);
      const arg = (x: number) => (Math.PI * (k * x + b)) / a;
      const fn = f === 'sin' ? Math.sin : f === 'cos' ? Math.cos : Math.tan;
      return {
        lhs: (x) => fn(arg(x)),
        rhs: () => c,
        odz: (x) => f !== 'tg' || Math.abs(Math.cos(arg(x))) > 1e-9,
        periodicheskoe: true,
      };
    },
    solve(p) {
      return reshitTrig(f, p, this.uravnenie(p), this.vopros(p));
    },
  };
}

export const GRUPPA_V: Prototype[] = [
  trigPrototype('sin', 26, 'Синус от линейного аргумента', 'подборка 25'),
  trigPrototype('cos', 27, 'Косинус от линейного аргумента', 'подборка 26'),
  trigPrototype('tg', 28, 'Тангенс от линейного аргумента', 'подборка 27'),
];
