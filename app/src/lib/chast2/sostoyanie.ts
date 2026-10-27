/**
 * Состояние части 2 в работе: ответы по пунктам, итог сверки, открытое
 * решение и самооценка по критериям. Хранится в состоянии экрана
 * сессии (localStorage), поэтому каждое поле читается с проверкой.
 */

import { PART2_NUMBERS, MAX_BALL, type Part2No } from '@/content/variantOnline/bally';
import type { Itog, Kusok, Mnozhestvo, Pole, Vvod } from './sravnenie';

/** Ключ пункта: «14.0», «14.1». */
export function punktKey(no: Part2No, punkt: number): string {
  return `${no}.${punkt}`;
}

export interface Chast2Ui {
  /** Ответы по пунктам. */
  vvod: Record<string, Vvod>;
  /** Итог сверки по пунктам (после «Сверить ответ»). */
  sverka: Record<string, Itog>;
  /** Задания, у которых открыто решение и критерии: ответ больше не меняется. */
  reshenie: Part2No[];
  /** Самопроверка: балл и выбранная строка критериев «балл:строка». */
  ball: Partial<Record<Part2No, number>>;
  stroka: Partial<Record<Part2No, string>>;
}

export function pustoyChast2(): Chast2Ui {
  return { vvod: {}, sverka: {}, reshenie: [], ball: {}, stroka: {} };
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isNo = (n: number): n is Part2No => (PART2_NUMBERS as readonly number[]).includes(n);
const KEY = /^(1[4-9]|20)\.\d$/;
const short = (s: unknown) => (typeof s === 'string' ? s.slice(0, 200) : '');

function readKusok(v: unknown): Kusok | null {
  if (!isObj(v)) return null;
  if (v['t'] === 'tochka') return { t: 'tochka', x: short(v['x']) };
  if (v['t'] === 'interval') {
    return {
      t: 'interval',
      lo: short(v['lo']),
      hi: short(v['hi']),
      loZakr: v['loZakr'] === true,
      hiZakr: v['hiZakr'] === true,
    };
  }
  return null;
}

export function readVvod(v: unknown): Vvod {
  if (v === 'da' || v === 'net') return v;
  if (typeof v === 'string') return v.slice(0, 200);
  if (Array.isArray(v)) return v.slice(0, 12).map(short);
  if (isObj(v) && Array.isArray(v['kuski'])) {
    return {
      kuski: v['kuski']
        .slice(0, 12)
        .map(readKusok)
        .filter((k): k is Kusok => k !== null),
    };
  }
  return null;
}

/** Состояние из хранилища: что не прочиталось — пусто. */
export function readChast2(v: unknown): Chast2Ui {
  const out = pustoyChast2();
  if (!isObj(v)) return out;
  if (isObj(v['vvod'])) {
    for (const [k, x] of Object.entries(v['vvod'])) if (KEY.test(k)) out.vvod[k] = readVvod(x);
  }
  if (isObj(v['sverka'])) {
    for (const [k, x] of Object.entries(v['sverka'])) {
      if (KEY.test(k) && (x === 'sovpadaet' || x === 'ne-sovpadaet' || x === 'uchitel'))
        out.sverka[k] = x;
    }
  }
  if (Array.isArray(v['reshenie'])) {
    out.reshenie = v['reshenie'].filter((n): n is Part2No => typeof n === 'number' && isNo(n));
  }
  if (isObj(v['ball'])) {
    for (const [k, x] of Object.entries(v['ball'])) {
      const no = Number(k);
      if (isNo(no) && typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= MAX_BALL[no])
        out.ball[no] = x;
    }
  }
  if (isObj(v['stroka'])) {
    for (const [k, x] of Object.entries(v['stroka'])) {
      const no = Number(k);
      if (isNo(no) && typeof x === 'string' && /^\d:\d$/.test(x)) out.stroka[no] = x;
    }
  }
  return out;
}

/* ── Заполненность ──────────────────────────────────────────────── */

/** Пустая ли запись куска множества. */
function kusokPust(k: Kusok): boolean {
  return k.t === 'tochka' ? k.x.trim() === '' : k.lo.trim() === '' && k.hi.trim() === '';
}

/** Есть ли в поле хоть что-то. */
export function vvodEst(vvod: Vvod): boolean {
  if (vvod === null) return false;
  if (vvod === 'da' || vvod === 'net') return true;
  if (typeof vvod === 'string') return vvod.trim() !== '';
  if (Array.isArray(vvod)) return (vvod as readonly string[]).some((s) => s.trim() !== '');
  return (vvod as Mnozhestvo).kuski.some((k) => !kusokPust(k));
}

/** Пустое значение поля по типу. */
export function pustoyVvod(pole: Pole): Vvod {
  switch (pole.vid) {
    case 'korni':
    case 'serii':
      return [''];
    case 'promezhutki':
      return { kuski: [{ t: 'interval', lo: '', hi: '', loZakr: true, hiZakr: false }] };
    case 'danet':
      return null;
    default:
      return '';
  }
}

/* ── Баллы части 2 ──────────────────────────────────────────────── */

export interface BallyChast2 {
  /** Сумма выставленных баллов. */
  summa: number;
  /** Сколько заданий оценено. */
  oceneno: number;
  vsego: number;
  max: number;
}

export function ballyChast2(nos: readonly Part2No[], ball: Chast2Ui['ball']): BallyChast2 {
  let summa = 0;
  let oceneno = 0;
  let max = 0;
  for (const no of nos) {
    max += MAX_BALL[no];
    const b = ball[no];
    if (b !== undefined) {
      summa += Math.min(b, MAX_BALL[no]);
      oceneno += 1;
    }
  }
  return { summa, oceneno, vsego: nos.length, max };
}

/* ── Показ ответа ───────────────────────────────────────────────── */

/** Ответ пункта в TeX для таблиц: «\frac{7\pi}{2};\ 4\pi». Пусто — ''. */
export function vvodTex(pole: Pole, vvod: Vvod): string {
  if (!vvodEst(vvod)) return '';
  switch (pole.vid) {
    case 'danet':
      return vvod === 'da' ? '\\text{да}' : '\\text{нет}';
    case 'korni':
      return (vvod as readonly string[]).filter((s) => s.trim() !== '').join(';\\ ');
    case 'serii':
      return (vvod as readonly string[])
        .filter((s) => s.trim() !== '')
        .map((s) => `x=${s}`)
        .join(';\\ ');
    case 'promezhutki':
      return (vvod as Mnozhestvo).kuski
        .filter((k) => !kusokPust(k))
        .map((k) =>
          k.t === 'tochka'
            ? `\\{${k.x}\\}`
            : `${k.loZakr && !k.lo.includes('infty') ? '[' : '('}${k.lo};\\ ${k.hi}${k.hiZakr && !k.hi.includes('infty') ? ']' : ')'}`,
        )
        .join('\\cup ');
    default:
      return typeof vvod === 'string' ? vvod : '';
  }
}

/** Итог сверки задания по пунктам: все совпали — «совпадает»; хоть один нет — «не совпадает». */
export function itogZadaniya(itogi: readonly Itog[]): Itog | null {
  if (itogi.length === 0) return null;
  if (itogi.some((x) => x === 'ne-sovpadaet')) return 'ne-sovpadaet';
  if (itogi.some((x) => x === 'uchitel')) return 'uchitel';
  return 'sovpadaet';
}
