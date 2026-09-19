/**
 * Банки заданий №4 и №5 для тренажёра: то, что уезжает в браузер.
 *
 * Собирается на сборке. Формул ответа, ограничений и перебора здесь
 * уже нет — вниз едут только условие, отпечаток ответа и закрытый
 * разбор. Открытым текстом ответа в бандле не остаётся, и это
 * проверяется отдельным автотестом по готовой сборке.
 *
 * Условие — обычный текст: формул в условии не бывает, поэтому KaTeX
 * здесь не нужен, и в браузер он не едет. Формулы шагов набираются
 * здесь же на сборке и уезжают готовой разметкой внутри закрытого
 * разбора. Это единственное место, где разбор заданий №4 и №5
 * встречается с KaTeX: модуль импортируют страницы (они серверные),
 * а не клиентские компоненты — те получают уже набранный HTML.
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
import { putIllyustratsii, texPlain, type Method, type Parametry, type Shape } from './model';
import { modelPrep, modelVarianta } from './model-zadachi';
import type { Razbor, RazborShag } from './razbor';
import fs from 'node:fs';
import path from 'node:path';
import { kartinka5 } from './illyustratsii5';
import { sealAnswer, sealMetod, sealText } from './secret';
import {
  type Metodika,
  type PrepBlok,
  type PrepZadacha,
  type Prototype,
  type Step,
  type Variant,
} from './types';
import { typeset } from '../tex';

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
  variants: PoolVariant[];
}

export interface Pool {
  bloki: readonly Blok[];
  kinds: PoolKind[];
}

/* ── Набор разбора ───────────────────────────────────────────────── */

/**
 * Ответ в конце последней формулы — жирным: `= 0{,}25` → `= \mathbf{0{,}25}`.
 * Берётся хвост после последнего знака отношения верхнего уровня
 * (=, ≈, ≥): внутри дробей и скобок знаки не ищутся.
 */
export function vydelitOtvet(formula: string): string {
  let glubina = 0;
  let poz = -1;
  let dlina = 0;
  for (let i = 0; i < formula.length; i += 1) {
    const ch = formula[i];
    if (ch === '{' || ch === '(') {
      glubina += 1;
    } else if (ch === '}' || ch === ')') {
      glubina -= 1;
    } else if (glubina === 0) {
      if (ch === '=') {
        poz = i;
        dlina = 1;
      } else if (formula.startsWith('\\approx', i) || formula.startsWith('\\ge', i)) {
        poz = i;
        dlina = formula.startsWith('\\approx', i) ? 7 : 3;
      }
    }
  }
  if (poz < 0) {
    return formula;
  }
  const hvost = formula.slice(poz + dlina).trim();
  if (hvost === '' || hvost.includes('\\mathbf')) {
    return formula;
  }
  return `${formula.slice(0, poz + dlina)} \\mathbf{${hvost}}`;
}

/**
 * Формула кусками, по которым её можно переносить на новую строку:
 * перед каждым знаком отношения верхнего уровня и после `,\quad`.
 * KaTeX внутри одной формулы строку не переносит, а в узкой колонке
 * карточки длинная цепочка равенств не помещается — поэтому каждый
 * кусок набирается отдельно, а между ними обычный пробел.
 */
export function kuskiFormuly(formula: string): string[] {
  const kuski: string[] = [];
  let glubina = 0;
  let nachalo = 0;
  for (let i = 0; i < formula.length; i += 1) {
    const ch = formula[i];
    if (ch === '{' || ch === '(') {
      glubina += 1;
    } else if (ch === '}' || ch === ')') {
      glubina -= 1;
    } else if (glubina === 0 && i > nachalo) {
      if (ch === '=' || formula.startsWith('\\approx', i)) {
        kuski.push(formula.slice(nachalo, i).trim());
        nachalo = i;
      } else if (formula.startsWith(',\\quad', i)) {
        kuski.push(formula.slice(nachalo, i + 1).trim());
        nachalo = i + 6;
      }
    }
  }
  kuski.push(formula.slice(nachalo).trim());
  return kuski.filter((k) => k !== '');
}

/**
 * Шаг банка → шаг для показа: текст и, если есть, формула в трёх
 * видах — TeX для печатного листа, вёрстка KaTeX для карточки (тем же
 * набором, что и формулы в условиях: lib/tex.ts) и слова для alt.
 * В последней формуле разбора ответ выделяется жирным.
 *
 * Набор строгий: ошибка TeX роняет сборку, а не оставляет формулу
 * текстом. Та же проверка идёт в автотесте банка (test:veroyatnost),
 * где ошибка называется по задаче.
 */
export function shagRazbora(shag: Step, posledniy: boolean): RazborShag {
  if (shag.formula === undefined) {
    return { text: shag.text };
  }
  const tex = posledniy ? vydelitOtvet(shag.formula) : shag.formula;
  const html = kuskiFormuly(tex)
    .map((kusok) => typeset(`$${kusok}$`, true))
    .join(' ');
  return { text: shag.text, tex, html, plain: texPlain(tex) };
}

/** Шаги банка → шаги для показа; ответ — жирным в последней формуле. */
export function shagiRazbora(shagi: readonly Step[]): RazborShag[] {
  const posledniy = shagi.reduce((k, s, i) => (s.formula === undefined ? k : i), -1);
  return shagi.map((shag, i) => shagRazbora(shag, i === posledniy));
}

/**
 * Закрытый разбор в JSON: фраза метода, набранные шаги, подсветка
 * рисунка и ответ строкой. Без методики (подготовка №5) — те же шаги
 * без метода и подсветки.
 */
function zakrytyRazbor(
  model: ReturnType<typeof modelVarianta> | null,
  shagi: readonly Step[],
  otvet: string,
): Razbor {
  const nabrannye = shagiRazbora(shagi);
  return model === null
    ? {
        metod: '',
        shagi: nabrannye,
        podsvetka: { method: 'direct-count', favorable: [] },
        otvet,
      }
    : {
        metod: model.solution.method,
        shagi: nabrannye,
        podsvetka: model.solution.highlight,
        otvet: model.answer.display,
      };
}

/** Закрыть разбор отпечатком ответа: вызывается на сборке. */
function zapechatatRazbor(razbor: Razbor, seal: string): string {
  return sealText(JSON.stringify(razbor), seal);
}

/* ── Банк прототипов ─────────────────────────────────────────────── */

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
  const razbor = zakrytyRazbor(
    model,
    prototype.shagi(variant.params),
    String(otvet).replace('.', ','),
  );
  return {
    n: variant.n,
    uslovie: prototype.uslovie(variant.params),
    seal,
    /* Разбор шифруется отпечатком ответа: в бандле он лежит набором
       символов, а раскрывается только по просьбе. */
    steps: zapechatatRazbor(razbor, seal),
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
    variants: prototype.varianty.map((variant) => variantPool(prototype, variant)),
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
  /**
   * Картинка к условию у задачи без модели (подготовка №5): у задач
   * с моделью она идёт через модель. Только если файл есть.
   */
  illustration?: { path: string; alt: string };
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

/** Картинка к условию задачи без модели — по подбору, и только если файл есть. */
function kartinkaPrep(zadacha: PrepZadacha): { path: string; alt: string } | undefined {
  const kartinka = kartinka5(zadacha.id);
  return kartinka !== undefined && illyustratsiyaEst(kartinka.path) ? kartinka : undefined;
}

function prepZadachaPool(zadacha: PrepZadacha): PrepPoolZadacha {
  const otvet = prepOtvet(zadacha);
  const seal = sealAnswer(otvet);
  const model = zadacha.metodika === undefined ? null : modelPrep(zadacha);
  const razbor = zakrytyRazbor(model, zadacha.shagi, String(otvet).replace('.', ','));
  const illustration = model === null ? kartinkaPrep(zadacha) : undefined;
  return {
    id: zadacha.id,
    nomer: zadacha.nomer,
    uslovie: zadacha.uslovie,
    seal,
    steps: zapechatatRazbor(razbor, seal),
    ...(illustration === undefined ? {} : { illustration }),
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
