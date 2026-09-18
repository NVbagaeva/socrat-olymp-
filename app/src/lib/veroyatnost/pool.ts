/**
 * Банк задания №4 для тренажёра: то, что уезжает в браузер.
 *
 * Собирается на сборке. Формул ответа, ограничений и перебора здесь
 * уже нет — вниз едут только условие, отпечаток ответа и закрытый
 * разбор. Открытым текстом ответа в бандле не остаётся, и это
 * проверяется отдельным автотестом по готовой сборке.
 *
 * Условие и разбор набраны здесь же: формулы в $…$ проходят через
 * KaTeX на сборке, в браузер уходит готовая разметка, и сам KaTeX
 * туда не едет. Разбор закрывается целиком — слова, формулы и
 * координатная прямая одной строкой (см. nabor.ts и razbor.ts).
 */

import { typeset } from '../tex';
import {
  BANK_4,
  BANK_5,
  PODGOTOVKA_4,
  PODGOTOVKA_5,
  blokById,
  otvetUchenika,
  prepOtvet,
} from './index';
import { BLOKI_4, BLOKI_5, type Blok } from './blocks';
import { naborRazbora, zapechatatRazbor } from './nabor';
import { sealAnswer } from './secret';
import { type Illyustratsiya, type PrepBlok, type Prototype } from './types';

/**
 * Знак на плашке типа задачи: у задач с координатной прямой — ось
 * с засечками, у остальных — общий знак задачи.
 */
export type Znak = 'pryamaya' | 'zadacha';

export interface PoolVariant {
  /** Номер варианта в прототипе, 1…10. */
  n: number;
  /** Условие: HTML, формулы набраны. */
  uslovie: string;
  /** Отпечаток верного ответа. Самого ответа здесь нет. */
  seal: string;
  /** Закрытый разбор: слова, формулы и чертёж одной строкой. */
  razbor: string;
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
  znak: Znak;
  illyustratsiya?: Illyustratsiya;
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
    znak: prototype.pryamaya === undefined ? 'zadacha' : 'pryamaya',
    ...(prototype.illyustratsiya === undefined ? {} : { illyustratsiya: prototype.illyustratsiya }),
    variants: prototype.varianty.map((variant) => {
      const seal = sealAnswer(otvetUchenika(prototype, variant.params));
      const razbor = naborRazbora(
        prototype.shagi(variant.params),
        prototype.pryamaya?.(variant.params),
      );
      return {
        n: variant.n,
        uslovie: typeset(prototype.uslovie(variant.params)),
        seal,
        /* Разбор шифруется отпечатком ответа: в бандле он лежит
           набором символов, а раскрывается только по просьбе. */
        razbor: zapechatatRazbor(razbor, seal),
      };
    }),
  };
}

export function bank4Pool(): Pool {
  return { bloki: BLOKI_4, kinds: BANK_4.map(kindOf) };
}

export function bank5Pool(): Pool {
  return { bloki: BLOKI_5, kinds: BANK_5.map(kindOf) };
}

/* ── Подготовительные задачи ─────────────────────────────────────── */

export interface PrepPoolZadacha {
  id: string;
  /** Номер задачи в конспекте автора. */
  nomer: number;
  /** Условие: HTML, формулы набраны. */
  uslovie: string;
  /** Отпечаток верного ответа. Самого ответа здесь нет. */
  seal: string;
  /** Закрытый разбор: слова, формулы и чертёж одной строкой. */
  razbor: string;
  znak: Znak;
  illyustratsiya?: Illyustratsiya;
  /** Чертёж задачи готовой разметкой SVG, если он ей нужен. */
  risunok?: string;
}

export interface PrepPoolBlok {
  id: string;
  nazvanie: string;
  tip: string;
  zadachi: PrepPoolZadacha[];
}

/**
 * Подготовительные задачи для браузера: условия, отпечатки, закрытые
 * разборы. Ответов и второй проверки здесь уже нет — они остаются
 * на сборке, как и у банка прототипов.
 */
function prepPool(bloki: readonly PrepBlok[]): PrepPoolBlok[] {
  return bloki.map((blok) => ({
    id: blok.id,
    nazvanie: blok.nazvanie,
    tip: blok.tip,
    zadachi: blok.zadachi.map((zadacha) => {
      const seal = sealAnswer(prepOtvet(zadacha));
      return {
        id: zadacha.id,
        nomer: zadacha.nomer,
        uslovie: typeset(zadacha.uslovie),
        seal,
        razbor: zapechatatRazbor(naborRazbora(zadacha.shagi, zadacha.pryamaya), seal),
        znak: zadacha.pryamaya === undefined ? 'zadacha' : 'pryamaya',
        ...(zadacha.illyustratsiya === undefined ? {} : { illyustratsiya: zadacha.illyustratsiya }),
        ...(zadacha.risunok === undefined ? {} : { risunok: zadacha.risunok }),
      };
    }),
  }));
}

export function prep4Pool(): PrepPoolBlok[] {
  return prepPool(PODGOTOVKA_4);
}

export function prep5Pool(): PrepPoolBlok[] {
  return prepPool(PODGOTOVKA_5);
}
