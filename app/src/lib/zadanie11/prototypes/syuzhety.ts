/**
 * Сюжеты аналогов задания №11: герои, вещества, ёмкости — слова для
 * решения и подсказок и правдоподобные диапазоны чисел. Задача банка
 * параметров сюжета не задаёт и получает слова по умолчанию (те же,
 * что были), аналог — свои: «скорость лыжника», «масса соли в
 * первой бочке». Модель задачи от сюжета не зависит.
 */

/**
 * Как движется герой — отсюда его глаголы: автобус «выехал» и
 * «проехал», турист «вышел» и «прошёл», теплоход «вышел из пристани»
 * и «прибыл». Глагол в шаблоне всегда берётся у героя: общий глагол
 * на всех героев даёт «автобус прошёл».
 */
export type Sposob = 'edet' | 'idet' | 'bezhit' | 'plyvet' | 'sudno' | 'poezd';

/** Грамматический род героя: «автобус выехал», «лодка вышла», «такси выехало». */
export type RodSlova = 'm' | 'f' | 'n';

/** Формы глагола прошедшего времени: он, она, оно, они. */
export interface Forma {
  m: string;
  f: string;
  n: string;
  mn: string;
}

export interface Glagoly {
  sposob: Sposob;
  /** Начал движение: выехал / вышел / побежал / поплыл. */
  vyshel: Forma;
  /** Проделал путь: проехал / прошёл / пробежал / проплыл. */
  proshel: Forma;
  /** Добрался: приехал / пришёл / прибежал / приплыл / прибыл. */
  prishel: Forma;
  /** Был в движении: ехал / шёл / бежал / плыл. */
  shel: Forma;
  /** Настоящее время: «за час проезжает / проходит / пробегает». */
  prohodit: string;
  /** Неопределённая форма: проехать / пройти / пробежать / проплыть. */
  proiti: string;
  /** Причастие в родительном падеже: «скорость приехавшего к финишу». */
  prishedshego: { m: string; f: string };
}

/** Формы от мужского рода: «выехал» → выехала, выехало, выехали; «вышел» → вышла… */
function forma(m: string): Forma {
  const osnova = m.replace(/(шёл|шел)$/, 'шл');
  return { m, f: `${osnova}а`, n: `${osnova}о`, mn: `${osnova}и` };
}

function glagoly(
  sposob: Sposob,
  [vyshel, proshel, prishel, shel]: [string, string, string, string],
  prohodit: string,
  proiti: string,
  prich: string,
): Glagoly {
  return {
    sposob,
    vyshel: forma(vyshel),
    proshel: forma(proshel),
    prishel: forma(prishel),
    shel: forma(shel),
    prohodit,
    proiti,
    prishedshego: { m: `${prich}его`, f: `${prich}ей` },
  };
}

/** Едет: автомобиль, автобус, мотоциклист, велосипедист, гонщик… */
export const EDET = glagoly(
  'edet',
  ['выехал', 'проехал', 'приехал', 'ехал'],
  'проезжает',
  'проехать',
  'приехавш',
);
/** Идёт: пешеход, турист, лыжник. */
export const IDET = glagoly(
  'idet',
  ['вышел', 'прошёл', 'пришёл', 'шёл'],
  'проходит',
  'пройти',
  'пришедш',
);
/** Бежит: бегун. */
export const BEZHIT = glagoly(
  'bezhit',
  ['побежал', 'пробежал', 'прибежал', 'бежал'],
  'пробегает',
  'пробежать',
  'прибежавш',
);
/** Плывёт сам: пловец. */
export const PLYVET = glagoly(
  'plyvet',
  ['поплыл', 'проплыл', 'приплыл', 'плыл'],
  'проплывает',
  'проплыть',
  'приплывш',
);
/** Судно: катер «вышел из пристани», «прошёл по течению», «прибыл». */
export const SUDNO = glagoly(
  'sudno',
  ['вышел', 'прошёл', 'прибыл', 'шёл'],
  'проходит',
  'пройти',
  'прибывш',
);
/** Поезд: «прошёл мимо платформы», «прибыл» — как в задачах ФИПИ. */
export const POEZD = glagoly(
  'poezd',
  ['вышел', 'прошёл', 'прибыл', 'шёл'],
  'проходит',
  'пройти',
  'прибывш',
);

/** Герой задачи на движение: падежи, род, глаголы и скорость, км/ч. */
export interface Geroy {
  /** Именительный падеж: «автобус». */
  im: string;
  /** Родительный падеж: «автобуса». */
  rod: string;
  rodSlova: RodSlova;
  gl: Glagoly;
  /** Движется по воде (озеро, без течения). */
  voda: boolean;
  v: [number, number];
}

const g = (
  im: string,
  rod: string,
  rodSlova: RodSlova,
  gl: Glagoly,
  v: [number, number],
): Geroy => ({ im, rod, rodSlova, gl, voda: gl === SUDNO || gl === PLYVET, v });

export const GEROI: Record<string, Geroy> = {
  velo: g('велосипедист', 'велосипедиста', 'm', EDET, [8, 30]),
  velosipedistka: g('велосипедистка', 'велосипедистки', 'f', EDET, [8, 30]),
  lyzhnik: g('лыжник', 'лыжника', 'm', IDET, [8, 20]),
  lyzhnica: g('лыжница', 'лыжницы', 'f', IDET, [8, 20]),
  begun: g('бегун', 'бегуна', 'm', BEZHIT, [8, 20]),
  peshehod: g('пешеход', 'пешехода', 'm', IDET, [3, 6]),
  motociklist: g('мотоциклист', 'мотоциклиста', 'm', EDET, [30, 100]),
  avtomobil: g('автомобиль', 'автомобиля', 'm', EDET, [40, 130]),
  avtobus: g('автобус', 'автобуса', 'm', EDET, [40, 130]),
  gruzovik: g('грузовик', 'грузовика', 'm', EDET, [40, 130]),
  taksi: g('такси', 'такси', 'n', EDET, [30, 120]),
  elektrichka: g('электричка', 'электрички', 'f', EDET, [40, 120]),
  barzha: g('баржа', 'баржи', 'f', SUDNO, [5, 25]),
  kater: g('катер', 'катера', 'm', SUDNO, [10, 40]),
  teplohod: g('теплоход', 'теплохода', 'm', SUDNO, [10, 40]),
  lodka: g('лодка', 'лодки', 'f', SUDNO, [5, 25]),
  yahta: g('яхта', 'яхты', 'f', SUDNO, [5, 30]),
  poezd: g('поезд', 'поезда', 'm', POEZD, [40, 150]),
  plovec: g('пловец', 'пловца', 'm', PLYVET, [2, 8]),
  snegohod: g('снегоход', 'снегохода', 'm', EDET, [20, 80]),
  turist: g('турист', 'туриста', 'm', IDET, [2, 7]),
  baidarka: g('байдарка', 'байдарки', 'f', SUDNO, [3, 12]),
  buksir: g('буксир', 'буксира', 'm', SUDNO, [5, 25]),
  parom: g('паром', 'парома', 'm', SUDNO, [10, 40]),
  gonshchik: g('гонщик', 'гонщика', 'm', EDET, [60, 250]),
  velogonshchik: g('велогонщик', 'велогонщика', 'm', EDET, [15, 50]),
  karting: g('картинг', 'картинга', 'm', EDET, [20, 80]),
  samokat: g('самокат', 'самоката', 'm', EDET, [8, 25]),
};

/** Форма глагола героя по его роду; mn — «они» (два автобуса выехали). */
export function glagol(
  geroy: Geroy,
  kakoy: 'vyshel' | 'proshel' | 'prishel' | 'shel',
  mn = false,
): string {
  return geroy.gl[kakoy][mn ? 'mn' : geroy.rodSlova];
}

/** Герой из параметров (geroy, geroy2); нет — герой задачи банка. */
export function geroyIz(
  p: Readonly<Record<string, unknown>>,
  key: string,
  poUmolchaniyu: string,
): Geroy {
  return klyuch(GEROI, p[key], poUmolchaniyu);
}

/** Герой из параметров, только если он задан: у задачи банка его нет. */
export function geroyEsli(p: Readonly<Record<string, unknown>>, key = 'geroy'): Geroy | null {
  const k = p[key];
  return typeof k === 'string' && k in GEROI ? (GEROI[k] as Geroy) : null;
}

/** Мужской или женский род слова: «первый» / «первая». */
export function poRodu(geroy: Geroy, m: string, f: string): string {
  return geroy.rodSlova === 'f' ? f : m;
}

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

/** Общие глаголы, когда герои движутся по-разному (пешеход и велосипедист). */
const NEJTRALNYE = {
  vyshel: 'отправились',
  proshel: 'преодолели',
  prishel: 'добрались',
  shel: 'двигались',
} as const;

/**
 * Глагол для двоих: два автобуса «выехали», два туриста «вышли»;
 * пешеход и велосипедист — «отправились».
 */
export function glagolPary(
  a: Geroy,
  b: Geroy,
  kakoy: 'vyshel' | 'proshel' | 'prishel' | 'shel',
): string {
  return a.gl.sposob === b.gl.sposob ? a.gl[kakoy].mn : NEJTRALNYE[kakoy];
}
