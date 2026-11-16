/**
 * Набор примеров для тренировки: один приём, несколько приёмов
 * вперемешку, микс по действию, таблица умножения или готовый список
 * («Повторить ошибки»).
 *
 * Генератор не повторяет примеры в одной тренировке. Если у набора
 * все примеры кончились (у «квадратов 11–20» их десять), начинается
 * новый круг — тот же набор в другом порядке.
 */

import { dec, cmp } from './chislo';
import { priyom, priyomyDeystviya } from './registry';
import { createRng, type Rng } from './rng';
import { STROKI_VSE } from './priyomy/tablica';
import type { FormatId } from './formaty';
import type { Deystvie, GenOpts, Primer, Priyom, PriyomId, Uroven } from './types';

export type Nabor =
  | { tip: 'priyomy'; ids: readonly PriyomId[] }
  | { tip: 'deystviya'; ids: readonly Deystvie[] }
  | {
      tip: 'tablica';
      stroki: readonly number[];
      /** Обратная форма: нет, только обратная, вперемешку. */
      obratnaya: 'net' | 'da' | 'smes';
      poryadok: 'vrazbros' | 'po-poryadku';
    }
  | { tip: 'spisok'; primery: readonly Primer[] }
  | { tip: 'format'; id: FormatId };

export interface Nastroyki {
  uroven: Uroven;
  desyatichnye: boolean;
  otricatelnye: boolean;
  /** Числа не больше (по модулю), null — без ограничения. */
  predel: number | null;
}

export const NASTROYKI_PO_UMOLCHANIYU: Nastroyki = {
  uroven: 1,
  desyatichnye: true,
  otricatelnye: true,
  predel: null,
};

export interface Generator {
  /** Следующий пример; null — набор пуст при этих настройках. */
  next(): Primer | null;
  /** Сколько раз набор начинался заново (для проверок). */
  readonly krugi: number;
}

/** Готовый поток примеров: для форматов (formaty.ts). */
export type Istochnik = (rng: Rng) => Primer | null;

function vPredele(p: Primer, predel: number | null): boolean {
  if (predel === null) return true;
  const lim = dec(predel);
  const ok = (s: string) => {
    const v = dec(s);
    return cmp(v.m < 0n ? { m: -v.m, e: v.e } : v, lim) <= 0;
  };
  return ok(p.otvet) && p.d.every(ok);
}

/** Пары «генератор + действие», из которых тянется микс. */
function istochniki(nabor: Nabor): { pr: Priyom; deystvie?: Deystvie }[] {
  if (nabor.tip === 'priyomy') return nabor.ids.map((id) => ({ pr: priyom(id) }));
  if (nabor.tip === 'deystviya') {
    return nabor.ids.flatMap((d) => priyomyDeystviya(d).map((pr) => ({ pr, deystvie: d })));
  }
  if (nabor.tip === 'tablica') return [{ pr: priyom('tablica') }];
  return [];
}

export interface GeneratorOpts {
  seed: string | number;
  /** Свой источник (рейтинговые форматы и проверки). */
  istochnik?: Istochnik;
}

export function sozdatGenerator(nabor: Nabor, nast: Nastroyki, g: GeneratorOpts): Generator {
  const rng = createRng(g.seed);
  const used = new Set<string>();
  let krugi = 0;

  if (nabor.tip === 'spisok') {
    let ochered: Primer[] = [];
    return {
      get krugi() {
        return krugi;
      },
      next() {
        if (nabor.primery.length === 0) return null;
        if (ochered.length === 0) {
          if (used.size > 0) krugi += 1;
          ochered = rng.shuffle(nabor.primery);
          used.add('x');
        }
        return ochered.shift() ?? null;
      },
    };
  }

  /* Таблица по порядку: строка за строкой, множитель от 2 до 9 (10). */
  if (nabor.tip === 'tablica' && nabor.poryadok === 'po-poryadku') {
    const stroki = nabor.stroki.length > 0 ? nabor.stroki : STROKI_VSE.slice(0, 8);
    const vtorye = stroki.includes(10) ? [2, 3, 4, 5, 6, 7, 8, 9, 10] : [2, 3, 4, 5, 6, 7, 8, 9];
    const tb = priyom('tablica');
    let i = 0;
    const all = stroki.flatMap((a) => vtorye.map((b) => [a, b] as const));
    return {
      get krugi() {
        return krugi;
      },
      next() {
        if (i >= all.length) {
          i = 0;
          krugi += 1;
        }
        const [a, b] = all[i] as readonly [number, number];
        i += 1;
        const obr = nabor.obratnaya === 'da' || (nabor.obratnaya === 'smes' && rng.chance(0.5));
        return tb.iz([String(a), String(b)], nast.uroven, obr ? 'obr' : undefined);
      },
    };
  }

  const src = istochniki(nabor);
  const tab = nabor.tip === 'tablica' ? nabor : null;

  function popytka(): Primer | null {
    if (g.istochnik !== undefined) return g.istochnik(rng);
    if (src.length === 0) return null;
    const s = rng.pick(src);
    const opts: GenOpts = {
      uroven: nast.uroven,
      desyatichnye: nast.desyatichnye,
      otricatelnye: nast.otricatelnye,
      ...(s.deystvie === undefined ? {} : { deystvie: s.deystvie }),
      ...(tab === null
        ? {}
        : {
            stroki: tab.stroki,
            ...(tab.obratnaya === 'smes' ? {} : { obratnaya: tab.obratnaya === 'da' }),
          }),
    };
    return s.pr.sozdat(rng, opts);
  }

  return {
    get krugi() {
      return krugi;
    },
    next() {
      for (let krug = 0; krug < 2; krug += 1) {
        let pustyh = 0;
        for (let i = 0; i < 400; i += 1) {
          const p = popytka();
          if (p === null) {
            pustyh += 1;
            if (pustyh > 60) break;
            continue;
          }
          if (!vPredele(p, nast.predel)) continue;
          if (used.has(p.key)) continue;
          used.add(p.key);
          return p;
        }
        if (used.size === 0) return null;
        /* Все примеры набора уже были — новый круг. */
        used.clear();
        krugi += 1;
      }
      return null;
    },
  };
}
