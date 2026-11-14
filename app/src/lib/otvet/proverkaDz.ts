/**
 * Проверка ответа в домашнем задании — одна на сайт, базу и заглушку.
 *
 * Ответ ДЗ проверяет база (public.check_ege_answer, миграция
 * 20261113120000_dz_istochniki.sql); браузер зовёт эту функцию только
 * чтобы заранее подсказать о записи, не тратя попытку. Заглушка базы в
 * проверках сайта (scripts/lib/dz-mock.mjs) берёт её же. Все три
 * сверяются одной таблицей примеров proverkaDzCases.json: её читают
 * scripts/check-otvet.mjs (TS и заглушка) и scripts/check-soglasiya-sql.mjs
 * (база).
 *
 * Правила (docs/kabinet-dz-8.md, «Проверка ответа»):
 *   - пробелы по краям не важны, ввод длиннее 100 знаков — неверная запись;
 *   - минусы всех видов — «-», дробная черта «∕» и «÷» — «/»;
 *   - обыкновенная дробь p/q (p и q — целые или десятичные): q = 0 —
 *     неверная запись; значение равно ответу — fractionRight (попытка не
 *     тратится, нужна десятичная запись); иначе — неверный ответ;
 *   - остальное — нормальная запись ЕГЭ (normalize_ege_answer): нет её —
 *     неверная запись, есть — сравнение с ответом.
 */

export type ProverkaDz =
  | { kind: 'format' }
  | { kind: 'fractionRight'; decimal: string }
  | { kind: 'right'; norm: string }
  /** norm — нормальная запись введённого; у дроби — null. */
  | { kind: 'wrong'; norm: string | null };

const SPACE = /^[\s   ]+|[\s   ]+$/g;
const MINUS = /[−‒–—‐‑﹣－]/g;
const SLASH = /[∕÷]/g;
const S = '[\\s\\u00a0\\u2007\\u202f]*';
const NUM = '([0-9]+(?:[.,][0-9]+)?)';
const FRACTION = new RegExp(`^(-?)${S}${NUM}${S}/${S}${NUM}$`);
const EGE = /^(-?)([0-9]+)(?:[.,]([0-9]+))?$/;

/** Нормальная запись ЕГЭ: «-2.25»; не она — null (как normalize_ege_answer). */
export function normalizeEge(raw: string): string | null {
  const v = raw.replace(SPACE, '').replace(MINUS, '-');
  const m = EGE.exec(v);
  if (m === null) return null;
  const whole = (m[2] ?? '').replace(/^0+([0-9])/, '$1');
  const frac = (m[3] ?? '').replace(/0+$/, '');
  const body = frac === '' ? whole : `${whole}.${frac}`;
  return m[1] === '-' && body !== '0' ? `-${body}` : body;
}

/** Десятичная запись → [числитель, знаменатель], точно. */
function ratio(decimal: string): [bigint, bigint] {
  const neg = decimal.startsWith('-');
  const [int = '0', frac = ''] = decimal.replace('-', '').replace(',', '.').split('.');
  const num = BigInt(`${int}${frac}`) * (neg ? -1n : 1n);
  return [num, 10n ** BigInt(frac.length)];
}

/** Проверить ответ ученика: answer — верный ответ в нормальной записи. */
export function proveritOtvetDz(input: string, answer: string): ProverkaDz {
  const raw = input.replace(SPACE, '');
  if ([...raw].length > 100) return { kind: 'format' };
  const v = raw.replace(MINUS, '-').replace(SLASH, '/');
  const m = FRACTION.exec(v);
  if (m !== null) {
    const [qn, qd] = ratio(m[3] ?? '0');
    if (qn === 0n) return { kind: 'format' };
    const [pn, pd] = ratio(m[2] ?? '0');
    const [an, ad] = ratio(answer);
    /* (±p) / q = a  ⇔  ±pn·qd·ad = an·pd·qn (знаменатели положительны). */
    const sign = m[1] === '-' ? -1n : 1n;
    if (sign * pn * qd * ad === an * pd * qn) return { kind: 'fractionRight', decimal: answer };
    return { kind: 'wrong', norm: null };
  }
  const norm = normalizeEge(input);
  if (norm === null) return { kind: 'format' };
  return norm === answer ? { kind: 'right', norm } : { kind: 'wrong', norm };
}
