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
 *  6. вариантов ровно десять и они не повторяются;
 *  7. отпечатки ответов не сталкиваются.
 */

import { otvetUchenika, prepOtvet } from './index';
import { sealAnswer } from './secret';
import { konechnaya, type PrepBlok, type Prototype, type Variant } from './types';

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
  /** Прототипы, где вариантов не десять. */
  notTen: string[];
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
  if (otvet <= 0 || otvet > 1) {
    problems.push(`вероятность вне (0; 1]: ${otvet}`);
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
  const notTen: string[] = [];
  const collisions: { a: string; b: string }[] = [];
  const seals = new Map<string, string>();

  let variants = 0;
  let mismatchPerebor = 0;
  let mismatchSteps = 0;
  let badFormat = 0;

  for (const prototype of bank) {
    if (prototype.varianty.length !== 10) {
      notTen.push(`${prototype.id}: ${prototype.varianty.length}`);
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
    notTen,
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
