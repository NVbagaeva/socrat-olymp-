/**
 * Данные «Собрать вариант» для задания №3 — собираются на сборке.
 *
 * Банк №3 (прототипы с `varianty`, `poModeli`, `dopustimo`) в браузер
 * не уезжает: здесь из него собираются только задачи, закрытые так
 * же, как на листе печати №3 (pechat-dannye.ts): условие открыто,
 * сценарий чертежа, шаги и ответ закрыты отпечатком ответа.
 *
 * Разделы I–III — ровно `dannyePechati`: чертёж рисуется в браузере
 * из сценария (ученику без построений, учителю — с ними). Разделы
 * IV–VIII печати пока не имеют: у них тот же формат с пустым
 * сценарием, а чертёж — SVG движка solid/, один на прототип, как в
 * тренажёре (pool.ts): числа стоят в условии, не на чертеже.
 */

import { renderSolid } from '@/lib/solid';
import { RAZDELY } from '@/lib/zadanie3';
import { estScenariy } from '@/lib/zadanie3/chertezhi';
import { ru } from '@/lib/zadanie3/format';
import { dannyePechati, type ZadachaPechati } from '@/lib/zadanie3/pechat-dannye';
import { klyuchZadachi, sealAnswer, sealText } from '@/lib/zadanie3/secret';
import type { Prototype } from '@/lib/zadanie3/types';

/** Задача: запись листа печати без названия прототипа, плюс источник варианта. */
export interface Zadacha03 extends Omit<ZadachaPechati, 'nazvanie'> {
  /** Откуда вариант: «задачник 42», «домашка 9, вариант 2», «новый». */
  ref: string;
}

export interface Dannye03 {
  /** Прототип → римский номер раздела. */
  razdel: Record<string, string>;
  /** Чертёж разделов IV–VIII (SVG solid/): по прототипу или по ключу задачи «P03-52#3». */
  svg: Record<string, string>;
  zadachi: Zadacha03[];
}

/** Тела вращения: та же запись, что у листа печати, без сценария. */
function bezScenariya(p: Prototype): ZadachaPechati[] {
  return p.varianty.map((v) => {
    const otvet = p.otvet(v.params);
    const seal = sealAnswer(otvet, klyuchZadachi(p.id, v.n));
    return {
      klyuch: `${p.id}#${v.n}`,
      prototip: p.id,
      nazvanie: p.nazvanie,
      uslovie: p.uslovie(v.params),
      seal,
      scena: '',
      shagi: sealText(
        p
          .shagi(v.params)
          .map((s) => s.text.replace(/\n/g, ' '))
          .join('\n'),
        seal,
      ),
      otvet: sealText(ru(otvet), seal),
    };
  });
}

export function dannye(): Dannye03 {
  const razdel: Record<string, string> = {};
  const svg: Record<string, string> = {};
  const ref = new Map<string, string>();
  const zadachi: ZadachaPechati[] = [];
  for (const r of RAZDELY) {
    for (const p of r.prototipy) {
      razdel[p.id] = r.nomer;
      for (const v of p.varianty) ref.set(`${p.id}#${v.n}`, v.ref);
      if (!estScenariy(p)) {
        /* Числа на самом чертеже — чертёж свой у варианта (как perVariant в pool.ts). */
        const first = p.varianty[0];
        if (first !== undefined && (p.chertezh(first.params).measures ?? []).length > 0) {
          for (const v of p.varianty) svg[`${p.id}#${v.n}`] = renderSolid(p.chertezh(v.params));
        } else if (first !== undefined) {
          svg[p.id] = renderSolid(p.chertezh(first.params));
        }
        zadachi.push(...bezScenariya(p));
      }
    }
    if (r.prototipy.some(estScenariy)) zadachi.push(...dannyePechati(r));
  }
  return {
    razdel,
    svg,
    zadachi: zadachi.map(({ nazvanie: _, ...z }) => ({ ...z, ref: ref.get(z.klyuch) ?? '' })),
  };
}
