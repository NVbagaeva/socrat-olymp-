/**
 * Модель задания №9 «Производная и первообразная»: рисунок, запрос,
 * прототип, сгенерированная задача.
 *
 * Рисунок (Figura) — чистые данные: узлы сплайна на целой сетке,
 * окно, отмеченные точки, касательная, закраска. Ни ответа, ни
 * подсказок в нём нет, поэтому один и тот же рисунок рисуется в трёх
 * режимах: для листа ученика, для подсказки и для листа учителя.
 * Запрос (Zapros) — то, что спрашивают; по рисунку и запросу ответ
 * независимо пересчитывает reshit.ts — на этом держится автотест.
 */

import type { Rng } from '../veroyatnost/generator';

/** Точка с целыми координатами в клетках. */
export type Tochka = readonly [number, number];

/** Узел сплайна: абсцисса, значение и (необязательно) наклон касательной. */
export interface Uzel {
  x: number;
  y: number;
  /** Наклон в узле. Нет — считается монотонной интерполяцией. */
  m?: number;
}

export interface Okno {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
}

/** Что нарисовано на рисунке. */
export type Rezhim =
  /** график функции f */
  | 'f'
  /** график производной f′ */
  | 'fprime'
  /** график первообразной F */
  | 'F'
  /** ломаная — график f из прямолинейных кусков (для F(b) − F(a)) */
  | 'lomanaya'
  /** парабола f с закрашенной фигурой (площадь по формуле F) */
  | 'zalivka'
  /** прямая по двум узлам (опорные задачи на наклон) */
  | 'pryamaya';

/** Конец графика: выколотая точка, закрашенная или просто обрыв. */
export type Konets = 'open' | 'closed' | 'none';

export interface Kasatelnaya {
  /** Две точки касательной в узлах сетки. */
  a: Tochka;
  b: Tochka;
  /** Абсцисса точки касания: она же узел сплайна. */
  x0: number;
}

/**
 * Вспомогательное построение. Рисуется только в подсказке и на листе
 * учителя; на листе ученика движок их не показывает вовсе.
 * `shag` — с какого шага подсказки элемент появляется (0 — сразу).
 */
export type Pomoshch =
  /** пунктир от оси x вверх (вниз) до графика в точке x */
  | { t: 'vert'; x: number; podpis?: string; shag?: number }
  /** горизонтальная прямая y = k */
  | { t: 'goriz'; y: number; podpis?: string; shag?: number }
  /** точка на графике или в плоскости */
  | { t: 'tochka'; x: number; y: number; podpis?: string; shag?: number }
  /** отрезок [p; q] на оси x */
  | { t: 'otrezok'; p: number; q: number; shag?: number }
  /** знак на промежутке между x0 и x1: «+» или «−» (у графика f′) */
  | { t: 'znak'; x0: number; x1: number; znak: 1 | -1; shag?: number }
  /** треугольник наклона касательной с углом α */
  | { t: 'treugolnik'; shag?: number }
  /** засечка с числом на оси x (читаемый ответ) */
  | { t: 'zasechka'; x: number; podpis?: string; shag?: number };

export interface Figura {
  rezhim: Rezhim;
  okno: Okno;
  /** Подпись кривой: «f(x)», «f′(x)», «F(x)». Пусто — подписи нет. */
  podpis: string;
  /** Узлы сплайна или вершины ломаной, по возрастанию x. */
  uzly: Uzel[];
  levyy: Konets;
  pravyy: Konets;
  /** Отмеченные точки x₁ … xₙ на оси абсцисс, слева направо. */
  metki?: number[];
  kasatelnaya?: Kasatelnaya;
  /** Закраска между графиком и осью Ox на [a; b]. */
  zalivka?: { a: number; b: number };
  /** Какие числа подписаны на оси x: все целые или только 0 и 1. */
  chisla?: 'vse' | 'minimum';
  /** Подписи чисел по оси y: те же варианты. */
  chislaY?: 'vse' | 'minimum';
  /** Числа на оси x, которые подписываются непременно (корни, границы): если рядом график, подпись уходит на другую сторону оси. */
  obyazatelnye?: number[];
  pomoshch?: Pomoshch[];
  /** Пикселей на клетку; по умолчанию подбирается под ширину. */
  cell?: number;
  alt?: string;
}

/* ── Запросы ─────────────────────────────────────────────────────── */

export type ZaprosT =
  | 'znak-v-metkah'
  | 'celye-znak'
  | 'chislo-nuley'
  | 'nul-na-otrezke'
  | 'metki-na-vozrastanii'
  | 'tochka-max'
  | 'tochka-min'
  | 'chislo-max'
  | 'chislo-min'
  | 'chislo-extr'
  | 'extr-na-otrezke'
  | 'naib-na-otrezke'
  | 'naim-na-otrezke'
  | 'kasat-abscissa'
  | 'kasat-chislo'
  | 'naib-metka'
  | 'naim-metka'
  | 'kasat-znachenie'
  | 'chislo-nuley-f'
  | 'prirashchenie'
  | 'ploshchad';

export interface Zapros {
  t: ZaprosT;
  /** znak: 1 — «положительна / возрастает», −1 — «отрицательна / убывает». */
  znak?: 1 | -1;
  /** Отрезок [p; q] или пределы [a; b]. */
  p?: number;
  q?: number;
  /** Угловой коэффициент k для «касательная параллельна прямой». */
  k?: number;
}

/* ── Прототипы и задачи ─────────────────────────────────────────── */

export type Gruppa = 'I' | 'II' | 'III' | 'IV' | 'V';

/** Источник задачи: открытый банк ФИПИ или наши собственные. */
export type Istochnik = 'otkrytyj-bank' | 'ne-iz-otkrytogo-banka';

export type Params = Record<string, number | string>;

/** Шаг разбора: заголовок и строки с формулами в $…$. */
export interface Shag {
  zagolovok: string;
  stroki: string[];
}

/** Вариант ответа на вопрос подсказки. */
export interface Variant {
  /** Текст кнопки, формулы в $…$. */
  tekst: string;
  verno: boolean;
  /** Почему этот вариант неверен (для верного — пусто). */
  pochemu?: string;
}

/** Вопрос подсказки: формулировка и кнопки ответа. */
export interface Vopros {
  vopros: string;
  varianty: Variant[];
  /** Что ученик узнаёт, ответив верно: короткая строка, формулы в $…$. */
  itog?: string;
  /** С какого шага рисунок показывает вспомогательные построения. */
  shag?: number;
}

/** Что даёт генератор прототипа. */
export interface Draft {
  /** Условие: текст с формулами в $…$. */
  uslovie: string;
  /** Рисунок; null у задач без рисунка (физический смысл, параметр c). */
  risunok: Figura | null;
  /** Что спрашивают — по нему ответ пересчитывает reshit.ts. */
  zapros: Zapros | null;
  /** Ответ числом: целое или конечная десятичная дробь. */
  otvet: number;
  /** Второй, независимый счёт ответа. */
  proverka: number;
  /** Разбор по шагам с заголовками; последний шаг — «Ответ». */
  shagi: Shag[];
  /** Лесенка вопросов подсказки. */
  podskazka: Vopros[];
  params: Params;
  /** Подпись «главного» в варианте: банк не берёт два варианта с одной. */
  signature: string;
  /** Вид условия: банк берёт не больше трёх вариантов одного вида. */
  vid?: string;
}

export interface Prototype {
  /** Код: 9.1.1 … 9.5.6. */
  id: string;
  gruppa: Gruppa;
  /** Название на сайте. */
  nazvanie: string;
  /** Короткая подпись типа для карточек и фильтров. */
  kratko: string;
  /** Откуда прототип: все наши — «не из открытого банка». */
  istochnik: Istochnik;
  /** true — это рабочая заглушка (в отчёте перечисляются). */
  zaglushka?: boolean;
  /** Есть ли рисунок. */
  risunok: boolean;
  generate(r: Rng): Draft | null;
  /** Ключи параметров, которых генератор не отдаёт. */
  isklyucheniya?: string[];
}

/** Сгенерированная задача: черновик плюс откуда она. */
export interface Generated extends Draft {
  prototype: string;
  seed: string;
  istochnik: Istochnik;
}

export type { Rng };
