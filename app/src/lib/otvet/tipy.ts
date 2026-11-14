/**
 * Типы ответа и проверка по типу.
 *
 * В профиле ответ один — число (lib/otvet/index.ts). В базовой
 * математике типов четыре:
 *   chislo — целое число или конечная десятичная дробь;
 *   cifry  — последовательность цифр, порядок важен (соответствие:
 *            №2, №7, №18): «4132»;
 *   nomera — номера верных утверждений, порядок не важен (№8):
 *            «14» и «41» — один и тот же ответ;
 *   lyuboe — «укажите какое-нибудь одно такое число» (№19, иногда №6
 *            и №21): верен любой ответ из списка допустимых.
 *
 * Как и у числа, неверная запись — не ошибка в решении: о ней говорится
 * подсказкой, попытка не тратится. Сравнение точное.
 *
 * Модуль без браузера и зависимостей: его берут экраны тренажёра,
 * вариант и проверки на сборке.
 */

import { formatHint, normalizeAnswer, readAnswer, type AnswerMode } from './index';

export type TipOtveta = 'chislo' | 'cifry' | 'nomera' | 'lyuboe';

/** Верный ответ задачи вместе с типом. */
export interface Klyuch {
  tip: TipOtveta;
  /**
   * Верный ответ в записи бланка: «0,25», «4132», «14». У типа lyuboe —
   * образцовый ответ (первый из допустимых) для разбора.
   */
  otvet: string;
  /** lyuboe: все допустимые ответы в записи бланка. */
  dopustimye?: readonly string[];
}

export type Proverka =
  | { kind: 'right' }
  | { kind: 'wrong' }
  /** Неверная запись: подсказка, попытка не тратится. */
  | { kind: 'format'; hint: string }
  /** Обыкновенная дробь с верным значением: нужна десятичная запись. */
  | { kind: 'fractionRight'; decimal: string };

const SPACES = /[\s    ]+/g;

/** Последовательность цифр без пробелов по краям; null — в записи не только цифры. */
function cifry(input: string): string | null {
  const s = input.replace(/^[\s ]+|[\s ]+$/g, '');
  return /^\d+$/.test(s) ? s : null;
}

function podskazkaCifr(input: string, nomera: boolean): string {
  if (input.trim() === '') return 'Впишите ответ.';
  if (/^[\d\s  ,.;]+$/.test(input)) {
    return 'Запишите цифры подряд — без пробелов, запятых и других знаков.';
  }
  return nomera
    ? 'В ответе — только номера выбранных утверждений, цифрами.'
    : 'В ответе — только цифры, по одной на каждую букву.';
}

/** Нормальная запись набора номеров: цифры по возрастанию. */
export function normalnyeNomera(value: string): string {
  return [...value].sort().join('');
}

/**
 * Проверить ответ ученика по типу. mode — как у числа: в тренажёре
 * обыкновенная дробь с верным значением даёт подсказку, в бланке
 * (вариант) любая неверная запись — подсказка о формате.
 */
export function proverit(input: string, klyuch: Klyuch, mode: AnswerMode = 'trenazher'): Proverka {
  switch (klyuch.tip) {
    case 'cifry': {
      const got = cifry(input);
      if (got === null) return { kind: 'format', hint: podskazkaCifr(input, false) };
      return { kind: got === klyuch.otvet.replace(SPACES, '') ? 'right' : 'wrong' };
    }
    case 'nomera': {
      const got = cifry(input);
      if (got === null) return { kind: 'format', hint: podskazkaCifr(input, true) };
      if (new Set(got).size !== got.length) {
        return { kind: 'format', hint: 'Каждый номер записывают один раз.' };
      }
      return {
        kind: normalnyeNomera(got) === normalnyeNomera(klyuch.otvet) ? 'right' : 'wrong',
      };
    }
    case 'chislo':
    case 'lyuboe': {
      const verny = (
        klyuch.tip === 'lyuboe' ? (klyuch.dopustimye ?? [klyuch.otvet]) : [klyuch.otvet]
      )
        .map((v) => normalizeAnswer(v))
        .flatMap((n) => (n.ok ? [n.value] : []));
      const r = readAnswer(input, mode, (value) => verny.includes(value));
      if (r.kind === 'format') return { kind: 'format', hint: formatHint(r.problem, r.meant) };
      if (r.kind === 'fractionRight') return { kind: 'fractionRight', decimal: r.decimal };
      return { kind: r.right ? 'right' : 'wrong' };
    }
  }
}

/** Клавиатура поля: у цифр и номеров — цифровая, у числа — с запятой. */
export function inputModeOf(tip: TipOtveta): 'numeric' | 'decimal' {
  return tip === 'cifry' || tip === 'nomera' ? 'numeric' : 'decimal';
}

/** Нужен ли у поля знак «минус» (сенсорная кнопка): только у чисел. */
export function sMinusom(tip: TipOtveta): boolean {
  return tip === 'chislo' || tip === 'lyuboe';
}
