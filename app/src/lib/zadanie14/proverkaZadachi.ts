/**
 * Проверка ответа ученика на задачу №14 целиком: пункт а (серии),
 * пункт б (корни на промежутке) или разминка (одно число). Тексты
 * отклика — с примером потерянного или лишнего корня.
 */

import { chislo as chisloZapisi } from '../chast2/vyrazhenie';
import { proveritKorni, proveritSerii } from './proverka';
import { piTex, q, korniNaPromezhutke } from './ugol';
import type { Zadacha14 } from './tipy';

export interface Vvod14 {
  serii: string[];
  korni: string;
  chislo: string;
}

export const PUSTOY_VVOD: Vvod14 = { serii: [''], korni: '', chislo: '' };

export type Punkt = 'verno' | 'neverno' | 'ne-razobrano' | 'pusto';

export interface Itog14 {
  a: Punkt;
  b: Punkt | null;
  /** Отклик по пунктам: строки с $…$. */
  otklik: string[];
}

/** Число в долях π, если оно «табличное»: «-\dfrac{7\pi}{6}»; иначе десятичная запись. */
export function kakPi(x: number): string {
  const t = x / Math.PI;
  for (const m of [1, 2, 3, 4, 6, 12]) {
    const n = Math.round(t * m);
    if (Math.abs(t * m - n) < 1e-6) return piTex(q(n, m));
  }
  return x.toFixed(3).replace('.', '{,}');
}

export function proverit14(z: Zadacha14, v: Vvod14): Itog14 {
  if (z.vid === 'razminka') {
    const t = v.chislo.trim();
    if (t === '') return { a: 'pusto', b: null, otklik: [] };
    const x = chisloZapisi(t);
    if (x === null)
      return {
        a: 'ne-razobrano',
        b: null,
        otklik: ['Не получилось прочитать число — запиши его так: $-0{,}5$ или $4$.'],
      };
    const ok = Math.abs(x - z.otvet) < 1e-6;
    return {
      a: ok ? 'verno' : 'neverno',
      b: null,
      otklik: ok
        ? []
        : ['Число не то. Выпиши несколько корней серий рядом с нулём и выбери нужный.'],
    };
  }
  const otklik: string[] = [];
  let a: Punkt = 'pusto';
  if (v.serii.some((s) => s.trim() !== '')) {
    const r = proveritSerii(v.serii, z.serii);
    if (r.itog === 'verno') a = 'verno';
    else if (r.itog === 'ne-razobrano') {
      a = 'ne-razobrano';
      otklik.push(
        `Пункт а: не получилось прочитать серию ${r.stroka + 1}. Пример записи: $\\dfrac{\\pi}{6}+2\\pi k$.`,
      );
    } else {
      a = 'neverno';
      if (r.poteryany.length > 0) {
        otklik.push(`Пункт а: потеряны корни — например, $x=${kakPi(r.poteryany[0] as number)}$.`);
      }
      if (r.lishnie.length > 0) {
        otklik.push(
          `Пункт а: есть лишние корни — например, $x=${kakPi(r.lishnie[0] as number)}$ не подходит.`,
        );
      }
    }
  }
  let b: Punkt | null = null;
  if (z.promezhutok !== undefined) {
    b = 'pusto';
    if (v.korni.trim() !== '') {
      const r = proveritKorni(v.korni, korniNaPromezhutke(z.serii, z.promezhutok));
      if (r.itog === 'verno') b = 'verno';
      else if (r.itog === 'ne-razobrano') {
        b = 'ne-razobrano';
        otklik.push(
          'Пункт б: не получилось прочитать корни. Пиши их через точку с запятой: $-\\dfrac{7\\pi}{6};\\ -\\pi$.',
        );
      } else {
        b = 'neverno';
        const chasti: string[] = [];
        if (r.poteryano > 0) chasti.push(`пропущено корней: ${r.poteryano}`);
        if (r.lishnie > 0) chasti.push(`лишних: ${r.lishnie}`);
        otklik.push(`Пункт б: ${chasti.join(', ')}.`);
      }
    }
  }
  return { a, b, otklik };
}

/** Задача решена верно целиком. */
export function verno14(it: Itog14): boolean {
  return it.a === 'verno' && (it.b === null || it.b === 'verno');
}
