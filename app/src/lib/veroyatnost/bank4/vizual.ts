/**
 * Рисунки и формулы шагов для задания №4 — общие сборщики.
 *
 * Прототипы описывают задачу числами; здесь эти числа становятся
 * параметрами рисунка и формулами в TeX. Сборщики одни на весь банк,
 * чтобы у двадцати прототипов не было двадцати чуть разных способов
 * нарисовать плитки.
 *
 * Подсветка благоприятного возвращается отдельно от параметров и в
 * условие не попадает — см. model.ts.
 */

import type { Vizual } from '../model';
import { dec, round, type Step } from '../types';

/* ── Числа в TeX ─────────────────────────────────────────────────── */

/** Десятичная дробь по-русски внутри формулы: `0{,}25`. */
export function texDec(value: number): string {
  return dec(value).replace(',', '{,}');
}

/** Настоящая дробь. */
export function drob(chislitel: number | string, znamenatel: number | string): string {
  return `\\dfrac{${chislitel}}{${znamenatel}}`;
}

/**
 * Последний шаг любой задачи на m/n: «P = m/n = k/N = 0,2».
 * При округлении вместо равенства стоит ≈ и ответ округлён так, как
 * его запишет ученик.
 */
export function shagP(m: number, n: number, znakov: 2 | 3 | null = null): Step {
  const tochno = m / n;
  const otvet = znakov === null ? tochno : round(tochno, znakov);
  const znak = znakov === null ? '=' : '\\approx';
  return {
    text: 'Вероятность',
    formula: `P = ${drob('m', 'n')} = ${drob(m, n)} ${znak} ${texDec(otvet)}`,
    value: otvet,
  };
}

/** Последний шаг для отношения мер: «P = l/L = 200/400 = 0,5». */
export function shagLL(l: number | string, L: number | string, otvet: number): Step {
  return {
    text: 'Вероятность',
    formula: `P = ${drob('l', 'L')} = ${drob(l, L)} = ${texDec(otvet)}`,
    value: otvet,
  };
}

/* ── Плитки исходов ──────────────────────────────────────────────── */

export interface Gruppa {
  label: string;
  count: number;
  /** Эта группа — благоприятная. */
  blago: boolean;
}

/** Больше стольких плиток на рисунке не бывает: дальше плитка — группа. */
const PLITOK_MAX = 30;

/**
 * Плитки из групп одинаковых объектов.
 *
 * Пока исходов немного, каждый получает свою плитку — так n и m
 * видны как количество плиток. Когда исходов сотни (900 насосов),
 * плитка стоит за группу и несёт её количество; n и m считаются по
 * `counts`, а не по числу плиток.
 */
export function plitki(gruppy: readonly Gruppa[], columns?: number): Vizual {
  const vsego = gruppy.reduce((s, g) => s + g.count, 0);
  const groups = gruppy.map((g) => ({ label: g.label, count: g.count }));

  if (vsego <= PLITOK_MAX) {
    const outcomes: string[] = [];
    const favorable: number[] = [];
    for (const g of gruppy) {
      for (let i = 0; i < g.count; i += 1) {
        if (g.blago) {
          favorable.push(outcomes.length);
        }
        outcomes.push(g.label);
      }
    }
    return {
      parametry: {
        method: 'direct-count',
        outcomes,
        groups,
        ...(columns === undefined ? {} : { columns }),
      },
      podsvetka: { method: 'direct-count', favorable },
    };
  }

  return {
    parametry: {
      method: 'direct-count',
      outcomes: gruppy.map((g) => g.label),
      counts: gruppy.map((g) => g.count),
      groups,
      columns: Math.min(gruppy.length, 4),
    },
    podsvetka: {
      method: 'direct-count',
      favorable: gruppy.flatMap((g, i) => (g.blago ? [i] : [])),
    },
  };
}

/** Две группы: благоприятная и все остальные. */
export function plitkiDvuh(
  blago: { label: string; count: number },
  ostalnye: { label: string; count: number },
): Vizual {
  return plitki([
    { ...blago, blago: true },
    { ...ostalnye, blago: false },
  ]);
}

/* ── Таблица исходов ─────────────────────────────────────────────── */

/**
 * Две игральные кости: в клетке — то, что спрашивают (сумма,
 * произведение), благоприятны клетки, где это подходит.
 */
export function tablitsaKostey(
  soderzhimoe: (a: number, b: number) => number,
  podhodit: (a: number, b: number) => boolean,
): Vizual {
  const cells: string[][] = [];
  const favorableCells: [number, number][] = [];
  for (let a = 1; a <= 6; a += 1) {
    const ryad: string[] = [];
    for (let b = 1; b <= 6; b += 1) {
      ryad.push(String(soderzhimoe(a, b)));
      if (podhodit(a, b)) {
        favorableCells.push([a - 1, b - 1]);
      }
    }
    cells.push(ryad);
  }
  return {
    parametry: {
      method: 'outcome-table',
      rows: 6,
      columns: 6,
      rowTitle: '1-й кубик',
      columnTitle: '2-й кубик',
      cells,
    },
    podsvetka: { method: 'outcome-table', favorableCells },
  };
}

/** Все последовательности из n букв О и Р. */
function posledovatelnosti(n: number, bukvy: readonly [string, string]): string[] {
  if (n === 0) {
    return [''];
  }
  return posledovatelnosti(n - 1, bukvy).flatMap((s) => [s + bukvy[0], s + bukvy[1]]);
}

/**
 * Монета n раз таблицей всех 2ⁿ исходов.
 *
 * Пара бросков — таблица 2×2. Три и четыре броска раскладываются на
 * две половины: строки — исходы первой половины, столбцы — второй;
 * каждая клетка — полная последовательность, так что все 2ⁿ исходов
 * на месте и остаются равновозможными.
 *
 * `uspeh` — какая буква считается успехом; `podhodit` получает число
 * успехов в последовательности.
 */
export function tablitsaMonet(
  n: number,
  bukvy: readonly [string, string],
  uspeh: string,
  podhodit: (uspehov: number) => boolean,
  zagolovki: readonly [string, string] = ['1-й бросок', '2-й бросок'],
): Vizual {
  const pervyh = Math.ceil(n / 2);
  const vtoryh = n - pervyh;
  const stroki = posledovatelnosti(pervyh, bukvy);
  const stolbtsy = posledovatelnosti(vtoryh, bukvy);
  const cells: string[][] = [];
  const favorableCells: [number, number][] = [];
  stroki.forEach((s, r) => {
    const ryad: string[] = [];
    stolbtsy.forEach((t, c) => {
      const vse = s + t;
      ryad.push(vse);
      const uspehov = [...vse].filter((b) => b === uspeh).length;
      if (podhodit(uspehov)) {
        favorableCells.push([r, c]);
      }
    });
    cells.push(ryad);
  });
  const podpisi = (spisok: string[]): string[] => spisok.map((s) => (s === '' ? '—' : s));
  return {
    parametry: {
      method: 'outcome-table',
      rows: stroki.length,
      columns: stolbtsy.length,
      rowLabels: podpisi(stroki),
      columnLabels: podpisi(stolbtsy),
      rowTitle: n <= 2 ? zagolovki[0] : `броски 1–${pervyh}`,
      columnTitle: n <= 2 ? zagolovki[1] : `броски ${pervyh + 1}–${n}`,
      cells,
    },
    podsvetka: { method: 'outcome-table', favorableCells },
  };
}

/* ── Координатная прямая ─────────────────────────────────────────── */

/** Циферблат: дуга от одной отметки до другой по часовой стрелке. */
export function tsiferblat(from: number, to: number): Vizual {
  return {
    parametry: { method: 'coordinate-line', shape: 'arc', divisions: 12, from, to },
    podsvetka: { method: 'coordinate-line' },
  };
}

/** Площади: вся фигура и благоприятная часть в одних единицах. */
export function ploshchadi(total: number, favorable: number, unit?: string): Vizual {
  return {
    parametry: {
      method: 'coordinate-line',
      shape: 'area',
      total,
      favorable,
      ...(unit === undefined ? {} : { unit }),
    },
    podsvetka: { method: 'coordinate-line' },
  };
}
