/**
 * Шаг перевода единиц в решениях №10 и №11 — по методу общей теории
 * (content/teoriya-edinicy.ts): опорный факт, направление, действие.
 *
 *   «$1\text{ ч}=60\text{ мин}$; часы → минуты: большая → меньшая,
 *    умножаем: $1{,}5\cdot60=90\text{ мин}$.»
 *
 * Скорости — через дробь: числитель и знаменатель переводим отдельно.
 * Готовых множителей «·3,6» в решениях нет.
 *
 * Строки — с $…$ (KaTeX), единицы — внутри формулы (\text{ мин}), чтобы
 * на телефоне «км/ч» не рвалось. Числа сверяет pnpm test:edinicy.
 */

import { d, fq, nice, q, val } from '../zadanie11/num';

/** vniz — из большей в меньшую (умножаем), vverh — из меньшей в большую (делим). */
export type Napravlenie = 'vniz' | 'vverh';

export const DEYSTVIE: Record<Napravlenie, string> = {
  vniz: 'большая → меньшая, умножаем',
  vverh: 'меньшая → большая, делим',
};

/** Опорные факты (TeX без $). */
export const FAKT = {
  chMin: '1\\text{ ч}=60\\text{ мин}',
  minS: '1\\text{ мин}=60\\text{ с}',
  chS: '1\\text{ ч}=3600\\text{ с}',
  kmM: '1\\text{ км}=1000\\text{ м}',
  mSm: '1\\text{ м}=100\\text{ см}',
  kgG: '1\\text{ кг}=1000\\text{ г}',
  tKg: '1\\text{ т}=1000\\text{ кг}',
} as const;

/** «часы → минуты: большая → меньшая, умножаем» */
export function pravilo(otkuda: string, kuda: string, n: Napravlenie): string {
  return `${otkuda} → ${kuda}: ${DEYSTVIE[n]}`;
}

/**
 * Полная строка перевода: факт; направление; выкладка.
 * vykladka — TeX без $, с единицами: «1{,}5\cdot60=90\text{ мин}».
 */
export function perevod(
  fakt: string,
  otkuda: string,
  kuda: string,
  n: Napravlenie,
  vykladka: string,
): string {
  return `$${fakt}$; ${pravilo(otkuda, kuda, n)}: $${vykladka}$.`;
}

/** Скорость дробью: числитель и знаменатель м/с → км/ч. */
export const MS_V_KMCH_POYASNENIE =
  'Скорость — дробь, переводим числитель и знаменатель отдельно: $1\\text{ м}=\\dfrac{1}{1000}\\text{ км}$ (метры → километры: меньшая → большая, делим), $1\\text{ с}=\\dfrac{1}{3600}\\text{ ч}$ (секунды → часы: меньшая → большая, делим).';

/** Скорость дробью: числитель и знаменатель км/ч → м/с. */
export const KMCH_V_MS_POYASNENIE =
  'Скорость — дробь, переводим числитель и знаменатель отдельно: $1\\text{ км}=1000\\text{ м}$ (километры → метры: большая → меньшая, умножаем), $1\\text{ ч}=3600\\text{ с}$ (часы → секунды: большая → меньшая, умножаем).';

/**
 * м/с → км/ч: $v\text{ м/с}=\dfrac{v\text{ м}}{1\text{ с}}=\dfrac{v\cdot\frac{1}{1000}\text{ км}}{\frac{1}{3600}\text{ ч}}=\dfrac{v\cdot3600}{1000}\text{ км/ч}=r\text{ км/ч}$.
 * v, r — TeX чисел.
 */
export function msVKmch(v: string, r: string): string {
  return `$${v}\\text{ м/с}=\\dfrac{${v}\\cdot\\frac{1}{1000}\\text{ км}}{\\frac{1}{3600}\\text{ ч}}=${v}\\cdot\\dfrac{3600}{1000}\\text{ км/ч}=${r}\\text{ км/ч}$.`;
}

/** км/ч → м/с: $v\text{ км/ч}=\dfrac{v\cdot1000\text{ м}}{3600\text{ с}}=r\text{ м/с}$. */
export function kmchVMs(v: string, r: string): string {
  return `$${v}\\text{ км/ч}=\\dfrac{${v}\\cdot1000\\text{ м}}{3600\\text{ с}}=${r}\\text{ м/с}$.`;
}

/** Минуты в часы: «$20:60=\dfrac{1}{3}\text{ ч}$» или «$30:60=0{,}5\text{ ч}$» (TeX без $). */
export function minutyVChasyTex(m: number, drob = false): string {
  const r = q(m, 60);
  const desyat = r.m === 1 || (!drob && nice(val(r), 4));
  return desyat ? `${d(m)}:60=${fq(r, true)}\\text{ ч}` : `\\dfrac{${d(m)}}{60}=${fq(r)}\\text{ ч}`;
}

/**
 * Минуты (или «ч мин») в часы по методу:
 * «$1\text{ ч}=60\text{ мин}$; минуты → часы: меньшая → большая, делим:
 *  $20:60=\dfrac13\text{ ч}$, всего $1+\dfrac13=\dfrac43\text{ ч}$.»
 * minuty — всё время в минутах; drob — ответ дробью ($\dfrac12$, а не
 * $0{,}5$), когда дальше в уравнении стоит дробь.
 */
export function minutyVChasy(minuty: number, drob = false): string {
  const h = Math.floor(minuty / 60);
  const m = minuty - h * 60;
  if (m === 0) {
    return perevod(FAKT.chMin, 'минуты', 'часы', 'vverh', minutyVChasyTex(minuty, drob));
  }
  const chast = minutyVChasyTex(m, drob);
  if (h === 0) {
    return perevod(FAKT.chMin, 'минуты', 'часы', 'vverh', chast);
  }
  const vsego = q(minuty, 60);
  const chastQ = q(m, 60);
  const desyat = !drob && nice(val(chastQ), 4);
  return `${perevod(FAKT.chMin, 'минуты', 'часы', 'vverh', chast).slice(0, -1)}, всего $${d(h)}+${fq(chastQ, desyat)}=${fq(vsego, desyat)}\\text{ ч}$.`;
}

/** Несколько промежутков в минутах — в часы одной строкой (дробями). */
export function minutyVChasyVse(minuty: readonly number[], drob = true): string {
  return perevod(
    FAKT.chMin,
    'минуты',
    'часы',
    'vverh',
    minuty.map((m) => minutyVChasyTex(m, drob)).join(',\\quad '),
  );
}

/** «ч мин» в минуты: «$1\text{ ч}=60\text{ мин}$; часы → минуты: …: $1\cdot60+20=80\text{ мин}$.» */
export function chasyVMinuty(minuty: number): string {
  const h = Math.floor(minuty / 60);
  const m = minuty - h * 60;
  const vykladka = `${d(h)}\\cdot60${m > 0 ? `+${d(m)}` : ''}=${d(minuty)}\\text{ мин}`;
  return perevod(FAKT.chMin, 'часы', 'минуты', 'vniz', vykladka);
}
