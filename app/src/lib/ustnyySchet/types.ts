/**
 * Типы движка устного счёта: приём, пример, шаг разбора.
 *
 * Пример — простой JSON: его можно положить в локальную статистику
 * («Повторить ошибки») и восстановить, разбор пересчитывается по нему
 * функцией приёма.
 */

import type { Rng } from './rng';

export type Uroven = 1 | 2 | 3;
export const UROVNI: readonly Uroven[] = [1, 2, 3];

/** Действие — для миксов «по действию». */
export type Deystvie =
  'slozhenie' | 'vychitanie' | 'umnozhenie' | 'delenie' | 'kvadraty' | 'tablica' | 'doli';

export const DEYSTVIYA: readonly Deystvie[] = [
  'slozhenie',
  'vychitanie',
  'umnozhenie',
  'delenie',
  'kvadraty',
  'tablica',
  'doli',
];

export type GruppaId = 'kvadraty' | 'umnozhenie' | 'delenie' | 'slozhenie' | 'doli';

export const PRIYOM_IDS = [
  'kvadraty-11-30',
  'kvadrat-na-5',
  'kvadrat-okolo-kruglyh',
  'kvadrat-okolo-50',
  'kvadrat-cherez-raznost',
  'raznost-kvadratov',
  'desyatki-edinicy-10',
  'okolo-100',
  'na-11',
  'na-5-25-50-125',
  'okruglenie-umnozhenie',
  'razlozhenie',
  'gruppirovka-mnozhiteley',
  'desyatichnye-umnozhenie',
  'delenie-na-5',
  'delenie-na-5-25',
  'delenie-po-chastyam',
  'obratnaya-tablica',
  'okruglenie-s-popravkoy',
  'po-razryadam',
  'dopolnenie-do-kruglogo',
  'gruppirovka-slagaemyh',
  'otricatelnye',
  'doli-procenty',
  'procent-ot-chisla',
  'stepeni-kuby-korni',
  /* Таблица умножения — отдельный режим, но генератор тот же по устройству. */
  'tablica',
] as const;

export type PriyomId = (typeof PRIYOM_IDS)[number];

/** Настройки генератора. */
export interface GenOpts {
  uroven: Uroven;
  /** Можно ли примеры с десятичными дробями. */
  desyatichnye: boolean;
  /** Можно ли отрицательные числа. */
  otricatelnye: boolean;
  /** Микс по действию: генератор, умеющий оба, выбирает нужное (сложение/вычитание). */
  deystvie?: Deystvie;
  /** Таблица умножения: какие строки (2…10) и обратная форма. */
  stroki?: readonly number[];
  obratnaya?: boolean;
}

/** Звено цепочки разбора: выражение (вычисляется) и, если нужно, своя запись TeX. */
export type Zveno = string | { e: string; tex: string };

/**
 * Шаг разбора: пояснение и цепочка равных выражений. Все звенья цепочки
 * равны друг другу — проверка это пересчитывает.
 */
export interface Shag {
  /** Пояснение, формулы — в $…$. */
  tekst?: string;
  cep: readonly Zveno[];
}

export interface Primer {
  /** Ключ для «без повторов» — у перестановок множителей один ключ. */
  key: string;
  priyom: PriyomId;
  uroven: Uroven;
  deystvie: Deystvie;
  /** Данные приёма: числа нормальной записью («0.25», «-17»). */
  d: readonly string[];
  /** Вариант записи у приёма с несколькими видами (например, «:0,25»). */
  v?: string;
  /** Выражение для независимой проверки ответа. */
  expr: string;
  /** Что показать ученику (TeX, без «= ?»). */
  tex: string;
  /** То же обычным текстом (скринридер, итоги). */
  text: string;
  /** Ответ — нормальная запись lib/otvet: «-2.25», «7225». */
  otvet: string;
  /** Знак после поля ответа: «%», когда ответ — проценты. */
  ed?: '%';
}

export interface Priyom {
  id: PriyomId;
  gruppa: GruppaId | 'tablica';
  /** Действие примеров приёма; у приёмов на оба знака — основное. */
  deystvie: Deystvie;
  /** Приём умеет действия (для миксов): сложение и вычитание у «округления». */
  deystviya: readonly Deystvie[];
  /** Есть ли у уровня десятичные или отрицательные (для выключателей). */
  desyatichnye?: readonly Uroven[];
  otricatelnye?: readonly Uroven[];
  /** Случайный пример приёма или null, если по настройкам нельзя. */
  sozdat(rng: Rng, opts: GenOpts): Primer | null;
  /** Пример из готовых данных (для теории). */
  iz(d: readonly string[], uroven: Uroven, v?: string): Primer;
  /** Разбор этим приёмом. */
  razbor(p: Primer): Shag[];
}
