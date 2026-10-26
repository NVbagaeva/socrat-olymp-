/**
 * Автотест банка задания №3.
 *
 * Прогоняет все варианты всех прототипов и отвечает на семь вопросов:
 * сколько прототипов и вариантов, откуда они взяты, где ответ по
 * формуле разошёлся с ответом по модели, где последний шаг разбора
 * не равен ответу, где ответ не целый и не конечная десятичная дробь,
 * какие варианты из источников не прошли проверку и есть ли
 * повторы.
 *
 * Заодно каждый чертёж варианта проходит чек-лист из двенадцати
 * пунктов — тот же, что у банка чертежей.
 */

import { type CheckRow, checkDrawing } from '../solid/checklist';
import { fitsFormat, ru, round } from './format';
import { bezRazmetki } from './podskazka';
import { type HintStep, type Prototype } from './types';

export interface VariantReport {
  id: string;
  n: number;
  source: string;
  ref: string;
  uslovie: string;
  otvet: number;
  poModeli: number;
  shag: number | null;
  drawing: CheckRow;
  problems: string[];
}

export interface BankReport {
  prototypes: number;
  variants: number;
  bySource: { задачник: number; домашка: number; новый: number; фипи: number };
  mismatchModel: number;
  mismatchSteps: number;
  badFormat: number;
  sourceProblems: { ref: string; why: string }[];
  duplicates: { a: string; b: string }[];
  notTen: string[];
  drawingViolations: { id: string; points: string }[];
  /** Прототипы без подсказки-вопросов. */
  bezPodskazki: string[];
  rows: VariantReport[];
}

/** Насколько два ответа считаются одним и тем же числом. */
const TOL = 1e-6;

/**
 * Число в тексте с длинным дробным хвостом: «99,99999999999997».
 * Так выглядит невычищенная погрешность double. Ученик такого
 * видеть не должен ни в условии, ни в разборе: в задании №3 все
 * числа — целые или короткие десятичные дроби.
 */
const LONG_TAIL = /\d+[,.]\d{4,}/;

/** Числа с длинным хвостом в тексте, если они там есть. */
function longTails(text: string): string[] {
  return (text.match(/\d+[,.]\d+/g) ?? []).filter((piece) => LONG_TAIL.test(piece));
}

/** Числа, которые видит ученик: «2,5», «36» — без разметки формул. */
function chislaVTekste(stroka: string): string[] {
  return bezRazmetki(stroka).match(/\d+(?:,\d+)?/g) ?? [];
}

/** Числа, которые стоят результатом: сразу после «=». */
function rezultaty(stroka: string): string[] {
  return [...bezRazmetki(stroka).matchAll(/=(\d+(?:,\d+)?)(?![\d,])/g)].map((m) => m[1] ?? '');
}

/**
 * Что не так с подсказкой варианта: 2–5 шагов, у каждого вопрос и 2–4
 * разные кнопки, верная в списке, формулы парные. Главное — число
 * ответа не стоит ни в одном шаге, если его нет в самом условии: иначе
 * подсказка решает задачу за ученика.
 */
export function problemyPodskazki(
  shagi: readonly HintStep[],
  otvet: number,
  uslovie: string,
): string[] {
  const problems: string[] = [];
  if (shagi.length < 2 || shagi.length > 5) {
    problems.push(`в подсказке ${shagi.length} шагов, нужно от 2 до 5`);
  }
  const vBlank = ru(round(otvet));
  const vUslovii = chislaVTekste(uslovie).includes(vBlank);
  shagi.forEach((shag, i) => {
    const gde = `подсказка, шаг ${i + 1}`;
    if (shag.question.trim() === '') {
      problems.push(`${gde}: пустой вопрос`);
    }
    if (shag.options.length < 2 || shag.options.length > 4) {
      problems.push(`${gde}: кнопок ${shag.options.length}, нужно 2–4`);
    }
    if (!Number.isInteger(shag.correct) || shag.correct < 0 || shag.correct >= shag.options.length) {
      problems.push(`${gde}: верная кнопка ${shag.correct} вне списка`);
    }
    const vidno = shag.options.map(bezRazmetki);
    if (new Set(vidno).size !== vidno.length) {
      problems.push(`${gde}: кнопки повторяются (${vidno.join(' | ')})`);
    }
    if (vidno.some((o) => o === '')) {
      problems.push(`${gde}: пустая кнопка`);
    }
    /* Ответ выдан, если он целиком стоит на кнопке или результатом
       вычисления («… = 8») в вопросе, на кнопке или в комментарии.
       Служебные числа формул («a/2», «1 : 8») ответом не считаются. */
    if (!vUslovii && vidno.includes(vBlank)) {
      problems.push(`${gde}: кнопка называет ответ ${vBlank}`);
    }
    for (const stroka of [shag.question, ...shag.options, shag.comment ?? '']) {
      if (!vUslovii && rezultaty(stroka).includes(vBlank)) {
        problems.push(`${gde}: подсказка называет ответ ${vBlank} в «${stroka}»`);
      }
      if ((stroka.match(/\$/g) ?? []).length % 2 !== 0) {
        problems.push(`${gde}: непарный знак $ в «${stroka}»`);
      }
      if (/undefined|NaN|\[object/.test(stroka)) {
        problems.push(`${gde}: подстановка без значения в «${stroka}»`);
      }
    }
  });
  return problems;
}

export function checkBank(bank: readonly Prototype[]): BankReport {
  const rows: VariantReport[] = [];
  const bySource = { задачник: 0, домашка: 0, новый: 0, фипи: 0 };
  const sourceProblems: { ref: string; why: string }[] = [];
  const duplicates: { a: string; b: string }[] = [];
  const notTen: string[] = [];
  const drawingViolations: { id: string; points: string }[] = [];
  const bezPodskazki: string[] = [];
  const seen = new Map<string, string>();
  let mismatchModel = 0;
  let mismatchSteps = 0;
  let badFormat = 0;

  bank.forEach((prototype) => {
    if (prototype.varianty.length !== 10) {
      notTen.push(`${prototype.id}: ${prototype.varianty.length}`);
    }
    if (prototype.podskazka === undefined) {
      bezPodskazki.push(prototype.id);
    }

    prototype.varianty.forEach((variant) => {
      const problems: string[] = [];
      const where = `${prototype.id} вариант ${variant.n}`;
      bySource[variant.source] += 1;

      if (!prototype.dopustimo(variant.params)) {
        problems.push('числа варианта не проходят ограничения прототипа');
      }

      const uslovie = prototype.uslovie(variant.params);
      const uslovieTails = longTails(uslovie);
      if (uslovieTails.length > 0) {
        problems.push(`в условии нечищеное число: ${uslovieTails.join(', ')}`);
      }

      const otvet = round(prototype.otvet(variant.params));
      const poModeli = round(prototype.poModeli(variant.params));

      if (Math.abs(otvet - poModeli) > TOL) {
        mismatchModel += 1;
        problems.push(`формула даёт ${otvet}, модель ${poModeli}`);
      }

      const steps = prototype.shagi(variant.params);
      steps.forEach((step, i) => {
        const tails = longTails(step.text);
        if (tails.length > 0) {
          problems.push(`в шаге ${i + 1} нечищеное число: ${tails.join(', ')}`);
        }
      });
      const last = steps[steps.length - 1];
      const shag = last?.value === undefined ? null : round(last.value);
      if (shag === null || Math.abs(shag - otvet) > TOL) {
        mismatchSteps += 1;
        problems.push(`последний шаг разбора даёт ${shag ?? 'ничего'}, а ответ ${otvet}`);
      }

      if (prototype.podskazka !== undefined) {
        problems.push(...problemyPodskazki(prototype.podskazka(variant.params), otvet, uslovie));
      }

      if (!fitsFormat(otvet, prototype.format)) {
        badFormat += 1;
        problems.push(`ответ ${otvet} не подходит под формат «${prototype.format}»`);
      }

      if (variant.sourceAnswer !== undefined && Math.abs(variant.sourceAnswer - otvet) > TOL) {
        problems.push(`в источнике ответ ${variant.sourceAnswer}, а получается ${otvet}`);
      }

      const model = prototype.chertezh(variant.params);
      /* Повтор — это когда ученик видит то же условие и тот же
         чертёж. У ступенчатых тел текст один и тот же у всех
         вариантов, а числа стоят на чертеже, поэтому в ключ
         входит и он. */
      const key = [
        uslovie,
        JSON.stringify((model.measures ?? []).map((m) => m.text)),
        JSON.stringify((model.lines ?? []).map((l) => [l.a, l.b])),
        JSON.stringify((model.sections ?? []).map((sec) => sec.points)),
      ].join(' | ');
      const twin = seen.get(key);
      if (twin === undefined) {
        seen.set(key, where);
      } else {
        duplicates.push({ a: twin, b: where });
        problems.push(`повторяет ${twin}`);
      }

      const drawing = checkDrawing(prototype.id, model, uslovie);
      const failed = drawing.points
        .map((okPoint, i) => (okPoint ? null : String(i + 1)))
        .filter((x): x is string => x !== null);
      if (failed.length > 0) {
        drawingViolations.push({ id: where, points: failed.join(', ') });
        problems.push(`чертёж не прошёл пункты ${failed.join(', ')}: ${drawing.notes.join('; ')}`);
      }

      if (problems.length > 0 && variant.source !== 'новый') {
        sourceProblems.push({ ref: `${where} (${variant.ref})`, why: problems.join('; ') });
      }

      rows.push({
        id: prototype.id,
        n: variant.n,
        source: variant.source,
        ref: variant.ref,
        uslovie,
        otvet,
        poModeli,
        shag,
        drawing,
        problems,
      });
    });
  });

  return {
    prototypes: bank.length,
    variants: rows.length,
    bySource,
    mismatchModel,
    mismatchSteps,
    badFormat,
    sourceProblems,
    duplicates,
    notTen,
    drawingViolations,
    bezPodskazki,
    rows,
  };
}

/** Сколько вариантов с хотя бы одной проблемой. */
export function badVariants(report: BankReport): VariantReport[] {
  return report.rows.filter((row) => row.problems.length > 0);
}

/**
 * Упасть, если банк не в порядке. Вызывается на сборке: страница
 * с банком не соберётся, пока хоть один вариант не сходится.
 */
export function assertBankOk(report: BankReport): void {
  const bad = badVariants(report);
  if (bad.length === 0 && report.notTen.length === 0) {
    return;
  }
  const lines = bad
    .slice(0, 20)
    .map((row) => `${row.id} вариант ${row.n}: ${row.problems.join('; ')}`);
  if (report.notTen.length > 0) {
    lines.unshift(`не по десять вариантов: ${report.notTen.join(', ')}`);
  }
  throw new Error(`Банк задания №3 не сходится (${bad.length} вариантов):\n${lines.join('\n')}`);
}
