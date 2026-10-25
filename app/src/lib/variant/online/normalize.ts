/**
 * Ответ в формате ЕГЭ: целое число или конечная десятичная дробь.
 *
 * Модуль без браузера и без зависимостей: на этапе 2 та же таблица
 * случаев проверяет нормализацию на сервере (функция базы), чтобы
 * сайт и сервер понимали ответ одинаково.
 *
 * Правила:
 *   - пробелы по краям не считаются;
 *   - минус любым знаком: «-», «−» (U+2212), «–», «—», «‒»;
 *   - запятая и точка равнозначны;
 *   - лишние нули отбрасываются: «007» = «7», «1,50» = «1,5», «2,0» = «2»;
 *   - «−0» и «−0,00» — это «0».
 *
 * Всё остальное — не ошибка в решении, а неверная запись: дробь «1/2»,
 * буквы, пробел внутри («1 000»), «,5», «5,», «+5», «1e3». Ученику
 * показывается подсказка о формате, ответ не засчитывается и не
 * проверяется.
 */

/** Нормальная запись ответа: «-2.25», «0», «1000». */
export type NormalAnswer = string;

export type FormatProblem =
  /** Пустое поле. */
  | 'empty'
  /** Обыкновенная дробь «1/2». */
  | 'fraction'
  /** Пробел внутри числа «1 000». */
  | 'space'
  /** Буквы, единицы измерения, «e». */
  | 'letters'
  /** Остальное: «,5», «5,», «+5», «1,2,3», «--3». */
  | 'other';

export type Normalized = { ok: true; value: NormalAnswer } | { ok: false; problem: FormatProblem };

const MINUS = /[−‒–—‐‑﹣－]/g;
const EGE = /^(-?)(\d+)(?:[.,](\d+))?$/;

/** Разобрать ответ ученика. Неверная запись — причина, а не исключение. */
export function normalizeAnswer(input: string): Normalized {
  const text = input.replace(/^[\s   ]+|[\s   ]+$/g, '').replace(MINUS, '-');
  if (text === '') return { ok: false, problem: 'empty' };
  const m = EGE.exec(text);
  if (m === null) return { ok: false, problem: problemOf(text) };
  const [, sign = '', whole = '', frac = ''] = m;
  const int = whole.replace(/^0+(?=\d)/, '');
  const fraction = frac.replace(/0+$/, '');
  const body = fraction === '' ? int : `${int}.${fraction}`;
  return { ok: true, value: sign === '-' && body !== '0' ? `-${body}` : body };
}

function problemOf(text: string): FormatProblem {
  if (/\d\s*\/\s*\d/.test(text)) return 'fraction';
  if (/[A-Za-zА-Яа-яЁё]/.test(text)) return 'letters';
  if (/\d[\s   ]+\d/.test(text)) return 'space';
  return 'other';
}

/** Нормальная запись → как пишут в бланке: «-2.25» → «−2,25». */
export function displayAnswer(value: NormalAnswer): string {
  const s = value.replace('.', ',');
  return s.startsWith('-') ? `−${s.slice(1)}` : s;
}

/** Совпадает ли ответ ученика с верным (верный — в записи бланка). */
export function sameAnswer(input: string, correct: string): boolean {
  const a = normalizeAnswer(input);
  const b = normalizeAnswer(correct);
  return a.ok && b.ok && a.value === b.value;
}
