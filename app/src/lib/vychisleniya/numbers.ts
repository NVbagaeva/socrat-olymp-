/**
 * Числа задания №8: «хорошие» ответы, корни, десятичная запись.
 *
 * Ответ бланка ЕГЭ — целое число или конечная десятичная дробь.
 * Генераторы подбирают параметры так, чтобы ответ был таким по
 * построению; функции ниже это проверяют и записывают числа так,
 * как они стоят в условии: с запятой.
 */

/** Наибольший общий делитель. */
export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    [x, y] = [y, x % y];
  }
  return x;
}

/** Округление до девяти знаков: столько же у отпечатка ответа. */
export function round9(x: number): number {
  return Math.round(x * 1e9) / 1e9;
}

/** Целое или конечная десятичная дробь не длиннее `places` знаков. */
export function nice(x: number, places = 2): boolean {
  if (!Number.isFinite(x)) {
    return false;
  }
  const scaled = x * 10 ** places;
  return Math.abs(scaled - Math.round(scaled)) < 1e-9;
}

export function isSquare(n: number): boolean {
  if (n < 0 || !Number.isInteger(n)) {
    return false;
  }
  const r = Math.round(Math.sqrt(n));
  return r * r === n;
}

/** √n = k·√m, m без квадратных множителей. */
export function simpRoot(n: number): { k: number; m: number } {
  let k = 1;
  let m = n;
  for (let p = 2; p * p <= m; p += 1) {
    while (m % (p * p) === 0) {
      m /= p * p;
      k *= p;
    }
  }
  return { k, m };
}

/**
 * Число как строка с запятой: 1,5; −3; 0,04. Знак минус — обычный
 * дефис: так его вводит ученик и так его понимает parseAnswer.
 */
export function ru(x: number): string {
  const v = round9(x);
  if (Object.is(v, -0)) {
    return '0';
  }
  let s = String(v);
  if (s.includes('e')) {
    s = v.toFixed(9).replace(/0+$/, '').replace(/\.$/, '');
  }
  return s.replace('.', ',');
}
