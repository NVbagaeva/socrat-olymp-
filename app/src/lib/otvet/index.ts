/**
 * Ответ ученика: разбор, нормальная запись и подсказка о формате.
 *
 * Один модуль на весь сайт. Без браузера и без зависимостей: его берут
 * экраны тренажёров, онлайн-вариант и проверки на сборке, а таблица
 * случаев (normalizeCases.json онлайн-варианта) сверяет его с функцией
 * базы public.normalize_ege_answer.
 *
 * Ответ ЕГЭ — целое число или конечная десятичная дробь. Правила записи:
 *   - пробелы по краям не считаются;
 *   - минус любым знаком: «-», «−» (U+2212), «‐» (U+2010), «‑» (U+2011),
 *     «‒», «–», «—», «﹣», «－»;
 *   - запятая и точка равнозначны;
 *   - лишние нули отбрасываются: «007» = «7», «1,50» = «1,5», «2,0» = «2»;
 *   - «−0» и «−0,00» — это «0».
 *
 * Всё остальное — не ошибка в решении, а неверная запись, и о ней
 * говорится подсказкой: обыкновенная дробь «1/4» (и с дробной чертой
 * «1∕4»), смешанное число «3 1/2», проценты «50%», единицы «5 см»,
 * запись калькулятора «1e3», буквы «0x10», «+5», «,5», «5,», пробел
 * внутри числа, «/2» и прочее.
 *
 * Два режима — как ответ сверяется:
 *   - 'trenazher' — тренажёры и домашние задания. Обыкновенная дробь
 *     сверяется по значению: верное значение — подсказка «запишите
 *     десятичной дробью», попытка не тратится и ошибкой это не считается;
 *     неверное значение — обычный неверный ответ. Остальная неверная
 *     запись — подсказка о формате, попытка не тратится.
 *   - 'blank' — бланк ЕГЭ (онлайн-вариант): любая неверная запись,
 *     дробь тоже, — подсказка о формате, значение не раскрывается.
 *
 * Сравнение точное: по нормальной записи, без допуска. «0,3333333333»
 * не равно 1/3, «1,0000000001» не равно 1.
 */

/** Нормальная запись ответа: «-2.25», «0», «1000». */
export type NormalAnswer = string;

/** Почему запись не годится для бланка. */
export type FormatProblem =
  /** Пустое поле. */
  | 'empty'
  /** Обыкновенная дробь «1/2», «1∕2». */
  | 'fraction'
  /** Смешанное число «3 1/2». */
  | 'mixed'
  /** Проценты «50%». */
  | 'percent'
  /** Единицы измерения «5 см», «30°». */
  | 'units'
  /** Запись калькулятора «1e3». */
  | 'exponent'
  /** Буквы, шестнадцатеричная запись «0x10», «х=5». */
  | 'letters'
  /** Знак «+» перед числом. */
  | 'plus'
  /** Запятая без цифры с одной стороны: «,5», «5,». */
  | 'dot'
  /** Пробел внутри числа «1 000» или после минуса «- 3». */
  | 'space'
  /** Остальное: «/2», «1,2,3», «--3», «-». */
  | 'other';

export type Normalized =
  | { ok: true; value: NormalAnswer }
  | {
      ok: false;
      problem: FormatProblem;
      /**
       * Число, которое ученик имел в виду, в нормальной записи — если
       * его можно назвать однозначно и оно записывается конечной
       * десятичной дробью: «1/4» → «0.25», «3 1/2» → «3.5», «1e3» →
       * «1000», «+5» → «5», «,5» → «0.5». Иначе null.
       */
      meant: NormalAnswer | null;
    };

/** Все минусы и тире, которые попадают в поле с клавиатуры и из вставки. */
const MINUS = /[−‐‑‒–—﹣－]/g;
/** Пробелы по краям: обычный, неразрывный, узкие. */
const EDGE_SPACE = /^[\s    ]+|[\s    ]+$/g;
const INNER_SPACE = /[\s    ]+/g;
/** Черта дроби: косая, дробная черта U+2215, знак деления. */
const SLASH = /[∕÷]/g;

const EGE = /^(-?)(\d+)(?:[.,](\d+))?$/;

/** Подготовка строки: края, минусы, черта дроби. */
function prepare(input: string): string {
  return input.replace(EDGE_SPACE, '').replace(MINUS, '-').replace(SLASH, '/');
}

/** Нормальная запись из знака, целой и дробной частей. */
function normal(sign: string, whole: string, frac: string): NormalAnswer {
  const int = whole.replace(/^0+(?=\d)/, '');
  const fraction = frac.replace(/0+$/, '');
  const body = fraction === '' ? int : `${int}.${fraction}`;
  return sign === '-' && body !== '0' ? `-${body}` : body;
}

/* ── Точная арифметика для «того, что имели в виду» ───────────────
   Дробь a/b переводится в десятичную без плавающей точки: конечна ли
   она, решает знаменатель (после сокращения в нём только 2 и 5). */

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    [x, y] = [y, x % y];
  }
  return x;
}

/** Десятичная запись числа num/den (den > 0). null — бесконечная дробь. */
function decimalOf(num: bigint, den: bigint): NormalAnswer | null {
  if (den <= 0n) return null;
  const g = gcd(num, den);
  let n = num / g;
  let d = den / g;
  let twos = 0;
  let fives = 0;
  while (d % 2n === 0n) {
    d /= 2n;
    twos += 1;
  }
  while (d % 5n === 0n) {
    d /= 5n;
    fives += 1;
  }
  if (d !== 1n) return null;
  /* Довести знаменатель до 10^k: домножить на недостающие 2 или 5. */
  const k = Math.max(twos, fives);
  n *= 2n ** BigInt(k - twos) * 5n ** BigInt(k - fives);
  const negative = n < 0n;
  const digits = (negative ? -n : n).toString().padStart(k + 1, '0');
  const whole = digits.slice(0, digits.length - k);
  const frac = k === 0 ? '' : digits.slice(digits.length - k);
  return normal(negative ? '-' : '', whole, frac);
}

/** Десятичная «a,b» как дробь: «2,25» → 225/100. */
function asRatio(text: string): [bigint, bigint] | null {
  const m = EGE.exec(text);
  if (m === null) return null;
  const [, sign = '', whole = '', frac = ''] = m;
  const num = BigInt(`${whole}${frac}`) * (sign === '-' ? -1n : 1n);
  return [num, 10n ** BigInt(frac.length)];
}

const FRACTION = /^(-?)\s*(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)$/;
const MIXED = /^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/;
const PERCENT = /^(-?\d+(?:[.,]\d+)?)\s*%$/;
const EXPONENT = /^(-?)(\d+)(?:[.,](\d+))?[eE]([+-]?\d{1,3})$/;
const UNITS = /^(-?\d+(?:[.,]\d+)?)\s*(?:[A-Za-zА-Яа-яЁё°²³]+\.?\s*)+$/;
const LETTERS = /[A-Za-zА-Яа-яЁё]/;

/** Значение обыкновенной дроби «a/b» (a и b — целые или десятичные). */
function fractionValue(sign: string, top: string, bottom: string): NormalAnswer | null {
  const a = asRatio(top.replace(',', '.'));
  const b = asRatio(bottom.replace(',', '.'));
  if (a === null || b === null || b[0] === 0n) return null;
  const num = a[0] * b[1] * (sign === '-' ? -1n : 1n);
  const den = a[1] * b[0];
  return decimalOf(num, den);
}

/** Разобрать ответ по правилам бланка. Неверная запись — причина, а не исключение. */
export function normalizeAnswer(input: string): Normalized {
  const text = prepare(input);
  if (text === '') return { ok: false, problem: 'empty', meant: null };
  const m = EGE.exec(text);
  if (m !== null) {
    const [, sign = '', whole = '', frac = ''] = m;
    return { ok: true, value: normal(sign, whole, frac) };
  }
  return { ok: false, ...classify(text) };
}

function classify(text: string): { problem: FormatProblem; meant: NormalAnswer | null } {
  let m = MIXED.exec(text);
  if (m !== null) {
    const [, sign = '', whole = '', top = '', bottom = ''] = m;
    const w = BigInt(whole);
    const t = BigInt(top);
    const b = BigInt(bottom);
    const meant = b === 0n ? null : decimalOf((w * b + t) * (sign === '-' ? -1n : 1n), b);
    return { problem: 'mixed', meant };
  }
  m = FRACTION.exec(text);
  if (m !== null) {
    const [, sign = '', top = '', bottom = ''] = m;
    return { problem: 'fraction', meant: fractionValue(sign, top, bottom) };
  }
  m = PERCENT.exec(text);
  if (m !== null) {
    const plain = normalizeAnswer(m[1] ?? '');
    return { problem: 'percent', meant: plain.ok ? plain.value : null };
  }
  m = EXPONENT.exec(text);
  if (m !== null) {
    const [, sign = '', whole = '', frac = '', power = '0'] = m;
    const p = Number(power);
    const num = BigInt(`${whole}${frac}`) * (sign === '-' ? -1n : 1n);
    const shift = p - frac.length;
    const meant =
      Math.abs(p) > 30
        ? null
        : shift >= 0
          ? decimalOf(num * 10n ** BigInt(shift), 1n)
          : decimalOf(num, 10n ** BigInt(-shift));
    return { problem: 'exponent', meant };
  }
  m = UNITS.exec(text);
  if (m !== null) {
    const plain = normalizeAnswer(m[1] ?? '');
    return { problem: 'units', meant: plain.ok ? plain.value : null };
  }
  if (LETTERS.test(text)) return { problem: 'letters', meant: null };
  if (/^\+\s*\d+(?:[.,]\d+)?$/.test(text)) {
    const plain = normalizeAnswer(text.replace(/^\+\s*/, ''));
    return { problem: 'plus', meant: plain.ok ? plain.value : null };
  }
  m = /^(-?)[.,](\d+)$/.exec(text);
  if (m !== null) return { problem: 'dot', meant: normal(m[1] ?? '', '0', m[2] ?? '') };
  m = /^(-?)(\d+)[.,]$/.exec(text);
  if (m !== null) return { problem: 'dot', meant: normal(m[1] ?? '', m[2] ?? '', '') };
  if (/\d[\s    ]+\d/.test(text) || /^-[\s    ]+\d/.test(text)) {
    const plain = normalizeAnswer(text.replace(INNER_SPACE, ''));
    return { problem: 'space', meant: plain.ok ? plain.value : null };
  }
  return { problem: 'other', meant: null };
}

/** Нормальная запись → как пишут в бланке и на экране: «-2.25» → «−2,25». */
export function displayAnswer(value: NormalAnswer): string {
  const s = value.replace('.', ',');
  return s.startsWith('-') ? `−${s.slice(1)}` : s;
}

/** Совпадает ли ответ ученика с верным (верный — в записи бланка). Точно, без допуска. */
export function sameAnswer(input: string, correct: string): boolean {
  const a = normalizeAnswer(input);
  const b = normalizeAnswer(correct);
  return a.ok && b.ok && a.value === b.value;
}

/* ── Чтение ответа с проверкой ────────────────────────────────── */

export type AnswerMode = 'trenazher' | 'blank';

export type Reading =
  /** Число в записи бланка: сверить и засчитать как обычно. */
  | { kind: 'answer'; value: NormalAnswer; right: boolean; viaFraction: boolean }
  /**
   * Тренажёр: обыкновенная дробь с верным значением. Не засчитывается
   * и ошибкой не считается — попытка не тратится, нужен ответ в
   * десятичной записи.
   */
  | { kind: 'fractionRight'; decimal: NormalAnswer }
  /** Неверная запись: подсказка о формате, попытка не тратится. */
  | { kind: 'format'; problem: FormatProblem; meant: NormalAnswer | null };

/**
 * Прочитать ответ и сверить его. isRight получает нормальную запись
 * («-2.25») и говорит, верна ли она: так сверяются и открытый ответ, и
 * отпечаток.
 *
 * Тренажёр: неверная обыкновенная дробь — обычный неверный ответ
 * (viaFraction: true): её значение однозначно, а иначе дробью можно было
 * бы бесплатно проверять догадки там, где попыток мало.
 */
export function readAnswer(
  input: string,
  mode: AnswerMode,
  isRight: (value: NormalAnswer) => boolean,
): Reading {
  const n = normalizeAnswer(input);
  if (n.ok) return { kind: 'answer', value: n.value, right: isRight(n.value), viaFraction: false };
  if (mode === 'trenazher' && n.problem === 'fraction') {
    if (n.meant !== null && isRight(n.meant)) return { kind: 'fractionRight', decimal: n.meant };
    return { kind: 'answer', value: n.meant ?? prepare(input), right: false, viaFraction: true };
  }
  return { kind: 'format', problem: n.problem, meant: n.meant };
}

/* ── Подсказки ────────────────────────────────────────────────── */

/** Подсказка о формате — простыми словами, с тем числом, что имел в виду ученик. */
export function formatHint(problem: FormatProblem, meant: NormalAnswer | null): string {
  const as = meant === null ? null : displayAnswer(meant);
  switch (problem) {
    case 'empty':
      return 'Впишите ответ.';
    case 'fraction':
      return as === null
        ? 'В бланк ЕГЭ записывают целое число или десятичную дробь. Эта дробь в конечную десятичную не переводится — проверьте решение.'
        : `В бланк ЕГЭ записывают десятичную дробь, а не обыкновенную: ${as}.`;
    case 'mixed':
      return as === null
        ? 'Смешанное число в бланк не записывают: нужна десятичная дробь.'
        : `Смешанное число в бланк не записывают. Запишите десятичной дробью: ${as}.`;
    case 'percent':
      return 'В бланк ЕГЭ записывают только число, без знака %.';
    case 'units':
      return 'В бланк ЕГЭ записывают только число, без единиц измерения.';
    case 'exponent':
      return as === null
        ? 'Это запись калькулятора, в бланк её не пишут. Запишите число полностью.'
        : `Это запись калькулятора, в бланк её не пишут. Запишите число полностью: ${as}.`;
    case 'letters':
      return 'В ответе — только число: цифры, запятая и минус.';
    case 'plus':
      return `Знак «+» в бланк не пишут${as === null ? '' : `: просто ${as}`}.`;
    case 'dot':
      return as === null
        ? 'С обеих сторон от запятой нужны цифры.'
        : `С обеих сторон от запятой нужны цифры: ${as}.`;
    case 'space':
      return as === null ? 'Без пробелов внутри числа.' : `Без пробелов внутри числа: ${as}.`;
    case 'other':
      return 'Так число не записывают. Нужно целое число или десятичная дробь, например −2,25.';
  }
}

/** Подсказка тренажёра, когда дробью записано верное значение. */
export function fractionRightHint(decimal: NormalAnswer): string {
  /* Дробь «3/1» — это целое число: так и говорим. */
  const what = decimal.includes('.') ? 'десятичную дробь' : 'целое число';
  return `Значение верное, но в бланк ЕГЭ записывают ${what}: ${displayAnswer(decimal)}. Введите ответ так.`;
}

/* ── Число из записи — для разделов с допуском ────────────────────
   Разделы, где ответ может быть и обыкновенной дробью (№12, №3, №4,
   №5 и другие), сверяют число с допуском (lib/answer.ts). Им нужен
   разбор «как число»: запись бланка или простая дробь «a/b». */

/** Строка ответа как число. Запись бланка или дробь «a/b»; остальное — null. */
export function parseNumber(input: string): number | null {
  const n = normalizeAnswer(input);
  if (n.ok) return Number(n.value);
  if (n.problem === 'fraction') {
    const m = FRACTION.exec(prepare(input));
    if (m === null) return null;
    const [, sign = '', top = '', bottom = ''] = m;
    const value = Number(top.replace(',', '.')) / Number(bottom.replace(',', '.'));
    if (!Number.isFinite(value)) return null;
    return sign === '-' ? -value : value;
  }
  return null;
}
