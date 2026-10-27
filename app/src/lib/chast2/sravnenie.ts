/**
 * Автопроверка ответа части 2: сравнение по значению, не по записи.
 *
 *   число        2√21/√103 = √84/√103 = 0,9031…   — с допуском
 *   выражение    14,4√(2/(2−n))                     — по значениям в точках
 *   корни        −11π/2; −5π                        — без учёта порядка
 *   промежутки   [1; 1,5) ∪ [16; +∞)                — по концам и скобкам
 *   серии        x = π + 2πn, n ∈ ℤ                 — множества значений на отрезке
 *   да / нет
 *
 * Итог — «совпадает», «не совпадает» или «проверит учитель», если запись
 * не разобралась. Это подсказка учителю, а не баллы: баллы ставит он.
 */

import { peremennye, razobrat, vychislit, type Uzel } from './vyrazhenie';

export type Itog = 'sovpadaet' | 'ne-sovpadaet' | 'uchitel';

/** Кусок множества: точка или промежуток. Концы — записи (TeX или текст). */
export type Kusok =
  | { t: 'tochka'; x: string }
  | { t: 'interval'; lo: string; loZakr: boolean; hi: string; hiZakr: boolean };

export interface Mnozhestvo {
  kuski: Kusok[];
}

/** Поле ответа: тип и верный ответ. */
export type Pole =
  | { vid: 'chislo'; verno: string }
  | {
      vid: 'vyrazhenie';
      verno: string;
      oblast: Readonly<Record<string, readonly [number, number]>>;
    }
  | { vid: 'korni'; verno: readonly string[] }
  | { vid: 'promezhutki'; verno: Mnozhestvo }
  | { vid: 'serii'; verno: readonly string[] }
  | { vid: 'danet'; verno: boolean };

/** Ответ ученика по типу поля. */
export type Vvod = string | readonly string[] | Mnozhestvo | 'da' | 'net' | null;

const TOL = 1e-7;
const blizko = (a: number, b: number) =>
  a === b ||
  (Number.isFinite(a) &&
    Number.isFinite(b) &&
    Math.abs(a - b) <= TOL * Math.max(1, Math.abs(a), Math.abs(b)));

/** Число из записи; null — не разобралось, есть буквы или не число. */
function chislo(src: string): number | null {
  const u = razobrat(src);
  if (u === null || peremennye(u).size > 0) return null;
  const v = vychislit(u);
  return Number.isNaN(v) ? null : v;
}

/* ── Выражение с переменными ────────────────────────────────────── */

/** Точки проверки в области: детерминированные, не «круглые». */
function tochki(
  oblast: Readonly<Record<string, readonly [number, number]>>,
): Record<string, number>[] {
  const imena = Object.keys(oblast);
  const doli = [0.137, 0.291, 0.418, 0.563, 0.707, 0.853, 0.961];
  return doli.map((d, i) =>
    Object.fromEntries(
      imena.map((v, j) => {
        const [lo, hi] = oblast[v]!;
        const t = doli[(i + j * 3) % doli.length]!;
        return [v, lo + (hi - lo) * (j === 0 ? d : t)];
      }),
    ),
  );
}

function ravnyVyrazheniya(
  a: Uzel,
  b: Uzel,
  oblast: Readonly<Record<string, readonly [number, number]>>,
): boolean {
  return tochki(oblast).every((pt) => {
    const x = vychislit(a, pt);
    const y = vychislit(b, pt);
    return Number.isFinite(x) && Number.isFinite(y) && blizko(x, y);
  });
}

/* ── Множества ──────────────────────────────────────────────────── */

interface Otrezok {
  lo: number;
  hi: number;
  loZakr: boolean;
  hiZakr: boolean;
}

/** Множество → упорядоченный список непересекающихся кусков; null — не разобралось. */
export function kanon(m: Mnozhestvo): Otrezok[] | null {
  const raw: Otrezok[] = [];
  for (const k of m.kuski) {
    if (k.t === 'tochka') {
      const x = chislo(k.x);
      if (x === null || !Number.isFinite(x)) return null;
      raw.push({ lo: x, hi: x, loZakr: true, hiZakr: true });
    } else {
      const lo = chislo(k.lo);
      const hi = chislo(k.hi);
      if (lo === null || hi === null) return null;
      /* У бесконечности скобка всегда круглая. */
      const o = {
        lo,
        hi,
        loZakr: Number.isFinite(lo) && k.loZakr,
        hiZakr: Number.isFinite(hi) && k.hiZakr,
      };
      if (o.lo > o.hi || (blizko(o.lo, o.hi) && !(o.loZakr && o.hiZakr))) return null;
      raw.push(o);
    }
  }
  raw.sort((a, b) => a.lo - b.lo || Number(b.loZakr) - Number(a.loZakr));
  const out: Otrezok[] = [];
  for (const o of raw) {
    const last = out[out.length - 1];
    /* Сливаем, если пересекаются или стыкуются без дыры. */
    if (
      last !== undefined &&
      (o.lo < last.hi - TOL || (blizko(o.lo, last.hi) && (o.loZakr || last.hiZakr)))
    ) {
      if (o.hi > last.hi + TOL) {
        last.hi = o.hi;
        last.hiZakr = o.hiZakr;
      } else if (blizko(o.hi, last.hi)) {
        last.hiZakr = last.hiZakr || o.hiZakr;
      }
      if (blizko(o.lo, last.lo)) last.loZakr = last.loZakr || o.loZakr;
    } else {
      out.push({ ...o });
    }
  }
  return out;
}

function ravnyMnozhestva(a: Otrezok[], b: Otrezok[]): boolean {
  return (
    a.length === b.length &&
    a.every((x, i) => {
      const y = b[i]!;
      return (
        blizko(x.lo, y.lo) && blizko(x.hi, y.hi) && x.loZakr === y.loZakr && x.hiZakr === y.hiZakr
      );
    })
  );
}

/* ── Серии решений ──────────────────────────────────────────────── */

const OKNO = 40 * Math.PI;
const TSELYE = new Set(['n', 'k', 'l', 'm', 't', 'p', 'q', 'z']);

/** «x = π + 2πn, n ∈ ℤ» → правая часть без пояснения о целых. */
function pravayaChast(src: string): string {
  let s = src.trim();
  s = s.replace(/\\in\s*\\mathbb\s*\{?Z\}?|∈\s*ℤ|\\in\s*Z|∈\s*Z/g, '');
  s = s.replace(/[,;]\s*[a-z]\s*(\\in)?\s*$/i, '');
  s = s.replace(/^[a-z]\s*=\s*/i, '');
  return s.replace(/[,;]\s*$/, '');
}

/** Значения серий на [−OKNO; OKNO]; null — не разобралось. */
function znacheniyaSeriy(serii: readonly string[]): number[] | null {
  const out: number[] = [];
  for (const s of serii) {
    if (s.trim() === '') continue;
    const u = razobrat(pravayaChast(s));
    if (u === null) return null;
    const vs = [...peremennye(u)];
    if (vs.length > 1 || (vs.length === 1 && !TSELYE.has(vs[0]!))) return null;
    if (vs.length === 0) {
      const v = vychislit(u);
      if (!Number.isFinite(v)) return null;
      out.push(v);
      continue;
    }
    for (let n = -400; n <= 400; n += 1) {
      const v = vychislit(u, { [vs[0]!]: n });
      if (Number.isFinite(v) && Math.abs(v) <= OKNO) out.push(v);
    }
  }
  return out;
}

/** Одно и то же ли множество чисел (с допуском, без учёта повторов). */
function ravnyNabory(a: readonly number[], b: readonly number[]): boolean {
  const norm = (xs: readonly number[]) => {
    const s = [...xs].sort((x, y) => x - y);
    return s.filter((x, i) => i === 0 || !blizko(x, s[i - 1]!));
  };
  const x = norm(a);
  const y = norm(b);
  return x.length === y.length && x.every((v, i) => blizko(v, y[i]!));
}

/* ── Проверка поля ──────────────────────────────────────────────── */

export function proverit(pole: Pole, vvod: Vvod): Itog {
  if (vvod === null) return 'ne-sovpadaet';
  switch (pole.vid) {
    case 'chislo': {
      if (typeof vvod !== 'string' || vvod.trim() === '') return 'ne-sovpadaet';
      const x = chislo(vvod);
      const y = chislo(pole.verno);
      if (x === null || y === null) return 'uchitel';
      return blizko(x, y) ? 'sovpadaet' : 'ne-sovpadaet';
    }
    case 'vyrazhenie': {
      if (typeof vvod !== 'string' || vvod.trim() === '') return 'ne-sovpadaet';
      const a = razobrat(vvod);
      const b = razobrat(pole.verno);
      if (a === null || b === null) return 'uchitel';
      const lishnie = [...peremennye(a)].filter((v) => !(v in pole.oblast));
      if (lishnie.length > 0) return 'uchitel';
      return ravnyVyrazheniya(a, b, pole.oblast) ? 'sovpadaet' : 'ne-sovpadaet';
    }
    case 'korni': {
      if (!Array.isArray(vvod)) return 'ne-sovpadaet';
      const xs = (vvod as readonly string[]).filter((s) => s.trim() !== '').map(chislo);
      const ys = pole.verno.map(chislo);
      if (xs.length === 0) return 'ne-sovpadaet';
      if (xs.some((x) => x === null) || ys.some((y) => y === null)) return 'uchitel';
      return ravnyNabory(xs as number[], ys as number[]) ? 'sovpadaet' : 'ne-sovpadaet';
    }
    case 'promezhutki': {
      if (typeof vvod !== 'object' || Array.isArray(vvod) || !('kuski' in (vvod as object)))
        return 'ne-sovpadaet';
      const m = vvod as Mnozhestvo;
      if (m.kuski.length === 0) return 'ne-sovpadaet';
      const a = kanon(m);
      const b = kanon(pole.verno);
      if (a === null || b === null) return 'uchitel';
      return ravnyMnozhestva(a, b) ? 'sovpadaet' : 'ne-sovpadaet';
    }
    case 'serii': {
      if (!Array.isArray(vvod)) return 'ne-sovpadaet';
      const arr = (vvod as readonly string[]).filter((s) => s.trim() !== '');
      if (arr.length === 0) return 'ne-sovpadaet';
      const a = znacheniyaSeriy(arr);
      const b = znacheniyaSeriy(pole.verno);
      if (a === null || b === null) return 'uchitel';
      return ravnyNabory(a, b) ? 'sovpadaet' : 'ne-sovpadaet';
    }
    case 'danet':
      if (vvod !== 'da' && vvod !== 'net') return 'ne-sovpadaet';
      return (vvod === 'da') === pole.verno ? 'sovpadaet' : 'ne-sovpadaet';
  }
}
