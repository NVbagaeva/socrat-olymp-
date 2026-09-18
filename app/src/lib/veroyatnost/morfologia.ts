/**
 * Согласование числительных в условии задачи.
 *
 * Условие прототипа — формулировка задачника, в которую подставлены
 * числа варианта. Если числа менять, а слова оставлять, получится
 * «перевозя по 5 человека за рейс» — ошибка, которой в источнике
 * нет и в банке быть не должно. Поэтому формы слов считаются, а не
 * пишутся в шаблоне.
 *
 * Таблицы короткие намеренно: они покрывают ровно те числа, которые
 * встречаются в задачах на вероятность (порядковые до пятидесяти,
 * собирательные до десяти). Число вне таблицы роняет сборку, а не
 * молча подставляет неверную форму.
 */

/**
 * Форма существительного при числительном: «1 человек», «4 человека»,
 * «15 человек».
 */
export function skl(n: number, one: string, few: string, many: string): string {
  const tens = Math.abs(n) % 100;
  const ones = Math.abs(n) % 10;
  if (tens >= 11 && tens <= 14) {
    return many;
  }
  if (ones === 1) {
    return one;
  }
  return ones >= 2 && ones <= 4 ? few : many;
}

/** «20 человек», «4 человека». */
export function chelovek(n: number): string {
  return `${n} ${skl(n, 'человек', 'человека', 'человек')}`;
}

/** Порядковое числительное в творительном падеже: «двенадцатым». */
const ORD_EDINICY = [
  '',
  'первым',
  'вторым',
  'третьим',
  'четвёртым',
  'пятым',
  'шестым',
  'седьмым',
  'восьмым',
  'девятым',
  'десятым',
  'одиннадцатым',
  'двенадцатым',
  'тринадцатым',
  'четырнадцатым',
  'пятнадцатым',
  'шестнадцатым',
  'семнадцатым',
  'восемнадцатым',
  'девятнадцатым',
];

const ORD_DESYATKI: Record<number, string> = {
  20: 'двадцатым',
  30: 'тридцатым',
  40: 'сороковым',
  50: 'пятидесятым',
  60: 'шестидесятым',
  70: 'семидесятым',
};

const KOL_DESYATKI: Record<number, string> = {
  20: 'двадцать',
  30: 'тридцать',
  40: 'сорок',
  50: 'пятьдесят',
  60: 'шестьдесят',
  70: 'семьдесят',
};

/** «первым», «двенадцатым», «двадцать четвёртым». */
export function poryadkovoe(n: number): string {
  if (n >= 1 && n < 20) {
    return ORD_EDINICY[n] as string;
  }
  const tens = Math.floor(n / 10) * 10;
  const ones = n % 10;
  const desyatki = ones === 0 ? ORD_DESYATKI[tens] : KOL_DESYATKI[tens];
  if (desyatki === undefined) {
    throw new Error(`Нет порядкового числительного для ${n}`);
  }
  return ones === 0 ? desyatki : `${desyatki} ${ORD_EDINICY[ones] as string}`;
}

/** Собирательное числительное: «трёх человек», «шестерых человек». */
const SOBIRATELNOE: Record<number, string> = {
  2: 'двух',
  3: 'трёх',
  4: 'четырёх',
  5: 'пятерых',
  6: 'шестерых',
  7: 'семерых',
  8: 'восьмерых',
  9: 'девятерых',
  10: 'десятерых',
};

export function sobiratelnoe(n: number): string {
  const word = SOBIRATELNOE[n];
  if (word === undefined) {
    throw new Error(`Нет собирательного числительного для ${n}`);
  }
  return word;
}

/** Числительное в предложном падеже: «в трёх аудиториях». */
const PREDLOZHNOE: Record<number, string> = {
  2: 'двух',
  3: 'трёх',
  4: 'четырёх',
  5: 'пяти',
  6: 'шести',
  7: 'семи',
};

export function predlozhnoe(n: number): string {
  const word = PREDLOZHNOE[n];
  if (word === undefined) {
    throw new Error(`Нет предложной формы числительного для ${n}`);
  }
  return word;
}

/** Порядковое в именительном мужского рода: «в третий день». */
const ORD_MUZH: Record<number, string> = {
  2: 'второй',
  3: 'третий',
  4: 'четвёртый',
  5: 'пятый',
  6: 'шестой',
};

/** «во второй день», «в третий день» — вместе с предлогом. */
export function vDen(n: number): string {
  const word = ORD_MUZH[n];
  if (word === undefined) {
    throw new Error(`Нет порядкового числительного дня для ${n}`);
  }
  /* Перед «второй» стоит «во»: «в второй» не говорят. */
  return `${n === 2 ? 'во' : 'в'} ${word}`;
}

/** Количественное числительное словом: «первые два дня». */
const KOLICHESTVENNOE: Record<number, string> = {
  2: 'два',
  3: 'три',
  4: 'четыре',
  5: 'пять',
};

export function kolichestvennoe(n: number): string {
  const word = KOLICHESTVENNOE[n];
  if (word === undefined) {
    throw new Error(`Нет количественного числительного для ${n}`);
  }
  return word;
}

/** Числительное в творительном: «тремя лампами». */
const TVORITELNOE: Record<number, string> = {
  2: 'двумя',
  3: 'тремя',
  4: 'четырьмя',
};

export function tvoritelnoe(n: number): string {
  const word = TVORITELNOE[n];
  if (word === undefined) {
    throw new Error(`Нет творительной формы числительного для ${n}`);
  }
  return word;
}

/** Кратность в родительном: «не больше одного раза», «двух раз». */
const RAZ_ROD: Record<number, string> = {
  1: 'одного раза',
  2: 'двух раз',
  3: 'трёх раз',
};

export function razGen(n: number): string {
  const word = RAZ_ROD[n];
  if (word === undefined) {
    throw new Error(`Нет родительной формы кратности для ${n}`);
  }
  return word;
}

/** «два раза», «три раза», «четыре раза» — как в задачнике. */
const RAZ: Record<number, string> = { 2: 'дважды', 3: 'трижды', 4: 'четырежды' };

export function razy(n: number): string {
  const word = RAZ[n];
  if (word === undefined) {
    throw new Error(`Нет наречия кратности для ${n}`);
  }
  return word;
}

/** Список через запятую с «и» перед последним: «Дима, Марат и Петя». */
export function perechislenie(items: readonly string[]): string {
  if (items.length <= 1) {
    return items[0] ?? '';
  }
  return `${items.slice(0, -1).join(', ')} и ${items[items.length - 1] as string}`;
}
