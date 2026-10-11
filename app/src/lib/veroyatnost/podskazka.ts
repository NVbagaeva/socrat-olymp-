/**
 * Сборка подсказок-вопросов для прототипов №4 и №5.
 *
 * Шаг подсказки — вопрос и кнопки, одна верная (types.ts, HintStep).
 * Здесь две мелочи, которые иначе повторялись бы в каждом прототипе:
 *  - верная кнопка стоит не всегда первой: её место считается из
 *    текста вопроса и ответа, так что у одного варианта оно постоянно,
 *    а у разных вариантов разное;
 *  - неверные кнопки, которые на экране совпали бы с верной или друг
 *    с другом (у иных чисел «p·q» и «1 − p» равны), отбрасываются.
 *
 * Последний шаг каждой подсказки спрашивает, как записать ответ, —
 * само число подсказка не называет. Автотест (selftest.ts,
 * problemyPodskazki) сверяет последний шаг с форматом ответа и ищет
 * число ответа во всех шагах.
 */

import {
  dec,
  type AnswerFormat,
  type HintStep,
  type Params,
  type Prototype,
  type Step,
} from './types';

/** Видимый текст кнопки: формула без разметки и пробелов. */
function vid(stroka: string): string {
  return stroka.replace(/[$\s]/g, '').replace(/\{,\}/g, ',');
}

/** Устойчивый номер места из строки: одно и то же для одного варианта. */
function mesto(klyuch: string, dlina: number): number {
  let h = 0;
  for (const ch of klyuch) {
    h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0;
  }
  return h % dlina;
}

/**
 * Шаг-вопрос: верная кнопка и до трёх неверных. Неверные, которые на
 * экране совпали бы с верной или друг с другом, отбрасываются.
 */
export function vopros(
  question: string,
  verny: string,
  nevernye: readonly string[],
  comment?: string,
): HintStep {
  const vidny = new Set([vid(verny)]);
  const drugie: string[] = [];
  for (const o of nevernye) {
    const v = vid(o);
    if (v !== '' && !vidny.has(v) && drugie.length < 3) {
      vidny.add(v);
      drugie.push(o);
    }
  }
  const correct = mesto(question + verny, drugie.length + 1);
  const options = [...drugie];
  options.splice(correct, 0, verny);
  return { question, options, correct, ...(comment === undefined ? {} : { comment }) };
}

/** Число в формуле: «$0{,}25$», целое — без запятой. */
export function chislo(value: number): string {
  return `$${dec(value).replace(',', '{,}')}$`;
}

/**
 * Как записать ответ в бланк — верная кнопка последнего шага. Отдельной
 * функцией: по ней же автотест сверяет последний шаг подсказки с
 * форматом ответа прототипа.
 */
export function zapisOtveta(format: AnswerFormat, znakov: 2 | 3 | null): string {
  if (format === 'целое') {
    return 'Целым числом — без запятой';
  }
  if (znakov === 2) {
    return 'Десятичной дробью, округлив до сотых';
  }
  if (znakov === 3) {
    return 'Десятичной дробью, округлив до тысячных';
  }
  return 'Десятичной дробью через запятую, без округления';
}

/**
 * Последний шаг: как записать ответ. Самого числа подсказка не
 * называет — его ученик считает сам; автотест проверяет, что числа
 * ответа нет ни в одном шаге.
 */
export function zapisShag(format: AnswerFormat, znakov: 2 | 3 | null): HintStep {
  const verny = zapisOtveta(format, znakov);
  const nevernye =
    format === 'целое'
      ? ['Десятичной дробью', 'Дробью: сколько патронов из ста']
      : [
          'Обыкновенной дробью',
          'В процентах',
          ...(znakov === null ? ['Десятичной дробью, округлив до сотых'] : []),
          ...(znakov !== null ? ['Десятичной дробью без округления'] : []),
        ];
  return vopros(
    'Как записать ответ в бланк?',
    verny,
    nevernye,
    'В бланке ЕГЭ — только цифры, запятая и минус.',
  );
}

/* ── Подсказка «m из n» для задания №4 ───────────────────────────── */

/**
 * Что прототип говорит о своей подсказке словами сюжета. Числа берутся
 * из шагов разбора, поэтому подсказка не может с ним разойтись.
 */
export interface MnOpisanie {
  /** Что здесь все равновозможные исходы (или вся мера) — верная кнопка. */
  vse: string;
  /** Неверные ответы на тот же вопрос. */
  vseNe: readonly string[];
  /** Какие исходы благоприятные — словами, для вопроса шага 3. */
  blago: string;
  /** Геометрическая вероятность: мера L и часть l вместо n и m. */
  geom?: boolean;
  /** Типичные ошибки в числе всех исходов (n вместо n − 1 и т. п.). */
  nOshibki?: readonly number[];
  /** Типичные ошибки в числе благоприятных. */
  mOshibki?: readonly number[];
}

/**
 * Вычисление из шага разбора — комментарий к верной кнопке. Если в
 * разборе просто «n = 50», комментарий повторил бы кнопку: его нет.
 */
function vychislenie(shag: Step | undefined): string | undefined {
  const formula = shag?.formula ?? '';
  return (formula.match(/=/g) ?? []).length > 1 ? `$${formula}$` : undefined;
}

/** Число шага разбора: у «m из n» оно есть у первых двух шагов. */
function znachenie(shag: Step | undefined, kto: string): number {
  if (shag?.value === undefined || shag.formula === undefined) {
    throw new Error(`подсказка «m из n»: у шага «${kto}» нет числа или формулы`);
  }
  return shag.value;
}

/**
 * Подсказка «m из n» по шагам разбора: что считать всеми исходами,
 * сколько их, сколько благоприятных, какое выражение даёт ответ, как
 * его записать. Неверные числа — ошибки сюжета и соседние числа. На
 * кнопках только числа: вычисление из разбора («76 − 1 = 75») стоит в
 * комментарии, иначе верная кнопка выдавала бы себя видом.
 */
export function mnPodskazka(
  shagi: readonly Step[],
  opisanie: MnOpisanie,
  format: AnswerFormat,
  znakov: 2 | 3 | null,
): HintStep[] {
  const n = znachenie(shagi[0], 'все исходы');
  const m = znachenie(shagi[1], 'благоприятные');
  const [N, M] = opisanie.geom === true ? ['L', 'l'] : ['n', 'm'];
  const bukva = (b: string, x: number): string => `$${b} = ${x}$`;
  const nNe = [...(opisanie.nOshibki ?? []), n - 1, n + 1].filter((x) => x > 0 && x !== n);
  const mNe = [...(opisanie.mOshibki ?? []), n - m, m + 1, m - 1].filter((x) => x > 0 && x !== m);
  return [
    vopros(
      opisanie.geom === true
        ? 'С чем сравниваем — что здесь вся мера?'
        : 'Что здесь все равновозможные исходы?',
      opisanie.vse,
      opisanie.vseNe,
    ),
    vopros(
      opisanie.geom === true ? `Чему равна вся мера $${N}$?` : `Сколько всего исходов $${N}$?`,
      bukva(N, n),
      nNe.map((x) => bukva(N, x)),
      vychislenie(shagi[0]),
    ),
    vopros(
      opisanie.geom === true
        ? `Чему равна благоприятная часть $${M}$ — ${opisanie.blago}?`
        : `Сколько благоприятных исходов $${M}$ — ${opisanie.blago}?`,
      bukva(M, m),
      mNe.map((x) => bukva(M, x)),
      vychislenie(shagi[1]),
    ),
    vopros(
      'Какое выражение даёт ответ?',
      `$\\dfrac{${m}}{${n}}$`,
      /* Дробь, равная единице (при m = n − m), — не ошибка, а опечатка:
         такую кнопку не показываем. */
      [
        ...(n - m !== m ? [`$\\dfrac{${n - m}}{${n}}$`, `$\\dfrac{${m}}{${n - m}}$`] : []),
        `$\\dfrac{${n}}{${m}}$`,
      ],
      `Вероятность — доля благоприятных: $P = \\dfrac{${M}}{${N}}$.`,
    ),
    zapisShag(format, znakov),
  ];
}

/** Прототип №4 с подсказкой «m из n»: числа — из его же шагов разбора. */
export function sPodskazkoy(prototype: Prototype, opisanie: (p: Params) => MnOpisanie): Prototype {
  return {
    ...prototype,
    podskazka: (p) =>
      mnPodskazka(prototype.shagi(p), opisanie(p), prototype.format, prototype.okruglenie(p)),
  };
}
