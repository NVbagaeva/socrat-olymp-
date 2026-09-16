/**
 * Проверка числового ответа.
 *
 * Модуль отдельный и намеренно пустой на зависимости: его берёт
 * клиентский экран задачи, а lib/prep.ts тянет за собой движок
 * и KaTeX, которым в браузере делать нечего.
 */

/* ── Проверка ответа ─────────────────────────────────────────────
   Сравниваются числа, а не строки: «1,5», «1.5», «3/2», «1,50»,
   « 1,5 » и «−1,5» с типографским минусом — одна и та же запись. */

/** Строка ответа как число. Нечисловая запись даёт null. */
export function parseAnswer(value: string): number | null {
  const clean = value
    .replace(/[\s\u00a0\u2009]/g, '')
    /* Минус, короткое и среднее тире с клавиатуры и из движка. */
    .replace(/[\u2212\u2012\u2013\u2014]/g, '-')
    .replace(/,/g, '.');
  if (clean === '') {
    return null;
  }

  const parts = clean.split('/');
  if (parts.length === 2) {
    const top = Number(parts[0]);
    const bottom = Number(parts[1]);
    if (!Number.isFinite(top) || !Number.isFinite(bottom) || bottom === 0) {
      return null;
    }
    return top / bottom;
  }

  const single = Number(clean);
  return Number.isFinite(single) ? single : null;
}

/** Одно ли это число. Допуск нужен дробям вроде 1/3. */
export function sameNumber(input: string, answer: string): boolean {
  const left = parseAnswer(input);
  const right = parseAnswer(answer);
  return left !== null && right !== null && Math.abs(left - right) < 1e-9;
}
