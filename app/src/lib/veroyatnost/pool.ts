/**
 * Банки заданий №4 и №5 для тренажёра: то, что уезжает в браузер.
 *
 * Собирается на сборке. Формул ответа, ограничений и перебора здесь
 * уже нет — вниз едут только условие, отпечаток ответа и закрытый
 * разбор. Открытым текстом ответа в бандле не остаётся, и это
 * проверяется отдельным автотестом по готовой сборке.
 *
 * Условие — обычный текст: формул в условии не бывает, поэтому KaTeX
 * здесь не нужен, и в браузер он не едет. Формулы шагов набираются на
 * сборке (nabor.ts) и уезжают готовой разметкой внутри закрытого
 * разбора.
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
import { putIllyustratsii, type Method, type Parametry, type Shape } from './model';
import { modelPrep, modelVarianta } from './model-zadachi';
import { naborRazbora, zapechatatRazbor } from './nabor';
import type { Razbor } from './razbor';
import fs from 'node:fs';
import path from 'node:path';
import { illyustratsiya5, kartinka5 } from './illyustratsii5';
import { sealAnswer, sealMetod, sealText } from './secret';
import {
  type Illyustratsiya,
  type Metodika,
  type PrepBlok,
  type PrepZadacha,
  type Prototype,
  type Step,
  type Variant,
} from './types';

/**
 * Открытая часть модели задачи: метод, форма меры и параметры
 * рисунка. Параметры повторяют числа условия, но не ответ и не
 * подсветку — та лежит в закрытом разборе. У метода «Формула»
 * параметров нет — только имя метода.
 */
export interface PoolModel {
  method: Method;
  shape?: Shape;
  parametry: Parametry;
  /**
   * Место под иллюстрацию: путь по соглашению проекта и alt. `exists`
   * считается на сборке: лежит ли файл в app/public по этому пути.
   * Есть файл — карточка показывает картинку, нет — место под неё.
   */
  illustration: { path: string; alt: string; ratio: '4:3'; exists: boolean };
}

/**
 * Лежит ли файл иллюстрации в app/public. Считается на сборке, в
 * Node: путь модели — от корня сайта, файлы — в папке public.
 */
export function illyustratsiyaEst(put: string): boolean {
  try {
    return fs.existsSync(path.join(process.cwd(), 'public', put));
  } catch {
    return false;
  }
}

/**
 * Знак на плашке типа задачи у карточки по макету: у задач с
 * координатной прямой — ось с засечками, у остальных — общий знак.
 */
export type Znak = 'pryamaya' | 'zadacha';

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
  /** Строка об источнике в шапке карточки. */
  istochnik: string;
  /** Надпись на плашке типа у карточки по макету. */
  plashka: string;
  znak: Znak;
  illyustratsiya?: Illyustratsiya;
  variants: PoolVariant[];
  /**
   * Иллюстрация к прототипу готовой разметкой, как у лабиринта в
   * подготовке, — только у прототипов без методики. У прототипов с
   * моделью картинка идёт через модель задачи.
   */
  risunok?: string;
}

export interface Pool {
  bloki: readonly Blok[];
  kinds: PoolKind[];
}

/**
 * Закрытый разбор в JSON. Шаги набирает nabor.ts: формулы в TeX, в
 * вёрстке KaTeX и словами, ответ в последней формуле — жирным. Без
 * методики (подготовка №5) — те же шаги без подсветки.
 */
function zakrytyRazbor(
  model: ReturnType<typeof modelVarianta> | null,
  shagi: readonly Step[],
  otvet: string,
): string {
  const nabor = naborRazbora(shagi);
  const razbor: Razbor =
    model === null
      ? { ...nabor, otvet }
      : {
          ...nabor,
          metod: model.solution.method,
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
    illustration: { ...model.illustration, exists: illyustratsiyaEst(model.illustration.path) },
  };
}

function variantPool(prototype: Prototype, variant: Variant): PoolVariant {
  const otvet = otvetUchenika(prototype, variant.params);
  const seal = sealAnswer(otvet);
  const model = prototype.metodika === undefined ? null : modelVarianta(prototype, variant);
  return {
    n: variant.n,
    uslovie: prototype.uslovie(variant.params),
    seal,
    /* Разбор шифруется отпечатком ответа: в бандле он лежит набором
       символов, а раскрывается только по просьбе. */
    steps: sealText(
      zakrytyRazbor(model, prototype.shagi(variant.params), String(otvet).replace('.', ',')),
      seal,
    ),
    ...(model === null ? {} : { model: otkrytayaModel(model) }),
  };
}

function kindOf(prototype: Prototype, zadanie: string): PoolKind {
  const blok = blokById(prototype.blok);
  if (blok === undefined) {
    throw new Error(`У прототипа ${prototype.id} неизвестный блок ${prototype.blok}`);
  }
  /* Нулевой диапазон — прототип составлен не по задачнику. */
  const izZadachnika = prototype.zadachnik[0] > 0;
  return {
    id: prototype.id,
    title: prototype.nazvanie,
    tip: prototype.tip,
    blok: blok.id,
    blokTitle: blok.nazvanie,
    zadachnik: prototype.zadachnik,
    istochnik: izZadachnika
      ? `Прототип задания ${zadanie} · задачи ${prototype.zadachnik[0]}–${prototype.zadachnik[1]}`
      : `Прототип задания ${zadanie} · составлено по схеме автора`,
    plashka: prototype.pryamaya === undefined ? prototype.nazvanie : blok.nazvanie,
    znak: prototype.pryamaya === undefined ? 'zadacha' : 'pryamaya',
    ...(prototype.illyustratsiya === undefined ? {} : { illyustratsiya: prototype.illyustratsiya }),
    variants: prototype.varianty.map((variant) => variantPool(prototype, variant)),
    ...(prototype.metodika === undefined && illyustratsiya5(prototype.id) !== undefined
      ? { risunok: illyustratsiya5(prototype.id) }
      : {}),
  };
}

export function bank4Pool(): Pool {
  return { bloki: BLOKI_4, kinds: BANK_4.map((p) => kindOf(p, '4')) };
}

export function bank5Pool(): Pool {
  return { bloki: BLOKI_5, kinds: BANK_5.map((p) => kindOf(p, '5')) };
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
  znak: Znak;
  illyustratsiya?: Illyustratsiya;
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
  /* Чертёж из данных (лабиринт) идёт разметкой; подобранная картинка
     у задач без модели встаёт справа от условия, как у карточки по
     макету; у задач с моделью (№4) картинка идёт через модель. */
  const risunok = zadacha.risunok;
  const illyustratsiya =
    zadacha.illyustratsiya ?? (model === null ? kartinka5(zadacha.id) : undefined);
  const otvetStrokoy = String(otvet).replace('.', ',');
  const razbor: Razbor =
    model === null
      ? { ...naborRazbora(zadacha.shagi, zadacha.pryamaya), otvet: otvetStrokoy }
      : JSON.parse(zakrytyRazbor(model, zadacha.shagi, otvetStrokoy));
  return {
    id: zadacha.id,
    nomer: zadacha.nomer,
    uslovie: zadacha.uslovie,
    seal,
    steps: zapechatatRazbor(razbor, seal),
    znak: zadacha.pryamaya === undefined ? 'zadacha' : 'pryamaya',
    ...(illyustratsiya === undefined ? {} : { illyustratsiya }),
    ...(risunok === undefined ? {} : { risunok }),
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
  /**
   * Иллюстрация — только если файл есть: путь по модели метод не
   * выдаёт, но в карточке без картинки и рамки под неё быть не должно.
   */
  illustration?: { path: string; alt: string };
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

function uznayVariant(
  n: number,
  uslovie: string,
  metodika: Metodika,
  illustration: { path: string; alt: string },
): UznayVariant {
  const metodSeal = sealMetod(metodika.metod);
  return {
    n,
    uslovie,
    metodSeal,
    hints: sealText(JSON.stringify(metodika.methodHints), metodSeal),
    ...(illyustratsiyaEst(illustration.path) ? { illustration } : {}),
  };
}

/**
 * Задание №4: прототипы со всеми вариантами условий и задачи
 * конспекта по одной. Задание №5: 12 прототипов со всеми вариантами;
 * его подготовительные задачи методики не имеют и в режим не
 * попадают — узнавать в них пока нечего.
 */
export function uznayMetodPool(zadanie: 4 | 5 = 4): UznayPool {
  const bank = zadanie === 4 ? BANK_4 : BANK_5;
  const podgotovka = zadanie === 4 ? PODGOTOVKA_4 : PODGOTOVKA_5;
  const prototipy = bank.flatMap((prototype): UznayKind[] => {
    const metodika = prototype.metodika;
    if (metodika === undefined) {
      return [];
    }
    return [
      {
        id: prototype.id,
        istochnik: 'prototip',
        variants: prototype.varianty.map((variant) =>
          uznayVariant(variant.n, prototype.uslovie(variant.params), metodika, {
            path: putIllyustratsii(prototype.id),
            alt: prototype.nazvanie,
          }),
        ),
      },
    ];
  });
  const konspekt = podgotovka
    .flatMap((blok) => [...blok.zadachi])
    .flatMap((zadacha): UznayKind[] => {
      const metodika = zadacha.metodika;
      if (metodika === undefined) {
        return [];
      }
      return [
        {
          id: zadacha.id,
          istochnik: 'konspekt',
          variants: [
            uznayVariant(1, zadacha.uslovie, metodika, {
              path: putIllyustratsii(zadacha.id),
              alt: `Задача ${zadacha.nomer} конспекта`,
            }),
          ],
        },
      ];
    });
  return { kinds: [...prototipy, ...konspekt] };
}
