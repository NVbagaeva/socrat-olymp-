/**
 * Группа IV, преобразование числовых тригонометрических выражений:
 * 8.Q, 8.R, 8.S, 8.T, 8.U, 8.V.
 */

import { gcd, nice, round9 } from '../numbers';
import type { Rng } from '../rng';
import { coefRoot, d, deg, fn, rad } from '../tex';
import type { Draft, Prototype } from '../types';
import { keys, naydi, podtip } from './common';

type Fn = 'sin' | 'cos' | 'tg';

/** Табличное значение как рациональное число × √r: {v, r}. */
interface Tab {
  v: number;
  r: 1 | 2 | 3;
}

/** Значение sin/cos/tg табличного угла в градусах. null — не табличный. */
export function table(f: Fn, angle: number): Tab | null {
  const a = ((angle % 360) + 360) % 360;
  const ref = a <= 90 ? a : a <= 180 ? 180 - a : a <= 270 ? a - 180 : 360 - a;
  const sinTab: Record<number, Tab> = { 0: { v: 0, r: 1 }, 30: { v: 1 / 2, r: 1 }, 45: { v: 1 / 2, r: 2 }, 60: { v: 1 / 2, r: 3 }, 90: { v: 1, r: 1 } };
  const s = sinTab[ref];
  const c = sinTab[90 - ref];
  if (s === undefined || c === undefined) {
    return null;
  }
  const sinSign = a < 180 ? 1 : -1;
  const cosSign = a < 90 || a > 270 ? 1 : -1;
  if (f === 'sin') {
    return { v: s.v * sinSign, r: s.r };
  }
  if (f === 'cos') {
    return { v: c.v * cosSign, r: c.r };
  }
  if (c.v === 0) {
    return null;
  }
  /* tg = sin/cos: 1, √3, √3/3 со знаком. */
  const sign = sinSign * cosSign;
  if (ref === 45) {
    return { v: sign, r: 1 };
  }
  if (ref === 60) {
    return { v: sign, r: 3 };
  }
  if (ref === 30) {
    return { v: sign / 3, r: 3 };
  }
  return { v: 0, r: 1 };
}

/** Угол в радианах из градусов. */
function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Численное значение функции угла в градусах — для независимой проверки. */
function numeric(f: Fn, degrees: number): number {
  const x = toRad(degrees);
  return f === 'sin' ? Math.sin(x) : f === 'cos' ? Math.cos(x) : Math.tan(x);
}

/** Произведение двух табличных значений: рациональная часть и радикал. */
function multiply(a: Tab, b: Tab): { v: number; r: number } {
  let v = a.v * b.v;
  let r = a.r * b.r;
  if (r === 4) {
    v *= 2;
    r = 1;
  }
  if (r === 9) {
    v *= 3;
    r = 1;
  }
  return { v, r };
}

/** Запись угла: в градусах или радианах, отрицательный — в скобках. */
function angleTex(degrees: number, radians: boolean): string {
  if (!radians) {
    return deg(degrees);
  }
  const g = gcd(Math.abs(degrees), 180);
  const s = rad(degrees / g, 180 / g);
  return degrees < 0 ? `\\left(${s}\\right)` : s;
}

/** Табличное значение как текст: \frac{\sqrt{2}}{2}, -\frac{1}{2}. */
function tabTex(t: Tab): string {
  const sign = t.v < 0 ? '-' : '';
  const av = Math.abs(t.v);
  if (t.r === 1) {
    return sign + (av === 1 ? '1' : av === 0.5 ? '\\frac{1}{2}' : d(av));
  }
  if (av === 1) {
    return `${sign}\\sqrt{${t.r}}`;
  }
  if (av === 0.5) {
    return `${sign}\\frac{\\sqrt{${t.r}}}{2}`;
  }
  return `${sign}\\frac{\\sqrt{${t.r}}}{3}`;
}

const BASE_ANGLES = [30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330];
const EXTRA_ANGLES = [-30, -45, -60, -120, -135, -150, -210, -225, -240, -300, -315, -330, 390, 405, 420, 480, 495, 510, 570, 585, 600, 660, 675, 690, 750];

/* ── 8.Q  произведение табличных значений ────────────────────── */

function drawQ(r: Rng, advanced: boolean): Draft | null {
  const angles = advanced ? [...BASE_ANGLES, ...EXTRA_ANGLES] : BASE_ANGLES;
  const fns: Fn[] = advanced ? ['sin', 'cos', 'tg'] : ['sin', 'cos'];
  const single = advanced && r.int(0, 2) === 0;
  const f1 = r.pick(fns);
  const a1 = r.pick(angles);
  const t1 = table(f1, a1);
  if (t1 === null || t1.v === 0) {
    return null;
  }
  let product: { v: number; r: number } = { v: t1.v, r: t1.r };
  let f2: Fn = 'sin';
  let a2 = 0;
  if (!single) {
    f2 = r.pick(fns);
    a2 = r.pick(angles);
    const t2 = table(f2, a2);
    if (t2 === null || t2.v === 0) {
      return null;
    }
    product = multiply(t1, t2);
    if (advanced && !EXTRA_ANGLES.includes(a1) && !EXTRA_ANGLES.includes(a2) && f1 !== 'tg' && f2 !== 'tg') {
      return null;
    }
  } else if (!EXTRA_ANGLES.includes(a1)) {
    return null;
  }
  const radians = r.int(0, 1) === 0;
  const c = r.int(2, 29);
  const ans = round9(c * product.v * product.r);
  if (!nice(ans, 2) || Math.abs(ans) > 100 || ans === 0) {
    return null;
  }
  const coefTex = coefRoot(c, product.r);
  const body = single ? `${fn(f1)}${angleTex(a1, radians)}` : `${fn(f1)}${angleTex(a1, radians)} \\cdot ${fn(f2)}${angleTex(a2, radians)}`;
  const tex = `${coefTex === '1' ? '' : coefTex}${body}`;
  const values = single ? `${fn(f1)}${angleTex(a1, radians)} = ${tabTex(t1)}` : `${fn(f1)}${angleTex(a1, radians)} = ${tabTex(t1)}$, $${fn(f2)}${angleTex(a2, radians)} = ${tabTex(table(f2, a2) as Tab)}`;
  return {
    uslovie: naydi(tex),
    otvet: ans,
    razbor: [`$${values}$`, `$${tex} = ${d(ans)}$`],
    proverka: c * Math.sqrt(product.r) * numeric(f1, a1) * (single ? 1 : numeric(f2, a2)),
    signature: single ? `${a1}` : `${a1}:${a2}`,
        params: single ? { f1, a1, c } : { f1, a1, f2, a2, c },
  };
}

export const P8Q: Prototype = {
  id: '8.Q',
  group: 'IV',
  nazvanie: 'Табличные значения',
  podtipy: [podtip('base', 'base', (r) => drawQ(r, false)), podtip('adv', 'advanced', (r) => drawQ(r, true))],
  isklyucheniya: keys([
    { f1: 'cos', a1: 45, f2: 'cos', a2: 240, c: 26 },
    { f1: 'cos', a1: 135, f2: 'cos', a2: 60, c: 28 },
    { f1: 'tg', a1: 45, f2: 'sin', a2: 45, c: 18 },
    { f1: 'tg', a1: 225, f2: 'sin', a2: 135, c: 12 },
    { f1: 'sin', a1: 150, f2: 'cos', a2: 120, c: 12 },
    { f1: 'sin', a1: 45, f2: 'cos', a2: 135, c: 14 },
    { f1: 'sin', a1: 30, f2: 'cos', a2: 120, c: 10 },
    { f1: 'sin', a1: 45, f2: 'cos', a2: 135, c: 16 },
    { f1: 'cos', a1: -225, c: 12 },
    { f1: 'sin', a1: -120, c: 4 },
    { f1: 'cos', a1: -495, c: 32 },
    { f1: 'cos', a1: -570, c: 26 },
  ]),
};

/* ── 8.R  синус двойного угла ────────────────────────────────── */

/** Углы, у которых удвоенный — табличный: кратные 15° и нечётные π/8. */
const HALF_ANGLES = [15, 75, 105, 165, 195, 255, 285, 345, 22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5];

/** Запись угла в радианах; 22,5° = π/8 бывает только в радианах. */
function halfTex(x: number): string {
  if (Number.isInteger(x)) {
    return angleTex(x, true);
  }
  return rad(Math.round(x / 22.5), 8);
}

export const P8R: Prototype = {
  id: '8.R',
  group: 'IV',
  nazvanie: 'Синус двойного угла',
  podtipy: [
    podtip('table', 'advanced', (r) => {
      const x = r.pick(HALF_ANGLES);
      const t = table('sin', 2 * x);
      if (t === null || t.v === 0) {
        return null;
      }
      const c = r.int(1, 24);
      const ans = round9((c / 2) * t.v * t.r);
      if (!nice(ans, 2)) {
        return null;
      }
      const inDegrees = Number.isInteger(x) && r.int(0, 1) === 0;
      const angle = inDegrees ? deg(x) : halfTex(x);
      const coefTex = coefRoot(c, t.r);
      const tex = `${coefTex === '1' ? '' : coefTex}\\sin${angle} \\cdot \\cos${angle}`;
      const doubled = inDegrees ? deg(2 * x) : angleTex(2 * x, true);
      return {
        uslovie: naydi(tex),
        otvet: ans,
        razbor: [
          `$\\sin${angle} \\cdot \\cos${angle} = \\dfrac{1}{2}\\sin${doubled} = \\dfrac{1}{2} \\cdot ${tabTex(t)}$`,
          `$${tex} = ${d(ans)}$`,
        ],
        proverka: c * Math.sqrt(t.r) * Math.sin(toRad(x)) * Math.cos(toRad(x)),
        signature: `${x}`,
        params: { x, c },
      };
    }),
    podtip('cancel', 'base', (r) => {
      const x = r.int(31, 99);
      if ([45, 60, 90].includes(x)) {
        return null;
      }
      const c = r.int(2, 19);
      const tex = `\\dfrac{${2 * c}\\sin${deg(x)} \\cdot \\cos${deg(x)}}{\\sin${deg(2 * x)}}`;
      return {
        uslovie: naydi(tex),
        otvet: c,
        razbor: [`$2\\sin${deg(x)}\\cos${deg(x)} = \\sin${deg(2 * x)}$`, `$\\dfrac{${c}\\sin${deg(2 * x)}}{\\sin${deg(2 * x)}} = ${c}$`],
        proverka: (2 * c * Math.sin(toRad(x)) * Math.cos(toRad(x))) / Math.sin(toRad(2 * x)),
        signature: `${x}`,
        params: { x, c, form: 'cancel' },
      };
    }),
    podtip('reduce', 'advanced', (r) => {
      const y = r.int(50, 88);
      if ([60].includes(y)) {
        return null;
      }
      const c = r.int(2, 29);
      const tex = `\\dfrac{${c}\\sin${deg(180 - 2 * y)}}{\\cos${deg(y)} \\cdot \\cos${deg(90 - y)}}`;
      return {
        uslovie: naydi(tex),
        otvet: 2 * c,
        razbor: [
          `$\\sin${deg(180 - 2 * y)} = \\sin${deg(2 * y)} = 2\\sin${deg(y)}\\cos${deg(y)}$, $\\cos${deg(90 - y)} = \\sin${deg(y)}$`,
          `$\\dfrac{${2 * c}\\sin${deg(y)}\\cos${deg(y)}}{\\cos${deg(y)}\\sin${deg(y)}} = ${2 * c}$`,
        ],
        proverka: (c * Math.sin(toRad(180 - 2 * y))) / (Math.cos(toRad(y)) * Math.cos(toRad(90 - y))),
        signature: `${y}`,
        params: { y, c, form: 'reduce' },
      };
    }),
  ],
  isklyucheniya: keys([
    { x: 157.5, c: 1 },
    { x: 337.5, c: 7 },
    { x: 210, c: 10 },
    { x: 150, c: 6 },
    { x: 98, c: 8, form: 'cancel' },
    { x: 87, c: 12, form: 'cancel' },
    { x: 96, c: 9, form: 'cancel' },
    { x: 73, c: 14, form: 'cancel' },
    { y: 77, c: 7, form: 'reduce' },
    { y: 81, c: 9, form: 'reduce' },
    { y: 65, c: 8, form: 'reduce' },
    { y: 54, c: 6, form: 'reduce' },
  ]),
};

/* ── 8.S  косинус двойного угла ──────────────────────────────── */

/** Коэффициент c√r, иногда спрятанный под один корень: √72 вместо 6√2. */
function hiddenCoef(c: number, rr: number, hidden: boolean): string {
  if (hidden && rr > 1) {
    return `\\sqrt{${c * c * rr}}`;
  }
  return coefRoot(c, rr);
}

export const P8S: Prototype = {
  id: '8.S',
  group: 'IV',
  nazvanie: 'Косинус двойного угла',
  podtipy: [
    podtip('diff', 'base', (r) => {
      const x = r.pick(HALF_ANGLES);
      const t = table('cos', 2 * x);
      if (t === null || t.v === 0) {
        return null;
      }
      const c = r.int(1, 12);
      const ans = round9(c * t.v * t.r);
      if (!nice(ans, 2)) {
        return null;
      }
      const inDegrees = Number.isInteger(x) && r.int(0, 1) === 0;
      const angle = inDegrees ? deg(x) : halfTex(x);
      const k = coefRoot(c, t.r);
      const kk = k === '1' ? '' : k;
      const tex = `${kk}\\cos^2${angle} - ${kk}\\sin^2${angle}`;
      const doubled = inDegrees ? deg(2 * x) : angleTex(2 * x, true);
      return {
        uslovie: naydi(tex),
        otvet: ans,
        razbor: [`$\\cos^2${angle} - \\sin^2${angle} = \\cos${doubled} = ${tabTex(t)}$`, `$${tex} = ${d(ans)}$`],
        proverka: c * Math.sqrt(t.r) * (Math.cos(toRad(x)) ** 2 - Math.sin(toRad(x)) ** 2),
        signature: `${x}`,
        params: { x, c, form: 'diff' },
      };
    }),
    podtip('half', 'advanced', (r) => {
      const x = r.pick(HALF_ANGLES);
      const t = table('cos', 2 * x);
      if (t === null || t.v === 0) {
        return null;
      }
      const c = r.int(1, 12);
      const ans = round9(c * t.v * t.r);
      if (!nice(ans, 2)) {
        return null;
      }
      const inDegrees = Number.isInteger(x) && r.int(0, 1) === 0;
      const angle = inDegrees ? deg(x) : halfTex(x);
      const hidden = r.int(0, 2) === 0;
      const big = hiddenCoef(2 * c, t.r, hidden);
      const small = hiddenCoef(c, t.r, hidden);
      const form = r.pick(['cos', 'sin'] as const);
      const tex = form === 'cos' ? `${big}\\cos^2${angle} - ${small}` : `${small} - ${big}\\sin^2${angle}`;
      const doubled = inDegrees ? deg(2 * x) : angleTex(2 * x, true);
      const identity = form === 'cos' ? `2\\cos^2${angle} - 1` : `1 - 2\\sin^2${angle}`;
      return {
        uslovie: naydi(tex),
        otvet: ans,
        razbor: [`$${tex} = ${small}(${identity}) = ${small}\\cos${doubled}$`, `$\\cos${doubled} = ${tabTex(t)}$, поэтому значение равно $${d(ans)}$`],
        proverka: form === 'cos' ? 2 * c * Math.sqrt(t.r) * Math.cos(toRad(x)) ** 2 - c * Math.sqrt(t.r) : c * Math.sqrt(t.r) - 2 * c * Math.sqrt(t.r) * Math.sin(toRad(x)) ** 2,
        signature: `${x}:${form}`,
        params: { x, c, form },
      };
    }),
    podtip('cancel', 'advanced', (r) => {
      const x = r.int(50, 88);
      if ([60, 67.5, 75].includes(x)) {
        return null;
      }
      const c = 2 * r.int(1, 19) + 1;
      const ans = -c / 2;
      const tex = `\\dfrac{${c}(\\sin^2${deg(x)} - \\cos^2${deg(x)})}{2\\cos${deg(2 * x)}}`;
      return {
        uslovie: naydi(tex),
        otvet: ans,
        razbor: [`$\\sin^2${deg(x)} - \\cos^2${deg(x)} = -\\cos${deg(2 * x)}$`, `$\\dfrac{-${c}\\cos${deg(2 * x)}}{2\\cos${deg(2 * x)}} = -\\dfrac{${c}}{2} = ${d(ans)}$`],
        proverka: (c * (Math.sin(toRad(x)) ** 2 - Math.cos(toRad(x)) ** 2)) / (2 * Math.cos(toRad(2 * x))),
        signature: `${x}`,
        params: { x, c, form: 'cancel' },
      };
    }),
  ],
  isklyucheniya: keys([
    { x: 202.5, c: 3, form: 'diff' },
    { x: 105, c: 4, form: 'diff' },
    { x: 157.5, c: 3, form: 'diff' },
    { x: 202.5, c: 6, form: 'diff' },
    { x: 157.5, c: 2, form: 'cos' },
    { x: 195, c: 1, form: 'cos' },
    { x: 15, c: 3, form: 'cos' },
    { x: 157.5, c: 4, form: 'cos' },
    { x: 337.5, c: 1, form: 'sin' },
    { x: 195, c: 5, form: 'sin' },
    { x: 202.5, c: 4, form: 'sin' },
    { x: 165, c: 3, form: 'sin' },
    { x: 66, c: 21, form: 'cancel' },
    { x: 68, c: 25, form: 'cancel' },
    { x: 72, c: 23, form: 'cancel' },
    { x: 77, c: 19, form: 'cancel' },
  ]),
};

/* ── 8.T  формулы приведения ─────────────────────────────────── */

const TABLE_DEG = [30, 45, 60, 90, 120, 135, 150];

export const P8T: Prototype = {
  id: '8.T',
  group: 'IV',
  nazvanie: 'Формулы приведения',
  podtipy: [
    podtip('co', 'advanced', (r) => {
      const x = r.int(1, 89);
      if (TABLE_DEG.includes(x)) {
        return null;
      }
      const f = r.pick(['sin', 'cos'] as const);
      const c = r.int(2, 39);
      const dd = r.int(-15, 15);
      if (dd === 0) {
        return null;
      }
      const other = f === 'sin' ? 'cos' : 'sin';
      const tex = `\\dfrac{${c}${fn(f)}${deg(90 - x)}}{${fn(other)}${deg(x)}} ${dd < 0 ? '-' : '+'} ${Math.abs(dd)}`;
      return {
        uslovie: naydi(tex),
        otvet: c + dd,
        razbor: [`$${fn(f)}${deg(90 - x)} = ${fn(other)}${deg(x)}$, дробь равна $${c}$`, `$${c} ${dd < 0 ? '-' : '+'} ${Math.abs(dd)} = ${c + dd}$`],
        proverka: (c * numeric(f, 90 - x)) / numeric(other, x) + dd,
        signature: `${x}`,
        params: { form: 'co', f, x, c, d: dd },
      };
    }),
    podtip('period', 'base', (r) => {
      const x = r.int(1, 179);
      if (TABLE_DEG.includes(x) || x === 180) {
        return null;
      }
      const f = r.pick(['sin', 'cos'] as const);
      const c = r.int(2, 39);
      const sign = r.pick([1, -1]);
      const up = r.int(0, 1) === 0;
      const big = x + 360 * r.pick([1, 1, 2]);
      const top = up ? deg(big) : deg(x);
      const bottom = up ? deg(x) : deg(big);
      const tex = `${sign < 0 ? '-' : ''}\\dfrac{${c}${fn(f)}${top}}{${fn(f)}${bottom}}`;
      return {
        uslovie: naydi(tex),
        otvet: sign * c,
        razbor: [`$${fn(f)}${deg(big)} = ${fn(f)}${deg(big - 360 * Math.round((big - x) / 360))}$`, `$${tex} = ${sign * c}$`],
        proverka: (sign * c * numeric(f, up ? big : x)) / numeric(f, up ? x : big),
        signature: `${x}`,
        params: { form: 'period', f, x, c, big, sign, up: up ? 1 : 0 },
      };
    }),
    podtip('pi', 'base', (r) => {
      const x = r.int(1, 89);
      if (TABLE_DEG.includes(x)) {
        return null;
      }
      const f = r.pick(['sin', 'cos'] as const);
      const plus = r.int(0, 1) === 0;
      const c = r.int(2, 39);
      const angle = plus ? 180 + x : 180 - x;
      /* sin(180−x) = sin x, sin(180+x) = −sin x, cos(180±x) = −cos x. */
      const value = f === 'sin' && !plus ? 1 : -1;
      const tex = `\\dfrac{${c}${fn(f)}${deg(angle)}}{${fn(f)}${deg(x)}}`;
      return {
        uslovie: naydi(tex),
        otvet: value * c,
        razbor: [`$${fn(f)}${deg(angle)} = ${value < 0 ? '-' : ''}${fn(f)}${deg(x)}$`, `$${tex} = ${value * c}$`],
        proverka: (c * numeric(f, angle)) / numeric(f, x),
        signature: `${x}`,
        params: { form: 'pi', f, x, c, plus: plus ? 1 : 0 },
      };
    }),
  ],
  isklyucheniya: keys([
    { form: 'co', f: 'cos', x: 10, c: 7, d: -3 },
    { form: 'co', f: 'cos', x: 86, c: 51, d: 8 },
    { form: 'co', f: 'cos', x: 79, c: 35, d: -7 },
    { form: 'co', f: 'cos', x: 37, c: 2, d: 13 },
  ]),
};

/* ── 8.U  произведение тангенсов дополнительных углов ────────── */

export const P8U: Prototype = {
  id: '8.U',
  group: 'IV',
  nazvanie: 'Тангенсы дополнительных углов',
  podtipy: [
    podtip('deg', 'base', (r) => {
      const x = r.int(1, 44);
      if (x === 30) {
        return null;
      }
      const c = r.int(2, 59);
      const dd = r.int(-60, 60);
      if (dd === 0 || c + dd === 0) {
        return null;
      }
      const tex = `${c}\\operatorname{tg}${deg(x)} \\cdot \\operatorname{tg}${deg(90 - x)} ${dd < 0 ? '-' : '+'} ${Math.abs(dd)}`;
      return {
        uslovie: naydi(tex),
        otvet: c + dd,
        razbor: [`$\\operatorname{tg}${deg(90 - x)} = \\operatorname{ctg}${deg(x)}$, поэтому $\\operatorname{tg}${deg(x)} \\cdot \\operatorname{tg}${deg(90 - x)} = 1$`, `$${c} ${dd < 0 ? '-' : '+'} ${Math.abs(dd)} = ${c + dd}$`],
        proverka: c * Math.tan(toRad(x)) * Math.tan(toRad(90 - x)) + dd,
        signature: `${x}`,
        params: { x, c, d: dd, unit: 'deg' },
      };
    }),
    podtip('rad', 'advanced', (r) => {
      const den = r.pick([10, 14, 18, 22, 26]);
      const a = r.int(1, den / 2 - 1);
      const b = den / 2 - a;
      if (a >= b) {
        return null;
      }
      const c = r.int(2, 59) * r.pick([1, -1]);
      const dd = r.int(-60, 60);
      if (dd === 0 || c + dd === 0) {
        return null;
      }
      const cTex = c < 0 ? `-${-c}` : String(c);
      const tex = `${cTex}\\operatorname{tg}${rad(a, den)} \\cdot \\operatorname{tg}${rad(b, den)} ${dd < 0 ? '-' : '+'} ${Math.abs(dd)}`;
      return {
        uslovie: naydi(tex),
        otvet: c + dd,
        razbor: [`$${rad(a, den)} + ${rad(b, den)} = \\dfrac{\\pi}{2}$, поэтому $\\operatorname{tg}${rad(a, den)} \\cdot \\operatorname{tg}${rad(b, den)} = 1$`, `$${cTex} ${dd < 0 ? '-' : '+'} ${Math.abs(dd)} = ${c + dd}$`],
        proverka: c * Math.tan((Math.PI * a) / den) * Math.tan((Math.PI * b) / den) + dd,
        signature: `${a}:${den}`,
        params: { a, den, c, d: dd, unit: 'rad' },
      };
    }),
  ],
  isklyucheniya: keys([
    { x: 3, c: 30, d: -43, unit: 'deg' },
    { x: 7, c: 46, d: -57, unit: 'deg' },
    { x: 20, c: 12, d: -7, unit: 'deg' },
  ]),
};

/* ── 8.V  основное тождество с приведением ───────────────────── */

type FormV = 'c90+' | 'c90-' | 's90+' | 's90-' | 'c270+' | 'c270-' | 's270+' | 's270-';

function secondAngle(form: FormV, x: number): number {
  const base = form.includes('270') ? 270 : 90;
  return form.endsWith('+') ? base + x : base - x;
}

export const P8V: Prototype = {
  id: '8.V',
  group: 'IV',
  nazvanie: 'Основное тождество с приведением',
  podtipy: [
    podtip('90', 'base', (r) => {
      const form = r.pick(['c90+', 'c90-', 's90+', 's90-'] as const);
      const x = r.int(1, 89);
      if (TABLE_DEG.includes(x)) {
        return null;
      }
      const dd = r.int(1, 29);
      const c = (1 + dd) * r.int(2, 9);
      if (c > 200) {
        return null;
      }
      const f = form.startsWith('c') ? 'cos' : 'sin';
      const other = f === 'cos' ? 'sin' : 'cos';
      const y = secondAngle(form, x);
      const tex = `\\dfrac{${c}}{${fn(f)}^2${deg(x)} + ${dd} + ${fn(f)}^2${deg(y)}}`;
      const ans = c / (1 + dd);
      return {
        uslovie: naydi(tex),
        otvet: ans,
        razbor: [`$${fn(f)}^2${deg(y)} = ${fn(other)}^2${deg(x)}$, знаменатель равен $1 + ${dd} = ${1 + dd}$`, `$\\dfrac{${c}}{${1 + dd}} = ${d(ans)}$`],
        proverka: c / (numeric(f, x) ** 2 + dd + numeric(f, y) ** 2),
        signature: `${x}`,
        params: { form, x, d: dd, c },
      };
    }),
    podtip('270', 'advanced', (r) => {
      const form = r.pick(['c270+', 'c270-', 's270+', 's270-', 'c90+', 's90+'] as const);
      const x = form.includes('270') ? r.int(1, 89) : r.int(91, 179);
      if (TABLE_DEG.includes(x) || x === 180 || (x > 90 && TABLE_DEG.includes(180 - x))) {
        return null;
      }
      const dd = r.int(1, 29);
      const c = r.int(2, 79);
      const ans = round9(c / (1 + dd));
      if (!nice(ans, 2) || c === 1 + dd) {
        return null;
      }
      const f = form.startsWith('c') ? 'cos' : 'sin';
      const other = f === 'cos' ? 'sin' : 'cos';
      const y = secondAngle(form, x);
      const tex = `\\dfrac{${c}}{${fn(f)}^2${deg(x)} + ${dd} + ${fn(f)}^2${deg(y)}}`;
      return {
        uslovie: naydi(tex),
        otvet: ans,
        razbor: [`$${fn(f)}^2${deg(y)} = ${fn(other)}^2${deg(x)}$, знаменатель равен $1 + ${dd} = ${1 + dd}$`, `$\\dfrac{${c}}{${1 + dd}} = ${d(ans)}$`],
        proverka: c / (numeric(f, x) ** 2 + dd + numeric(f, y) ** 2),
        signature: `${x}`,
        params: { form, x, d: dd, c },
      };
    }),
  ],
  isklyucheniya: keys([
    { form: 'c90+', x: 74, d: 2, c: 6 },
    { form: 'c90+', x: 92, d: 1, c: 10 },
    { form: 'c90+', x: 59, d: 3, c: 26 },
    { form: 'c90+', x: 33, d: 3, c: 20 },
    { form: 's90+', x: 56, d: 1, c: 23 },
    { form: 's90+', x: 43, d: 4, c: 36 },
    { form: 's90+', x: 147, d: 4, c: 24 },
    { form: 's90+', x: 51, d: 3, c: 38 },
    { form: 'c90-', x: 19, d: 4, c: 16 },
    { form: 'c90-', x: 37, d: 1, c: 19 },
    { form: 'c90-', x: 14, d: 3, c: 58 },
    { form: 'c90-', x: 6, d: 24, c: 30 },
  ]),
};
