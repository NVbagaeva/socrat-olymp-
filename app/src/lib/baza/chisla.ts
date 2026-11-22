/**
 * Числа базы: точные дроби и запись ответа.
 *
 * Ответ ЕГЭ — конечная десятичная дробь, а считать её через плавающую
 * точку нельзя: 0,1 + 0,2 ≠ 0,3. Вероятности и доли здесь — пары целых
 * (числитель и знаменатель), запись ответа получается делением в столбик.
 */

export function nod(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) [x, y] = [y, x % y];
  return x;
}

/** Конечна ли десятичная запись m/n: в знаменателе после сокращения только 2 и 5. */
export function konechna(m: number, n: number): boolean {
  let d = n / nod(m, n);
  for (const p of [2, 5]) while (d % p === 0) d /= p;
  return d === 1;
}

/**
 * m/n в записи бланка: «0,25», «3», «−1,5». Бросает, если дробь
 * бесконечная: такая задача в банк попасть не должна.
 */
export function zapis(m: number, n: number): string {
  if (!Number.isInteger(m) || !Number.isInteger(n) || n === 0) {
    throw new Error(`не дробь: ${m}/${n}`);
  }
  if (!konechna(m, n)) throw new Error(`бесконечная дробь ${m}/${n}`);
  const minus = m < 0 !== n < 0 && m !== 0;
  let ch = Math.abs(m);
  const zn = Math.abs(n);
  const tseloe = Math.floor(ch / zn);
  ch %= zn;
  let drob = '';
  while (ch !== 0) {
    ch *= 10;
    drob += String(Math.floor(ch / zn));
    ch %= zn;
  }
  return `${minus ? '−' : ''}${tseloe}${drob === '' ? '' : `,${drob}`}`;
}

/** Запись бланка → TeX: «0,25» → «0{,}25». */
export function tex(zapisBlanka: string): string {
  return zapisBlanka.replace(',', '{,}').replace('−', '-');
}

/** m/n сразу в TeX. */
export function texDrob(m: number, n: number): string {
  return tex(zapis(m, n));
}

/** Сотые → запись бланка: 35 → «0,35», 100 → «1». */
export function sotye(n: number): string {
  return zapis(n, 100);
}

/** «1 сумка», «2 сумки», «5 сумок». */
export function slovo(n: number, formy: readonly [string, string, string]): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return formy[2];
  if (b === 1) return formy[0];
  if (b >= 2 && b <= 4) return formy[1];
  return formy[2];
}
