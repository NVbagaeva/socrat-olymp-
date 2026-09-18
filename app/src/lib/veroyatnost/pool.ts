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
import {
  modelPrep,
  modelVarianta,
  texPlain,
  type Method,
  type Parametry,
  type Shape,
} from './model';
import type { Razbor } from './razbor';
import { fingerprint, sealAnswer, sealText } from './secret';
import {
  type Metodika,
  type PrepBlok,
  type PrepZadacha,
  type Prototype,
  type Variant,
} from './types';
import { typeset } from '../tex';

/**
 * Открытая часть модели задачи: метод, форма меры и параметры
 * рисунка. Параметры повторяют числа условия, но не ответ и не
 * подсветку — та лежит в закрытом разборе. У задания №5 методики нет,
 * и этих полей у его вариантов тоже нет.
 */
export interface PoolModel {
  method: Method;
  shape?: Shape;
  parametry: Parametry;
  /** Место под иллюстрацию: путь по соглашению проекта и alt. */
  illustration: { path: string; alt: string; ratio: '4:3' };
}

export interface PoolVariant {
  /** Номер варианта в прототипе, 1…10. */
  n: number;
  uslovie: string;
  /** Отпечаток верного ответа. Самого ответа здесь нет. */
  seal: string;
  /**
   * Закрытый разбор: JSON формы `Razbor` (см. razbor.ts), зашифрованный
   * отпечатком. Внутри — фраза метода, шаги с формулами, подсветка
   * рисунка и запись ответа.
   */
  steps: string;
  model?: PoolModel;
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

/**
 * Закрытый разбор в JSON. Формулы шагов набираются KaTeX здесь, на
 * сборке, и уезжают готовым HTML; рядом — те же формулы словами.
 * Без методики (задание №5) разбор — только тексты шагов, как раньше.
 */
function zakrytyRazbor(
  model: ReturnType<typeof modelVarianta> | null,
  shagiTexty: string[],
  otvet: string,
): string {
  if (model === null) {
    const razbor: Razbor = {
      metod: '',
      shagi: shagiTexty.map((text) => ({ text })),
      podsvetka: { method: 'direct-count', favorable: [] },
      otvet,
    };
    return JSON.stringify(razbor);
  }
  const razbor: Razbor = {
    metod: model.solution.method,
    shagi: model.solution.steps.map((shag) =>
      shag.formula === undefined
        ? { text: shag.text }
        : { text: shag.text, html: typeset(`$${shag.formula}$`), plain: texPlain(shag.formula) },
    ),
    podsvetka: model.solution.highlight,
    otvet: model.answer.display,
  };
  return JSON.stringify(razbor);
}

function otkrytayaModel(model: ReturnType<typeof modelVarianta>): PoolModel {
  return {
    method: model.method,
    ...(model.shape === undefined ? {} : { shape: model.shape }),
    parametry: model.parameters,
    illustration: model.illustration,
  };
}

function variantPool(prototype: Prototype, variant: Variant): PoolVariant {
  const otvet = otvetUchenika(prototype, variant.params);
  const seal = sealAnswer(otvet);
  const model = prototype.metodika === undefined ? null : modelVarianta(prototype, variant);
  const shagiTexty = prototype.shagi(variant.params).map((shag) => shag.text);
  return {
    n: variant.n,
    uslovie: prototype.uslovie(variant.params),
    seal,
    /* Разбор шифруется отпечатком ответа: в бандле он лежит набором
       символов, а раскрывается только по просьбе. */
    steps: sealText(zakrytyRazbor(model, shagiTexty, String(otvet).replace('.', ',')), seal),
    ...(model === null ? {} : { model: otkrytayaModel(model) }),
  };
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
    variants: prototype.varianty.map((variant) => variantPool(prototype, variant)),
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
  uslovie: string;
  /** Отпечаток верного ответа. Самого ответа здесь нет. */
  seal: string;
  /** Закрытый разбор: JSON формы `Razbor`, зашифрованный отпечатком. */
  steps: string;
  /** Чертёж задачи готовой разметкой SVG, если он ей нужен. */
  risunok?: string;
  model?: PoolModel;
}

export interface PrepPoolBlok {
  id: string;
  nazvanie: string;
  tip: string;
  zadachi: PrepPoolZadacha[];
}

function prepZadachaPool(zadacha: PrepZadacha): PrepPoolZadacha {
  const otvet = prepOtvet(zadacha);
  const seal = sealAnswer(otvet);
  const model = zadacha.metodika === undefined ? null : modelPrep(zadacha);
  return {
    id: zadacha.id,
    nomer: zadacha.nomer,
    uslovie: zadacha.uslovie,
    seal,
    steps: sealText(
      zakrytyRazbor(
        model,
        zadacha.shagi.map((shag) => shag.text),
        String(otvet).replace('.', ','),
      ),
      seal,
    ),
    ...(zadacha.risunok === undefined ? {} : { risunok: zadacha.risunok }),
    ...(model === null ? {} : { model: otkrytayaModel(model) }),
  };
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
    zadachi: blok.zadachi.map((zadacha) => prepZadachaPool(zadacha)),
  }));
}

export function prep4Pool(): PrepPoolBlok[] {
  return prepPool(PODGOTOVKA_4);
}

export function prep5Pool(): PrepPoolBlok[] {
  return prepPool(PODGOTOVKA_5);
}

/* ── «Узнай метод» ───────────────────────────────────────────────── */

/**
 * Задача режима «Узнай метод»: только условие. Метода в открытом
 * виде нет — лежит отпечаток, с которым сверяется выбор ученика;
 * признаки в условии закрыты этим же отпечатком и открываются после
 * ответа. Ни рисунка, ни разбора, ни числового ответа сюда не едет:
 * параметры рисунка выдали бы метод сами.
 */
export interface UznayVariant {
  n: number;
  uslovie: string;
  /** Отпечаток идентификатора метода. */
  metodSeal: string;
  /** Признаки в условии — JSON-список строк, закрытый отпечатком. */
  hints: string;
}

export interface UznayKind {
  /** Идентификатор прототипа или задачи конспекта. */
  id: string;
  /** Откуда задача: подпись в шапке карточки. */
  istochnik: 'prototip' | 'konspekt';
  variants: UznayVariant[];
}

export interface UznayPool {
  kinds: UznayKind[];
}

/** Отпечаток метода: с ним сверяется нажатая кнопка. */
export function sealMetod(metod: Method): string {
  return fingerprint(`metod:${metod}`);
}

function uznayVariant(n: number, uslovie: string, metodika: Metodika): UznayVariant {
  const metodSeal = sealMetod(metodika.metod);
  return {
    n,
    uslovie,
    metodSeal,
    hints: sealText(JSON.stringify(metodika.methodHints), metodSeal),
  };
}

/**
 * Все 39 задач задания №4: 21 прототип со всеми вариантами условий и
 * 18 задач конспекта по одной. Прототип без методики в режим не
 * попадает — узнавать в нём нечего.
 */
export function uznayMetodPool(): UznayPool {
  const prototipy = BANK_4.flatMap((prototype): UznayKind[] => {
    const metodika = prototype.metodika;
    if (metodika === undefined) {
      return [];
    }
    return [
      {
        id: prototype.id,
        istochnik: 'prototip',
        variants: prototype.varianty.map((variant) =>
          uznayVariant(variant.n, prototype.uslovie(variant.params), metodika),
        ),
      },
    ];
  });
  const konspekt = PODGOTOVKA_4.flatMap((blok) => [...blok.zadachi]).flatMap(
    (zadacha): UznayKind[] => {
      const metodika = zadacha.metodika;
      if (metodika === undefined) {
        return [];
      }
      return [
        {
          id: zadacha.id,
          istochnik: 'konspekt',
          variants: [uznayVariant(1, zadacha.uslovie, metodika)],
        },
      ];
    },
  );
  return { kinds: [...prototipy, ...konspekt] };
}
