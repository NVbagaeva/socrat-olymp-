/**
 * Запись чисел и выражений задания «Наибольшее и наименьшее значение
 * функции» в TeX: десятичная запятая, многочлены без «1x» и «+ -».
 */

/** Число без хвоста двоичной арифметики: 2.5000000001 → 2.5. */
export function okrugl(n: number): number {
  const r = Math.round(n * 1e9) / 1e9;
  return Object.is(r, -0) ? 0 : r;
}

/** Число в TeX: «-5», «2{,}5». */
export function num(n: number): string {
  return String(okrugl(n)).replace('.', '{,}');
}

/** Число для ответа и вариантов подсказки: «-5», «2,5». */
export function chislo(n: number): string {
  return String(okrugl(n)).replace('.', ',');
}

/**
 * Сумма слагаемых в TeX: [[1, 'x^3'], [-75, 'x'], [19, '']] →
 * «x^3-75x+19». Нулевые пропускаются, у единицы перед буквой
 * коэффициента нет.
 */
export function summa(terms: readonly (readonly [number, string])[]): string {
  let out = '';
  for (const [c, body] of terms) {
    if (okrugl(c) === 0) continue;
    const abs = Math.abs(c);
    const koef = abs === 1 && body !== '' ? '' : num(abs);
    const znak = c < 0 ? '-' : out === '' ? '' : '+';
    out += `${znak}${koef}${body}`;
  }
  return out === '' ? '0' : out;
}

/** «x-5», «x+5», «x»: x минус h. */
export function xMinus(h: number): string {
  return summa([
    [1, 'x'],
    [-h, ''],
  ]);
}

/** Квадратный трёхчлен (x − h)² + d в раскрытом виде: x^2 - 2hx + h^2 + d. */
export function trehchlen(h: number, d: number, a = 1): string {
  return summa([
    [a, 'x^2'],
    [-2 * a * h, 'x'],
    [a * h * h + d, ''],
  ]);
}

/** Промежуток знакопостоянства: «(-\infty;\,-5)». */
export function interval(a: number | null, b: number | null): string {
  const l = a === null ? '-\\infty' : num(a);
  const r = b === null ? '+\\infty' : num(b);
  return `(${l};\\,${r})`;
}

/**
 * Строка о знаках производной: точки по возрастанию и знаки на
 * интервалах между ними (знаков на один больше, чем точек).
 */
export function znaki(tochki: readonly number[], z: readonly ('+' | '-')[]): string {
  const granicy: (number | null)[] = [null, ...tochki, null];
  return z
    .map(
      (s, i) =>
        `на $${interval(granicy[i] ?? null, granicy[i + 1] ?? null)}$ $y'${s === '+' ? '>' : '<'}0$`,
    )
    .join(', ');
}

/** Отрезок в TeX: «[-3;\,3]». */
export function otrezokTex(a: string, b: string): string {
  return `[${a};\\,${b}]`;
}
