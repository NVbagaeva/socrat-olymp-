/**
 * Сюжеты аналогов задания №11: герои, вещества, ёмкости — слова для
 * решения и подсказок и правдоподобные диапазоны чисел. Задача банка
 * параметров сюжета не задаёт и получает слова по умолчанию (те же,
 * что были), аналог — свои: «скорость лыжника», «масса соли в
 * первой бочке». Модель задачи от сюжета не зависит.
 */

/** Герой задачи на движение: родительный падеж и скорость, км/ч. */
export interface Geroy {
  rod: string;
  /** Движется по воде (озеро, без течения). */
  voda: boolean;
  v: [number, number];
}

export const GEROI: Record<string, Geroy> = {
  velo: { rod: 'велосипедиста', voda: false, v: [8, 30] },
  velosipedistka: { rod: 'велосипедистки', voda: false, v: [8, 30] },
  lyzhnik: { rod: 'лыжника', voda: false, v: [8, 20] },
  lyzhnica: { rod: 'лыжницы', voda: false, v: [8, 20] },
  begun: { rod: 'бегуна', voda: false, v: [8, 20] },
  peshehod: { rod: 'пешехода', voda: false, v: [3, 6] },
  motociklist: { rod: 'мотоциклиста', voda: false, v: [30, 100] },
  avtomobil: { rod: 'автомобиля', voda: false, v: [40, 130] },
  avtobus: { rod: 'автобуса', voda: false, v: [40, 130] },
  gruzovik: { rod: 'грузовика', voda: false, v: [40, 130] },
  barzha: { rod: 'баржи', voda: true, v: [5, 25] },
  kater: { rod: 'катера', voda: true, v: [10, 40] },
  teplohod: { rod: 'теплохода', voda: true, v: [10, 40] },
  lodka: { rod: 'лодки', voda: true, v: [5, 25] },
  yahta: { rod: 'яхты', voda: true, v: [5, 30] },
  poezd: { rod: 'поезда', voda: false, v: [40, 150] },
};

/** Вещество смеси: родительный падеж; сплав или раствор; допустимые %. */
export interface Veshchestvo {
  rod: string;
  splav: boolean;
  /** Правдоподобная концентрация, %: у соли раствор не крепче 26 %. */
  p: [number, number];
}

export const VESHCHESTVA: Record<string, Veshchestvo> = {
  kislota: { rod: 'кислоты', splav: false, p: [1, 99] },
  sol: { rod: 'соли', splav: false, p: [1, 26] },
  sahar: { rod: 'сахара', splav: false, p: [1, 70] },
  spirt: { rod: 'спирта', splav: false, p: [1, 96] },
  krasitel: { rod: 'красителя', splav: false, p: [1, 50] },
  glicerin: { rod: 'глицерина', splav: false, p: [1, 99] },
  serebro: { rod: 'серебра', splav: true, p: [1, 99] },
  olovo: { rod: 'олова', splav: true, p: [1, 99] },
  cink: { rod: 'цинка', splav: true, p: [1, 99] },
  nikel: { rod: 'никеля', splav: true, p: [1, 99] },
  med: { rod: 'меди', splav: true, p: [1, 99] },
};

/** Ёмкость: «в первом сосуде» / «во втором сосуде». */
export interface Tara {
  v1: string;
  v2: string;
}

export const TARY: Record<string, Tara> = {
  sosud: { v1: 'в первом сосуде', v2: 'во втором' },
  bochka: { v1: 'в первой бочке', v2: 'во второй' },
  chan: { v1: 'в первом чане', v2: 'во втором' },
  kanistra: { v1: 'в первой канистре', v2: 'во второй' },
  bak: { v1: 'в первом баке', v2: 'во втором' },
  slitok: { v1: 'в первом слитке', v2: 'во втором' },
  kusok: { v1: 'в первом куске', v2: 'во втором' },
};

/** Ключ словаря из параметров: нет — значение по умолчанию. */
export function klyuch<T>(slovar: Record<string, T>, value: unknown, poUmolchaniyu: string): T {
  const k = typeof value === 'string' && value in slovar ? value : poUmolchaniyu;
  return slovar[k] as T;
}
