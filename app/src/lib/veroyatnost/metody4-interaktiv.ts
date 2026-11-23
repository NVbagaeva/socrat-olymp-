/**
 * Счёт для интерактивов глав методов №4 (вкладка «Теория»): условия
 * таблицы костей, цепочки монет, дроби. Чистые функции — их берут и
 * компоненты, и проверка scripts/check-metody-4.mjs.
 */

/** Условие таблицы 6×6: a — очки первой кости (строка), b — второй (столбец). */
export interface UslovieKostey {
  id: string;
  nazvanie: string;
  podhodit: (a: number, b: number) => boolean;
}

export const USLOVIYA_KOSTEY: readonly UslovieKostey[] = [
  { id: 'summa-8', nazvanie: 'Сумма 8', podhodit: (a, b) => a + b === 8 },
  { id: 'shesterka', nazvanie: 'Хотя бы одна шестёрка', podhodit: (a, b) => a === 6 || b === 6 },
  { id: 'ravny', nazvanie: 'Очки равны', podhodit: (a, b) => a === b },
];

export const GRANI = [1, 2, 3, 4, 5, 6] as const;

/** Число клеток таблицы 6×6, подходящих условию. */
export function kletokKostey(u: UslovieKostey): number {
  return GRANI.reduce((s, a) => s + GRANI.filter((b) => u.podhodit(a, b)).length, 0);
}

/** Все цепочки n бросков монеты в порядке дерева: ОО, ОР, РО, РР. */
export function cepochki(n: number): string[] {
  if (n === 0) {
    return [''];
  }
  return cepochki(n - 1).flatMap((c) => [`${c}О`, `${c}Р`]);
}

export function nod(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : nod(b, a % b);
}

/**
 * Дробь m/n в TeX: «\dfrac{m}{n}=\dfrac{a}{b}=0{,}25» — с сокращением и
 * десятичной записью. Бесконечная дробь — «≈» с округлением до сотых.
 */
export function drobTex(m: number, n: number): string {
  const parts = [`\\dfrac{${m}}{${n}}`];
  const d = nod(m, n);
  if (m !== 0 && d > 1 && n / d !== 1) {
    parts.push(`\\dfrac{${m / d}}{${n / d}}`);
  }
  const dec = desyatichnaya(m, n);
  return dec.konechnaya ? `${parts.join('=')}=${dec.tex}` : `${parts.join('=')}\\approx${dec.tex}`;
}

/** Десятичная запись m/n: точная, если знаменатель из двоек и пятёрок, иначе до сотых. */
export function desyatichnaya(
  m: number,
  n: number,
): { tex: string; tekst: string; konechnaya: boolean } {
  let q = n / nod(m, n);
  while (q % 2 === 0) q /= 2;
  while (q % 5 === 0) q /= 5;
  const konechnaya = m === 0 || q === 1;
  const tekst = konechnaya ? ru(m / n) : ru(Math.round((m / n) * 100) / 100, 2);
  return { tex: tekst.replace(',', '{,}'), tekst, konechnaya };
}

/** Число по-русски: запятая, без лишних нулей (или ровно `znakov` знаков). */
export function ru(x: number, znakov?: number): string {
  const s = znakov === undefined ? String(Number(x.toFixed(6))) : x.toFixed(znakov);
  return s.replace('.', ',');
}
