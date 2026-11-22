/**
 * Разобранный пример типа №1 для вкладки «О задании»: первая задача
 * открытого банка этого прототипа (у типов «не из банка» — образец
 * прототипа), как на прежней вкладке «Опорные задачи» в «Разобранных
 * задачах по прототипам». Числа и буквы — как в ФИПИ, без поворота.
 * Решение, сверка, подсказки и чертежи — движок, без правок; у каждого
 * шага — свой чертёж (построения до его слоя, у последнего — все).
 *
 * Собирается на сборке: первый пример — в разметку, остальные —
 * файлами /zadaniya/1/dannye/primer/{тип}.json по раскрытию карточки.
 */

import { typesetKrupno as typeset } from '../../tex';
import { zadachiPrototipa } from '../bank/fipi';
import { prototip } from '../stseny';
import type { Params } from '../stseny/dsl';
import { protoKlyucha } from '../trenazher/sessiya';
import { BEZ_VARIANTA } from '../variant';
import { razborZadachi } from './sborka';

export interface ShagPrimera1 {
  zagolovokHtml: string;
  chtoHtml: string;
  formulaHtml: string;
  /** Чертёж шага; null — шаг без своего построения. */
  svg: string | null;
}

export interface Primer1 {
  /** Номер задачи открытого банка; null — тип не из банка (образец). */
  fipi: number | null;
  uslovieHtml: string;
  /** Чертёж условия, как в ФИПИ. */
  usloviyeSvg: string;
  shagi: ShagPrimera1[];
  sokrashchenie: { tekst: string; formula: string }[];
  sverkaHtml: string;
  otvetHtml: string;
}

/** Пример типа по ключу прототипа («p05»); неизвестный тип — null. */
export function primer1(tip: string): Primer1 | null {
  if (!/^p\d\d$/.test(tip)) return null;
  const proto = protoKlyucha(tip);
  let p;
  try {
    p = prototip(proto);
  } catch {
    return null;
  }
  const z = zadachiPrototipa(proto)[0];
  const params = { ...p.primer, ...(z?.params ?? {}) } as Params;
  const { sostav, s } = razborZadachi({
    proto,
    params,
    variant: BEZ_VARIANTA,
    fipi: z?.n ?? null,
  });
  return {
    fipi: z?.n ?? null,
    uslovieHtml: typeset(sostav.uslovie),
    usloviyeSvg: sostav.risunokSvg,
    shagi: s.shagi.map((shag) => ({
      zagolovokHtml: shag.zagolovok,
      chtoHtml: shag.tekst.map((t) => `<p>${t}</p>`).join(''),
      formulaHtml: shag.formuly.join(''),
      svg: shag.risunokSvg,
    })),
    sokrashchenie: s.shagi.flatMap((shag) => shag.sokrashchenie),
    sverkaHtml: s.sverkaHtml,
    otvetHtml: s.otvetHtml,
  };
}
