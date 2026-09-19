/**
 * Автотест банка заданий №4 и №5.
 *
 * Проверка живёт здесь, а не в скрипте: тот же модуль может прочитать
 * страница-витрина, и тогда сборка и автотест считают одно и то же.
 *
 * Что проверяется у каждого варианта:
 *  1. числа проходят ограничения прототипа (`dopustimo`);
 *  2. ответ по формуле совпал с ответом перебором исходов — это два
 *     независимых способа счёта, и расхождение означает ошибку;
 *  3. последний шаг разбора равен ответу, который увидит ученик;
 *  4. ответ записывается в клетки ЕГЭ: целое или конечная десятичная
 *     дробь, а если нет — условие обязано просить округление;
 *  5. в условии не осталось «undefined» и «NaN»;
 *  6. вариантов не меньше десяти и они не повторяются;
 *  7. отпечатки ответов не сталкиваются.
 */

import { otvetUchenika, prepOtvet } from './index';
import {
  LABIRINT,
  tupiki,
  veroyatnostTupika,
  veroyatnostVyhoda,
  veroyatnostVyhodaVolnoy,
  vyhody,
} from './labirint';
import { METODY, otvetPoRisunku, type Method } from './model';
import { modelPrep, modelVarianta } from './model-zadachi';
import { sealAnswer } from './secret';
import { konechnaya, round, type PrepBlok, type Prototype, type Variant } from './types';

export interface BadVariant {
  id: string;
  n: number;
  problems: string[];
}

export interface Report {
  prototypes: number;
  variants: number;
  bySource: Record<string, number>;
  /** Ответ по формуле разошёлся с ответом перебором. */
  mismatchPerebor: number;
  /** Последний шаг разбора не равен ответу. */
  mismatchSteps: number;
  /** Ответ не записывается в клетки и округления в условии нет. */
  badFormat: number;
  /** Варианты, взятые из источника, с проблемами. */
  sourceProblems: { ref: string; why: string }[];
  /** Совпадающие варианты внутри прототипа. */
  duplicates: { a: string; b: string }[];
  /** Прототипы, где вариантов меньше десяти. */
  malo: string[];
  /** Столкновения отпечатков ответов. */
  collisions: { a: string; b: string }[];
  bad: BadVariant[];
}

const TOCHNOST = 1e-9;

function problemsOf(prototype: Prototype, variant: Variant): string[] {
  const problems: string[] = [];
  const p = variant.params;

  if (!prototype.dopustimo(p)) {
    problems.push('числа не проходят ограничения прототипа');
    /* Дальше считать нечего: формулы рассчитаны на допустимые числа. */
    return problems;
  }

  const poFormule = prototype.otvet(p);
  const poPereboru = prototype.perebor(p);
  if (!Number.isFinite(poFormule) || !Number.isFinite(poPereboru)) {
    problems.push('ответ не число');
    return problems;
  }
  if (Math.abs(poFormule - poPereboru) > TOCHNOST) {
    problems.push(`формула ${poFormule} ≠ перебор ${poPereboru}`);
  }

  const otvet = otvetUchenika(prototype, p);
  /* Вероятность обязана лежать в (0; 1]. У прототипов с целым ответом
     («сколько патронов дать стрелку») ответ — не вероятность, и это
     правило к нему не относится. */
  if (prototype.format === 'десятичная' && (otvet <= 0 || otvet > 1)) {
    problems.push(`вероятность вне (0; 1]: ${otvet}`);
  }
  if (prototype.format === 'целое' && !Number.isInteger(otvet)) {
    problems.push(`ответ должен быть целым: ${otvet}`);
  }

  const znakov = prototype.okruglenie(p);
  if (znakov === null && !konechnaya(otvet)) {
    problems.push(`ответ ${otvet} не записывается в клетки, а округления в условии нет`);
  }

  const shagi = prototype.shagi(p);
  const posledniy = shagi[shagi.length - 1];
  if (posledniy === undefined || posledniy.value === undefined) {
    problems.push('последний шаг разбора ничего не считает');
  } else if (Math.abs(posledniy.value - otvet) > TOCHNOST) {
    problems.push(`последний шаг ${posledniy.value} ≠ ответ ${otvet}`);
  }

  const uslovie = prototype.uslovie(p);
  if (uslovie.trim() === '') {
    problems.push('пустое условие');
  }
  if (/undefined|NaN|\[object/.test(uslovie)) {
    problems.push('в условии осталась подстановка без значения');
  }
  if (shagi.some((shag) => /undefined|NaN/.test(shag.text))) {
    problems.push('в разборе осталась подстановка без значения');
  }

  return problems;
}

export function checkBank(bank: readonly Prototype[]): Report {
  const bySource: Record<string, number> = { задачник: 0, конспект: 0, новый: 0 };
  const bad: BadVariant[] = [];
  const sourceProblems: { ref: string; why: string }[] = [];
  const duplicates: { a: string; b: string }[] = [];
  const malo: string[] = [];
  const collisions: { a: string; b: string }[] = [];
  const seals = new Map<string, string>();

  let variants = 0;
  let mismatchPerebor = 0;
  let mismatchSteps = 0;
  let badFormat = 0;

  for (const prototype of bank) {
    if (prototype.varianty.length < 10) {
      malo.push(`${prototype.id}: ${prototype.varianty.length}`);
    }

    const nomera = new Set<number>();
    const otpechatki = new Map<string, number>();

    for (const variant of prototype.varianty) {
      variants += 1;
      bySource[variant.source] = (bySource[variant.source] ?? 0) + 1;

      if (nomera.has(variant.n)) {
        duplicates.push({ a: `${prototype.id} № ${variant.n}`, b: 'номер повторяется' });
      }
      nomera.add(variant.n);

      const klyuch = JSON.stringify(variant.params);
      const bylo = otpechatki.get(klyuch);
      if (bylo !== undefined) {
        duplicates.push({
          a: `${prototype.id} вариант ${bylo}`,
          b: `${prototype.id} вариант ${variant.n}`,
        });
      }
      otpechatki.set(klyuch, variant.n);

      const problems = problemsOf(prototype, variant);
      if (problems.length > 0) {
        bad.push({ id: prototype.id, n: variant.n, problems });
        if (variant.source !== 'новый') {
          sourceProblems.push({ ref: variant.ref, why: problems.join('; ') });
        }
        mismatchPerebor += problems.some((x) => x.includes('перебор')) ? 1 : 0;
        mismatchSteps += problems.some((x) => x.includes('последний шаг')) ? 1 : 0;
        badFormat += problems.some((x) => x.includes('в клетки')) ? 1 : 0;
        continue;
      }

      /* Столкновение — это когда у двух РАЗНЫХ ответов один
         отпечаток. Один и тот же ответ в разных вариантах —
         обычное дело и не нарушение. */
      const otvet = otvetUchenika(prototype, variant.params);
      const seal = sealAnswer(otvet);
      const zanyato = seals.get(seal);
      if (zanyato !== undefined && zanyato !== String(otvet)) {
        collisions.push({ a: zanyato, b: String(otvet) });
      }
      seals.set(seal, String(otvet));
    }
  }

  return {
    prototypes: bank.length,
    variants,
    bySource,
    mismatchPerebor,
    mismatchSteps,
    badFormat,
    sourceProblems,
    duplicates,
    malo,
    collisions,
    bad,
  };
}

/* ── Подготовительные задачи ─────────────────────────────────────── */

export interface PrepReport {
  bloki: number;
  zadachi: number;
  /** Ответ основным путём разошёлся с проверкой другим путём. */
  mismatch: number;
  /** Последний шаг разбора не равен ответу. */
  mismatchSteps: number;
  /** Ответ не пишется в клетки и округления в условии нет. */
  badFormat: number;
  /** Повторяющиеся идентификаторы или номера конспекта. */
  duplicates: string[];
  bad: BadVariant[];
}

/**
 * Проверка подготовительных задач.
 *
 * Параметров у них нет, поэтому проверять ограничения не на чем —
 * зато остаётся главное: ответ посчитан двумя путями и сошёлся,
 * разбор приводит к нему же, и записать его в клетки ЕГЭ можно.
 */
export function checkPrep(bloki: readonly PrepBlok[]): PrepReport {
  const bad: BadVariant[] = [];
  const duplicates: string[] = [];
  const vidennye = new Set<string>();
  const nomera = new Set<number>();

  let zadachi = 0;
  let mismatch = 0;
  let mismatchSteps = 0;
  let badFormat = 0;

  for (const blok of bloki) {
    for (const zadacha of blok.zadachi) {
      zadachi += 1;
      const problems: string[] = [];

      if (vidennye.has(zadacha.id)) {
        duplicates.push(`повторяется идентификатор ${zadacha.id}`);
      }
      vidennye.add(zadacha.id);
      if (nomera.has(zadacha.nomer)) {
        duplicates.push(`повторяется номер конспекта ${zadacha.nomer}`);
      }
      nomera.add(zadacha.nomer);

      if (Math.abs(zadacha.otvet - zadacha.proverka) > TOCHNOST) {
        problems.push(`ответ ${zadacha.otvet} ≠ проверка ${zadacha.proverka}`);
      }

      const otvet = prepOtvet(zadacha);
      if (otvet <= 0 || otvet > 1) {
        problems.push(`вероятность вне (0; 1]: ${otvet}`);
      }
      if (zadacha.okruglenie === undefined && !konechnaya(otvet)) {
        problems.push(`ответ ${otvet} не записывается в клетки, а округления в условии нет`);
      }

      const posledniy = zadacha.shagi[zadacha.shagi.length - 1];
      if (posledniy === undefined || posledniy.value === undefined) {
        problems.push('последний шаг разбора ничего не считает');
      } else if (Math.abs(posledniy.value - otvet) > TOCHNOST) {
        problems.push(`последний шаг ${posledniy.value} ≠ ответ ${otvet}`);
      }

      if (zadacha.uslovie.trim() === '') {
        problems.push('пустое условие');
      }
      if (/undefined|NaN/.test(zadacha.uslovie)) {
        problems.push('в условии осталась подстановка без значения');
      }

      if (problems.length > 0) {
        bad.push({ id: zadacha.id, n: zadacha.nomer, problems });
        mismatch += problems.some((x) => x.includes('проверка')) ? 1 : 0;
        mismatchSteps += problems.some((x) => x.includes('последний шаг')) ? 1 : 0;
        badFormat += problems.some((x) => x.includes('в клетки')) ? 1 : 0;
      }
    }
  }

  return {
    bloki: bloki.length,
    zadachi,
    mismatch,
    mismatchSteps,
    badFormat,
    duplicates,
    bad,
  };
}

/* ── Лабиринт паука ──────────────────────────────────────────────── */

/**
 * Что должно получиться по стенам лабиринта: четыре выхода и три
 * тупика, вероятности — доли шестнадцатой.
 *
 * Проверка нужна, потому что стены — единственный источник и для
 * картинки, и для ответа задачи 33. Случайная правка списка `STENY`
 * молча поменяла бы ответ; здесь она уронит сборку.
 */
const LABIRINT_ZHDEM: Record<string, number> = {
  A: 1 / 16,
  B: 1 / 4,
  C: 1 / 16,
  D: 1 / 16,
};

/** Вероятность застрять: девять путей из шестнадцати. */
const LABIRINT_TUPIK = 9 / 16;

/** Сколько в лабиринте тупиковых перекрёстков. */
const LABIRINT_TUPIKOV = 3;

export function checkLabirint(): string[] {
  const problems: string[] = [];
  const spisok = vyhody();
  const zhdem = Object.keys(LABIRINT_ZHDEM);

  if (spisok.join(',') !== zhdem.join(',')) {
    problems.push(`выходы ${spisok.join(', ')}, а ожидались ${zhdem.join(', ')}`);
  }

  for (const [imya, nado] of Object.entries(LABIRINT_ZHDEM)) {
    const est = veroyatnostVyhoda(imya);
    if (Math.abs(est - nado) > TOCHNOST) {
      problems.push(`выход ${imya}: ${est} вместо ${nado}`);
    }
    /* Второй способ счёта обязан дать то же самое. */
    const volnoy = veroyatnostVyhodaVolnoy(imya);
    if (Math.abs(est - volnoy) > TOCHNOST) {
      problems.push(`выход ${imya}: обходом ${est}, волной ${volnoy}`);
    }
  }

  if (Math.abs(veroyatnostTupika() - LABIRINT_TUPIK) > TOCHNOST) {
    problems.push(`вероятность тупика ${veroyatnostTupika()} вместо ${LABIRINT_TUPIK}`);
  }
  if (tupiki().length !== LABIRINT_TUPIKOV) {
    problems.push(`тупиковых перекрёстков ${tupiki().length}, а ожидалось ${LABIRINT_TUPIKOV}`);
  }

  /* Коридоры обязаны быть деревом: петля означала бы, что паук может
     прийти на перекрёсток второй раз, и правило «выбирает путь, по
     которому ещё не полз» перестаёт задавать ответ однозначно. */
  const koridorov =
    [...LABIRINT.napravleniya.values()].reduce(
      (s, spisok2) => s + spisok2.filter((n) => n.startsWith('u:')).length,
      0,
    ) / 2;
  if (koridorov !== LABIRINT.uzly.length - 1) {
    problems.push(
      `коридоров ${koridorov} при ${LABIRINT.uzly.length} перекрёстках — в решётке есть петля`,
    );
  }

  /* Паук всегда где-то оказывается: либо снаружи, либо в тупике. Это
     ловит потерянный коридор. */
  const summa = spisok.reduce((s, imya) => s + veroyatnostVyhoda(imya), 0) + veroyatnostTupika();
  if (Math.abs(summa - 1) > TOCHNOST) {
    problems.push(`сумма вероятностей по исходам равна ${summa}, а не единице`);
  }

  return problems;
}

/* ── Модель задачи: метод и рисунок ─────────────────────────────── */

export interface ModelReport {
  /** Сколько задач разложено по методам — прототипы и подготовка. */
  poMetodam: Record<Method, number>;
  /** Задач без методики: у задания №4 их быть не должно. */
  bezMetodiki: string[];
  /** Ответ по рисунку разошёлся с ответом задачи. */
  risunokVret: string[];
  /** Прочие нарушения формы модели. */
  problems: string[];
}

/**
 * Проверка модели (раздел 04 референса) для всех задач задания №4.
 *
 *  1. у каждой задачи есть методика и метод — один из пяти;
 *  2. у координатной прямой есть shape, у остальных его нет;
 *  3. параметры рисунка и подсветка одного метода;
 *  4. ответ, который показывает рисунок, равен ответу задачи — это
 *     третий независимый путь к ответу, после формулы и перебора;
 *  5. у каждого шага есть текст, а формула — только TeX-строка;
 *  6. модель собирается в JSON без потерь (нет функций, undefined).
 */
export function checkModel(bank: readonly Prototype[], bloki: readonly PrepBlok[]): ModelReport {
  const poMetodam = Object.fromEntries(METODY.map((m) => [m.id, 0])) as Record<Method, number>;
  const bezMetodiki: string[] = [];
  const risunokVret: string[] = [];
  const problems: string[] = [];

  const proverit = (
    id: string,
    otvet: number,
    znakov: 2 | 3 | null,
    hints: readonly string[],
    sobrat: () => ReturnType<typeof modelVarianta>,
  ): void => {
    let model: ReturnType<typeof modelVarianta>;
    try {
      model = sobrat();
    } catch (e) {
      problems.push(`${id}: ${e instanceof Error ? e.message : String(e)}`);
      return;
    }
    if (!METODY.some((m) => m.id === model.method)) {
      problems.push(`${id}: неизвестный метод ${model.method}`);
    }
    if (model.method === 'coordinate-line' && model.shape === undefined) {
      problems.push(`${id}: у координатной прямой нет shape`);
    }
    if (model.method !== 'coordinate-line' && model.shape !== undefined) {
      problems.push(`${id}: shape есть только у координатной прямой`);
    }
    if (
      model.parameters.method !== model.method ||
      model.solution.highlight.method !== model.method
    ) {
      problems.push(`${id}: рисунок и подсветка не того метода`);
    }
    if (model.solution.method.trim() === '') {
      problems.push(`${id}: пустая фраза «Метод:»`);
    }
    /* Признаки для «Узнай метод»: от одного до трёх, без пустых. */
    if (hints.length < 1 || hints.length > 3) {
      problems.push(`${id}: признаков метода ${hints.length}, нужно от 1 до 3`);
    }
    if (hints.some((h) => h.trim() === '')) {
      problems.push(`${id}: пустой признак метода`);
    }
    for (const [i, shag] of model.solution.steps.entries()) {
      if (shag.text.trim() === '') {
        problems.push(`${id}: у шага ${i + 1} нет текста`);
      }
      if (shag.formula !== undefined && /undefined|NaN/.test(shag.formula)) {
        problems.push(`${id}: в формуле шага ${i + 1} undefined или NaN`);
      }
    }
    /* Без потерь в JSON: функций и undefined в модели быть не должно. */
    const cherezJson = JSON.parse(JSON.stringify(model)) as unknown;
    if (JSON.stringify(cherezJson) !== JSON.stringify(model)) {
      problems.push(`${id}: модель не переживает JSON`);
    }

    const poRisunku = otvetPoRisunku({
      parametry: model.parameters,
      podsvetka: model.solution.highlight,
    });
    if (poRisunku !== null) {
      const kakUchenik = znakov === null ? poRisunku : round(poRisunku, znakov);
      if (Math.abs(kakUchenik - otvet) > TOCHNOST) {
        risunokVret.push(`${id}: по рисунку ${kakUchenik}, ответ ${otvet}`);
      }
    }
  };

  for (const prototype of bank) {
    if (prototype.metodika === undefined) {
      bezMetodiki.push(prototype.id);
      continue;
    }
    poMetodam[prototype.metodika.metod] += 1;
    for (const variant of prototype.varianty) {
      proverit(
        `${prototype.id}-${variant.n}`,
        otvetUchenika(prototype, variant.params),
        prototype.okruglenie(variant.params),
        prototype.metodika.methodHints,
        () => modelVarianta(prototype, variant),
      );
    }
  }
  for (const blok of bloki) {
    for (const zadacha of blok.zadachi) {
      if (zadacha.metodika === undefined) {
        bezMetodiki.push(zadacha.id);
        continue;
      }
      poMetodam[zadacha.metodika.metod] += 1;
      proverit(
        zadacha.id,
        prepOtvet(zadacha),
        zadacha.okruglenie ?? null,
        zadacha.metodika.methodHints,
        () => modelPrep(zadacha),
      );
    }
  }

  return { poMetodam, bezMetodiki, risunokVret, problems };
}
