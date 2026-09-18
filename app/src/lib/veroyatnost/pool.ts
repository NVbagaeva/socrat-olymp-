/**
 * Банк задания №4 для тренажёра: то, что уезжает в браузер.
 *
 * Собирается на сборке. Формул ответа, ограничений и перебора здесь
 * уже нет — вниз едут только условие, отпечаток ответа и закрытый
 * разбор. Открытым текстом ответа в бандле не остаётся, и это
 * проверяется отдельным автотестом по готовой сборке.
 *
 * Условие — обычный текст: в задании №4 формул в условии не бывает,
 * поэтому KaTeX здесь не нужен, и в браузер он не едет.
 */

import { BANK_4, blokById, otvetUchenika } from './index';
import { BLOKI_4, type Blok } from './blocks';
import { sealAnswer, sealText } from './secret';
import { type Prototype } from './types';

export interface PoolVariant {
  /** Номер варианта в прототипе, 1…10. */
  n: number;
  uslovie: string;
  /** Отпечаток верного ответа. Самого ответа здесь нет. */
  seal: string;
  /** Закрытый разбор: шаги через перевод строки. */
  steps: string;
}

export interface PoolKind {
  /** Идентификатор прототипа: он же значение фильтра по типу. */
  id: string;
  title: string;
  /** Что именно ищут — строкой под условием. */
  tip: string;
  /** Блок задачника: по нему фильтруют чипы. */
  blok: string;
  blokTitle: string;
  /** Диапазон номеров задачника, откуда собран прототип. */
  zadachnik: readonly [number, number];
  variants: PoolVariant[];
}

export interface Pool {
  bloki: readonly Blok[];
  kinds: PoolKind[];
}

function kindOf(prototype: Prototype): PoolKind {
  const blok = blokById(prototype.blok);
  if (blok === undefined) {
    throw new Error(`У прототипа ${prototype.id} неизвестный блок ${prototype.blok}`);
  }
  return {
    id: prototype.id,
    title: prototype.nazvanie,
    tip: prototype.tip,
    blok: blok.id,
    blokTitle: blok.nazvanie,
    zadachnik: prototype.zadachnik,
    variants: prototype.varianty.map((variant) => {
      const seal = sealAnswer(otvetUchenika(prototype, variant.params));
      const steps = prototype
        .shagi(variant.params)
        .map((shag) => shag.text)
        .join('\n');
      return {
        n: variant.n,
        uslovie: prototype.uslovie(variant.params),
        seal,
        /* Разбор шифруется отпечатком ответа: в бандле он лежит
           набором символов, а раскрывается только по просьбе. */
        steps: sealText(steps, seal),
      };
    }),
  };
}

export function bank4Pool(): Pool {
  return { bloki: BLOKI_4, kinds: BANK_4.map(kindOf) };
}
