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

import { dec, type AnswerFormat, type HintStep } from './types';

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
