/**
 * Расчёты интерактивов глав ключевых методов задания №5.
 *
 * Чистые функции без React: их зовут и интерактивы
 * (components/tasks/veroyatnost/teoriya/metody/Interaktivy5.tsx), и
 * проверка scripts/check-metody-5.mjs. Вероятности считаются в целых
 * долях, чтобы на экран не попадали хвосты вроде 0,30000000000000004.
 */

export const GRANI_5 = [1, 2, 3, 4, 5, 6] as const;

/** Что не выпало ни разу: 0 — условия нет. */
export const ZAPRETY_5 = [0, 1, 6] as const;
export type Zapret5 = (typeof ZAPRETY_5)[number];

/** Суммы двух костей. */
export const SUMMY_5 = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

/** Пара остаётся в пространстве исходов: запрещённое число не выпало. */
export function paraOstalas(zapret: Zapret5, a: number, b: number): boolean {
  return zapret === 0 || (a !== zapret && b !== zapret);
}

/** Таблица двух костей при условии: [m, n]. */
export function kostiPriUslovii(zapret: Zapret5, summa: number): [number, number] {
  let m = 0;
  let n = 0;
  for (const a of GRANI_5) {
    for (const b of GRANI_5) {
      if (!paraOstalas(zapret, a, b)) continue;
      n += 1;
      if (a + b === summa) m += 1;
    }
  }
  return [m, n];
}

/**
 * Числовая прямая главы 3: P(X > k) в сотых для k = 0…10 (X — число
 * решённых задач из десяти). Убывает: каждый луч лежит внутри предыдущего.
 */
export const BOLSHE_K_5: readonly number[] = [100, 98, 95, 89, 80, 67, 52, 36, 21, 9, 0];

/** НОД для сокращения дробей. */
export function nod(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : nod(b, a % b);
}

/**
 * Десятичная запись по-русски: 0,0729. Число задано как доля целых:
 * chislitel / 10^razryadov — так запись точная.
 */
export function ruDrob(chislitel: number, razryadov: number): string {
  const znak = chislitel < 0 ? '−' : '';
  const s = String(Math.abs(chislitel)).padStart(razryadov + 1, '0');
  const cel = s.slice(0, s.length - razryadov);
  const dr = s.slice(s.length - razryadov).replace(/0+$/, '');
  return `${znak}${cel}${dr === '' ? '' : `,${dr}`}`;
}

/** Наименьшее n, при котором 1 − qⁿ ≥ порог (q и порог — в сотых). */
export function popytokDoUspeha(qSotyh: number, porogSotyh: number): number {
  /* Сравнение в целых: qⁿ / 100ⁿ ≤ (100 − порог) / 100, то есть
     qⁿ · 100 ≤ (100 − порог) · 100ⁿ. BigInt — степени быстро растут. */
  const q = BigInt(qSotyh);
  const ostatok = BigInt(100 - porogSotyh);
  let n = 1;
  let qn = q;
  let sto = 100n;
  while (qn * 100n > ostatok * sto) {
    n += 1;
    qn *= q;
    sto *= 100n;
  }
  return n;
}
