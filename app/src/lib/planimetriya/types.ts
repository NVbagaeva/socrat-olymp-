/**
 * Модель движка планиметрических чертежей (задание №1).
 *
 * Сцена описывается декларативно: точки — свободные (координаты) или
 * построенные (середина, основание перпендикуляра, пересечение…),
 * окружности — по центру и радиусу или построением, а сам чертёж —
 * список элементов, разложенных по слоям: «условие», «подсказка,
 * шаг N», «решение учителя». Движок сам вычисляет построения,
 * поворачивает и отражает фигуру (вариант генератора), выбирает
 * масштаб и раскладывает подписи.
 *
 * Координаты сцены — математические (ось y вверх), единицы любые:
 * движок вписывает фигуру в заданный размер рисунка.
 */

import type { Prepyatstvie } from './kollizii';

/** Точка в координатах сцены. */
export type T2 = readonly [number, number];

/* ── Построенные точки ───────────────────────────────────────────── */

/** Середина отрезка PQ. */
export interface PSeredina {
  seredina: readonly [string, string];
}
/** Основание перпендикуляра из точки P на прямую AB: [P, A, B]. */
export interface POsnovanie {
  osnovanie: readonly [string, string, string];
}
/** Конец биссектрисы угла при вершине V на противолежащей стороне: [V, P, Q]. */
export interface PBissektrisa {
  bissektrisa: readonly [string, string, string];
}
/** Пересечение прямых AB и CD. */
export interface PPeresechenie {
  peresechenie: readonly [readonly [string, string], readonly [string, string]];
}
/**
 * Пересечение прямой AB с окружностью. Из двух точек берётся
 * «dalnyaya» (дальше от A по направлению AB) или «blizhnyaya»;
 * «ne»: точка, отличная от названной (вторая точка секущей).
 */
export interface PPryamayaOkruzhnost {
  pryamayaOkruzhnost: {
    pryamaya: readonly [string, string];
    okr: string;
    vybor: 'dalnyaya' | 'blizhnyaya' | { ne: string };
  };
}
/** Точка касания касательной из внешней точки: storona 1 или −1 — какая из двух. */
export interface PKasanie {
  kasanie: { iz: string; okr: string; storona: 1 | -1 };
}
/** Точка окружности по градусной мере: полярный угол от центра, градусы. */
export interface PNaDuge {
  naDuge: { okr: string; gradus: number };
}
/** Центр описанной окружности треугольника. */
export interface PCentrOpisannoy {
  centrOpisannoy: readonly [string, string, string];
}
/** Центр вписанной окружности треугольника. */
export interface PCentrVpisannoy {
  centrVpisannoy: readonly [string, string, string];
}
/** Ортоцентр треугольника. */
export interface POrtocentr {
  ortocentr: readonly [string, string, string];
}
/** Точка A + t·(B − A): на прямой AB, t = 0 — A, t = 1 — B. */
export interface PNaPryamoy {
  naPryamoy: readonly [string, string, number];
}
/** Точка P + Q − R: четвёртая вершина параллелограмма PRQ… (сумма векторов). */
export interface PSumma {
  summa: readonly [string, string, string];
}

export type Postroenie =
  | PSeredina
  | POsnovanie
  | PBissektrisa
  | PPeresechenie
  | PPryamayaOkruzhnost
  | PKasanie
  | PNaDuge
  | PCentrOpisannoy
  | PCentrVpisannoy
  | POrtocentr
  | PNaPryamoy
  | PSumma;

/** Определение точки: координаты или построение. */
export type OpredelenieTochki = T2 | Postroenie;

/* ── Окружности ──────────────────────────────────────────────────── */

export type OpredelenieOkruzhnosti =
  | { centr: string; radius: number }
  | { centr: string; cherez: string }
  /** Окружность, описанная около треугольника. */
  | { opisannaya: readonly [string, string, string] }
  /** Окружность, вписанная в треугольник. */
  | { vpisannaya: readonly [string, string, string] }
  /** Окружность с центром, касающаяся прямой AB (вписанная в многоугольник). */
  | { centr: string; kasaetsya: readonly [string, string] };

/* ── Слои ────────────────────────────────────────────────────────── */

/**
 * Слой элемента: 'uslovie' — рисунок условия (лист ученика),
 * число N ≥ 1 — шаг подсказки N, 'reshenie' — решение учителя.
 * Шаги подсказок накапливаются: на шаге N видны слои 1…N.
 */
export type Sloy = 'uslovie' | 'reshenie' | number;

/** Роль выделения: искомое (жирно, цветом), данное (обычное). */
export type Vydelenie = 'iskomoe' | 'dano';

interface Bazovyy {
  /** Слой, по умолчанию 'uslovie'. */
  sloy?: Sloy;
  /** Выделение элемента. */
  vydelit?: Vydelenie;
  /** Шаги подсказок, на которых элемент подсвечивается (элемент условия «загорается»). */
  podsvetka?: readonly number[];
  /**
   * Значение у элемента: «10», «37°», «x». Число на чертеже — только
   * данные условия: в слое условия показывается лишь при chisla: true,
   * в подсказках и решении — всегда.
   */
  znachenie?: string;
  /** Элемент — искомая величина: его значение никогда не выводится, кроме листа учителя. */
  otvet?: boolean;
  /** Идентификатор для тестов и подсветки. */
  id?: string;
}

export interface EOtrezok extends Bazovyy {
  tip: 'otrezok';
  a: string;
  b: string;
  /** 'punktir' — вспомогательный: только в подсказках и решении. */
  stil?: 'osnovnoy' | 'punktir';
  /** Штрихи равенства: 1, 2 или 3. */
  shtrihi?: 1 | 2 | 3;
  /**
   * Только штрихи, без линии: отрезок уже нарисован стороной
   * многоугольника, повторная линия дала бы двойной штрих.
   */
  tolkoShtrihi?: boolean;
}

/**
 * Продолжение отрезка AB за точку B пунктиром (высота тупоугольного
 * треугольника, внешний угол). Часть условия, а не вспомогательное
 * построение: рисуется и на листе ученика.
 */
export interface EProdolzhenie extends Bazovyy {
  tip: 'prodolzhenie';
  a: string;
  b: string;
  /** До какой точки продолжать (лежит на прямой AB за B). */
  doTochki?: string;
  /** Или на сколько, в долях |AB|. */
  dolya?: number;
  /** Сплошной луч (касательная, сторона внешнего угла); по умолчанию — пунктир. */
  sploshnoe?: boolean;
}

/** Прямая через точки A и B, выходящая за них на долю длины (касательная, секущая). */
export interface EPryamaya extends Bazovyy {
  tip: 'pryamaya';
  a: string;
  b: string;
  /** Выход за A и за B в долях |AB|. */
  zaA?: number;
  zaB?: number;
}

export interface EMnogougolnik extends Bazovyy {
  tip: 'mnogougolnik';
  tochki: readonly string[];
}

export interface EOkruzhnost extends Bazovyy {
  tip: 'okruzhnost';
  okr: string;
  stil?: 'osnovnoy' | 'punktir';
}

/** Дуга окружности от точки до точки против часовой стрелки (в координатах сцены). */
export interface EDuga extends Bazovyy {
  tip: 'duga';
  okr: string;
  ot: string;
  do: string;
}

/**
 * Угол APB с вершиной P: дуги (1–3, равные углы — равным числом дуг),
 * или значок прямого угла. Берётся угол меньше 180°.
 */
export interface EUgol extends Bazovyy {
  tip: 'ugol';
  a: string;
  v: string;
  b: string;
  dugi?: 1 | 2 | 3;
  pryamoy?: boolean;
}

export interface ETochka extends Bazovyy {
  tip: 'tochka';
  t: string;
}

/** Заштрихованная область (многоугольник): площадь в условии или в решении. */
export interface EOblast extends Bazovyy {
  tip: 'oblast';
  tochki: readonly string[];
}

export type Element =
  | EOtrezok
  | EProdolzhenie
  | EPryamaya
  | EMnogougolnik
  | EOkruzhnost
  | EDuga
  | EUgol
  | ETochka
  | EOblast;

/* ── Сцена ───────────────────────────────────────────────────────── */

/** Проверка согласованности рисунка с условием (на точной геометрии). */
export type Proverka =
  /** Отрезки равны: [[A, C], [B, C]]. */
  | { ravny: readonly (readonly [string, string])[] }
  /** Угол APB равен value градусов. */
  | { ugol: readonly [string, string, string]; gradusy: number }
  /** Угол APB тупой / острый / прямой. */
  | { ugol: readonly [string, string, string]; vid: 'tupoy' | 'ostryy' | 'pryamoy' }
  /** Точки лежат на одной прямой. */
  | { naPryamoy: readonly string[] }
  /** Прямые AB и CD параллельны. */
  | { parallelny: readonly [readonly [string, string], readonly [string, string]] }
  /** Точки лежат на окружности. */
  | { naOkruzhnosti: string; tochki: readonly string[] };

export interface Scena {
  tochki: Record<string, OpredelenieTochki>;
  okruzhnosti?: Record<string, OpredelenieOkruzhnosti>;
  elementy: Element[];
  /**
   * Подписи точек: по умолчанию подписаны все точки, через которые
   * проходит видимый элемент. false — чертёж без букв (как в ФИПИ у
   * задач «в прямоугольном треугольнике угол между…»); список —
   * подписать только эти.
   */
  podpisi?: boolean | readonly string[];
  /** Точки, которые не подписываются никогда (вспомогательные вершины). */
  bezPodpisi?: readonly string[];
  /** Проверки согласованности с условием; при схематичном рисунке — только топология. */
  proverki?: readonly Proverka[];
  /** Ответ задачи: ни одна надпись чертежа (кроме листа учителя) не должна его показывать. */
  otvet?: string;
  /** Рисунок схематичный: углы увеличены до порога, проверки величин отключены. */
  skhematichno?: boolean;
  /** Сколько шагов подсказки в сцене (вычисляется по слоям, можно задать явно). */
  shagov?: number;
}

/* ── Режимы и вариант ────────────────────────────────────────────── */

export type Rezhim =
  /** Лист ученика и «Задания для отработки»: только слой условия. */
  | { rezhim: 'uchenik' }
  /** Подсказка: слой условия и шаги 1…shag, шаг shag подсвечен. */
  | { rezhim: 'podskazka'; shag: number }
  /** Лист учителя: все слои. */
  | { rezhim: 'uchitel' };

/** Вариант генератора: поворот, отражение, переименование точек. */
export interface Variant {
  /** Поворот, градусы против часовой стрелки. */
  povorot: number;
  /** Отражение относительно вертикальной оси (до поворота). */
  otrazhenie: boolean;
  /** Переименование: старое имя → новое. */
  bukvy: Readonly<Record<string, string>>;
}

export interface Optsii {
  rezhim?: Rezhim;
  /** Показывать данные числа в слое условия (по умолчанию нет — как в ФИПИ). */
  chisla?: boolean;
  /** Вариант генератора. */
  variant?: Variant;
  /** Наибольшая ширина и высота фигуры, px (без подписей). */
  shirina?: number;
  vysota?: number;
  /** Описание для скринридера. */
  alt?: string;
}

/* ── Отчёт ───────────────────────────────────────────────────────── */

export interface Ramka {
  kind: 'tochka' | 'znachenie';
  id: string;
  /** Левый верхний угол и размер, px. */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Otchet {
  width: number;
  height: number;
  /** Точки на экране, px (после поворота и масштаба). */
  ekran: Record<string, T2>;
  /** Подписи и значения на рисунке. */
  ramki: Ramka[];
  /** Видимые элементы в режиме. */
  vidimye: number;
  /** Нарушения: подпись налезает, фигура вырождена, вспомогательное в условии… */
  problems: string[];
  /** Тексты, выведенные на чертёж (буквы и значения). */
  teksty: string[];
  /** Все линии и кривые рисунка, px: по ним автотест заново проверяет подписи. */
  prepyatstviya: Prepyatstvie[];
}
