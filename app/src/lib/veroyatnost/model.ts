/**
 * Модель задачи — раздел 04 референса задания №4.
 *
 * Одна схема на все пять методов: поле `method` выбирает компонент
 * рисунка и шаблон шагов. Модель собирается на сборке из прототипа с
 * его вариантом или из подготовительной задачи; в браузер она уезжает
 * не целиком — открытая часть с условием, закрытая с решением (см.
 * pool.ts). Здесь описано, из чего она состоит и как из рисунка ещё
 * раз получается ответ.
 *
 * Правило деления на открытое и закрытое одно: параметры рисунка
 * могут повторять числа условия, но не ответ и не подсветку
 * благоприятного. Подсвеченные плитки выдают m, клетки — m, путь в
 * дереве — слагаемые, группа в сетке — искомую долю. Всё это идёт
 * вместе с решением.
 */

/* ── Пять методов ─────────────────────────────────────────────────── */

export type Method =
  | 'direct-count'
  | 'outcome-table'
  | 'coordinate-line'
  | 'probability-tree'
  | 'convenient-number'
  | 'formula';

/** Форма меры у координатной прямой: отрезок, дуга или площадь. */
export type Shape = 'segment' | 'arc' | 'area';

export interface MetodOpisanie {
  id: Method;
  nomer: 1 | 2 | 3 | 4 | 5 | 6;
  /** Название метода, как во вкладке «Ключевые методы решения». */
  nazvanie: string;
  /** Формула метода одной строкой, в TeX. */
  formula: string;
}

/**
 * Каталог методов: пять из референса задания №4 и шестой — «Формула»
 * для задания №5, где ответ считается действиями с вероятностями:
 * сумма несовместных, противоположное событие, сумма совместных,
 * перебор числа попыток. У шестого метода рисунка нет — только шаги.
 */
export const METODY: readonly MetodOpisanie[] = [
  {
    id: 'direct-count',
    nomer: 1,
    nazvanie: 'Прямой пересчёт исходов',
    formula: 'P = \\dfrac{m}{n}',
  },
  { id: 'outcome-table', nomer: 2, nazvanie: 'Таблица исходов', formula: 'P = \\dfrac{m}{n}' },
  {
    id: 'coordinate-line',
    nomer: 3,
    nazvanie: 'Координатная прямая',
    formula: 'P = \\dfrac{l}{L}',
  },
  {
    id: 'probability-tree',
    nomer: 4,
    nazvanie: 'Дерево вероятностей',
    formula: 'P = p_1 \\cdot p_2 + \\ldots',
  },
  /* Название метода — «Условная вероятность»: так решил автор. Приём тот
     же — удобное число объектов и сетка 10×10; идентификатор и рисунок
     остались прежними. */
  {
    id: 'convenient-number',
    nomer: 5,
    nazvanie: 'Условная вероятность',
    formula: 'P = \\dfrac{m}{n}',
  },
  { id: 'formula', nomer: 6, nazvanie: 'Формула', formula: 'P(A + B) = P(A) + P(B)' },
];

/** Методы задания №4: пять из референса, без «Формулы». */
export const METODY_4: readonly MetodOpisanie[] = METODY.filter((m) => m.id !== 'formula');

/** Методы задания №5: все шесть. */
export const METODY_5: readonly MetodOpisanie[] = METODY;

export function metodPoId(id: Method): MetodOpisanie {
  const est = METODY.find((m) => m.id === id);
  if (est === undefined) {
    throw new Error(`Неизвестный метод ${id}`);
  }
  return est;
}

/* ── Параметры рисунка: открытая часть ───────────────────────────── */

/** Плитки исходов. `counts` — когда одна плитка стоит за группу. */
export interface ParametryPlitok {
  method: 'direct-count';
  outcomes: string[];
  counts?: number[];
  groups?: { label: string; count: number }[];
  columns?: number;
}

/** Таблица исходов. Содержимое клеток — матрицей: функций в JSON нет. */
export interface ParametryTablitsy {
  method: 'outcome-table';
  rows: number;
  columns: number;
  rowLabels?: string[];
  columnLabels?: string[];
  rowTitle?: string;
  columnTitle?: string;
  cells: string[][];
}

export type ParametryPryamoy =
  | {
      method: 'coordinate-line';
      shape: 'segment';
      min: number;
      max: number;
      /** Границы промежутка; хотя бы одна задана, вторая — край отрезка. */
      c?: number;
      d?: number;
      leftBoundary: 'strict' | 'inclusive';
      rightBoundary: 'strict' | 'inclusive';
      unit?: string;
    }
  | { method: 'coordinate-line'; shape: 'arc'; divisions: number; from: number; to: number }
  | { method: 'coordinate-line'; shape: 'area'; total: number; favorable: number; unit?: string };

export interface ParametryDereva {
  method: 'probability-tree';
  levels: string[];
  /**
   * Ветви деревом через ссылку на родителя. `pLabel` — как подписать
   * вероятность, когда десятичная запись некрасива: «11/25» вместо
   * 0,44 у фломастеров без возвращения.
   */
  branches: { id: string; parent: string | null; label: string; p: number; pLabel?: string }[];
}

export interface ParametrySetki {
  method: 'convenient-number';
  baseNumber: 100 | 1000 | 10000;
  groups: { label: string; share: number; tone?: 'soft' | 'mid' | 'strong' }[];
  unit?: string;
}

/** Метод «Формула»: рисунка нет, задача решается шагами. */
export interface ParametryFormuly {
  method: 'formula';
}

export type Parametry =
  | ParametryPlitok
  | ParametryTablitsy
  | ParametryPryamoy
  | ParametryDereva
  | ParametrySetki
  | ParametryFormuly;

/* ── Подсветка благоприятного: закрытая часть ────────────────────── */

export type Podsvetka =
  | { method: 'direct-count'; favorable: number[] }
  | { method: 'outcome-table'; favorableCells: [number, number][] }
  /* У прямой отдельной подсветки нет: благоприятное задано самими
     границами, карточка лишь переключает highlightMode. */
  | { method: 'coordinate-line' }
  | { method: 'probability-tree'; highlightedPaths: string[] }
  /* Искомая группа; `highlightedGroups` — когда искомое складывается
     из нескольких групп (полная вероятность: забракованы и те, и эти). */
  | { method: 'convenient-number'; highlightedGroup: number; highlightedGroups?: number[] }
  | { method: 'formula' };

/** Рисунок целиком: открытая и закрытая части. */
export interface Vizual {
  parametry: Parametry;
  podsvetka: Podsvetka;
}

/* ── Модель задачи ───────────────────────────────────────────────── */

export interface ModelShag {
  text: string;
  /** Формула шага в TeX; может отсутствовать у чисто словесного шага. */
  formula?: string;
}

/**
 * Задача в формате раздела 04. Ровно та JSON-модель, что описана в
 * референсе, плюс `shape` у координатной прямой и явное разделение
 * подсветки — иначе ответ уезжал бы вместе с условием.
 */
export interface ProblemModel {
  id: string;
  method: Method;
  shape?: Shape;
  condition: string;
  parameters: Parametry;
  solution: {
    /** Фраза после «Метод:». */
    method: string;
    steps: ModelShag[];
    highlight: Podsvetka;
  };
  answer: { value: number; display: string };
  illustration: { path: string; alt: string; ratio: '4:3' };
}

/**
 * Путь к иллюстрации по соглашению проекта: картинки живут в /images,
 * по одной на задачу, именем — идентификатор задачи. WebP: как и
 * остальные картинки сайта, PNG с прозрачным фоном в нём в десять раз
 * легче. Исходники — в assets/img/probability.
 */
export function putIllyustratsii(id: string): string {
  const zadanie = /^[pk]5-/.test(id) ? 5 : 4;
  return `/images/veroyatnost/zadanie-${zadanie}/${id}.webp`;
}

/* ── Третий счёт: ответ прямо по рисунку ─────────────────────────── */

/**
 * Вероятность, которую показывает рисунок. Считается только по
 * параметрам и подсветке — без формулы прототипа и без перебора.
 * Это третий независимый путь к ответу: если он разошёлся с первыми
 * двумя, значит, картинка врёт ученику, и сборка падает.
 *
 * null — рисунок такого метода ответа не показывает (у прямой нет
 * подсветки, там мера читается прямо с параметров; у дерева без
 * путей считать нечего).
 */
export function otvetPoRisunku(vizual: Vizual): number | null {
  const { parametry, podsvetka } = vizual;
  if (parametry.method !== podsvetka.method) {
    throw new Error(`Рисунок ${parametry.method}, а подсветка ${podsvetka.method}`);
  }
  switch (parametry.method) {
    case 'direct-count': {
      if (podsvetka.method !== 'direct-count') {
        return null;
      }
      const counts = parametry.counts ?? parametry.outcomes.map(() => 1);
      const n = counts.reduce((s, c) => s + c, 0);
      const m = podsvetka.favorable.reduce((s, i) => s + (counts[i] ?? 0), 0);
      return m / n;
    }
    case 'outcome-table': {
      if (podsvetka.method !== 'outcome-table') {
        return null;
      }
      return podsvetka.favorableCells.length / (parametry.rows * parametry.columns);
    }
    case 'coordinate-line': {
      if (parametry.shape === 'segment') {
        const d = parametry.d ?? parametry.max;
        const c = parametry.c ?? parametry.min;
        return (d - c) / (parametry.max - parametry.min);
      }
      if (parametry.shape === 'arc') {
        const { divisions, from, to } = parametry;
        return ((to - from + divisions) % divisions) / divisions;
      }
      return parametry.favorable / parametry.total;
    }
    case 'probability-tree': {
      if (podsvetka.method !== 'probability-tree') {
        return null;
      }
      const roditel = new Map(parametry.branches.map((b) => [b.id, b]));
      let summa = 0;
      for (const leaf of podsvetka.highlightedPaths) {
        let p = 1;
        let tek: string | null = leaf;
        while (tek !== null) {
          const b = roditel.get(tek);
          if (b === undefined) {
            throw new Error(`В дереве нет ветки ${tek}`);
          }
          p *= b.p;
          tek = b.parent;
        }
        summa += p;
      }
      return summa;
    }
    case 'convenient-number': {
      if (podsvetka.method !== 'convenient-number') {
        return null;
      }
      const gruppy = podsvetka.highlightedGroups ?? [podsvetka.highlightedGroup];
      let summa = 0;
      for (const i of gruppy) {
        const gruppa = parametry.groups[i];
        if (gruppa === undefined) {
          return null;
        }
        summa += gruppa.share;
      }
      return Math.round(summa * 1e9) / 1e9;
    }
    case 'formula':
      return null;
    default:
      return null;
  }
}

/* ── TeX → слова ─────────────────────────────────────────────────── */

/**
 * Формула шага обычным текстом: для alt, для голосового доступа и для
 * мест, где KaTeX не подключён. Обрабатывается только тот TeX, что
 * пишем сами в разборах: дроби, точки, запятые в числах, π и степени.
 */
export function texPlain(formula: string): string {
  return formula
    .replace(/\\dfrac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2')
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2')
    .replace(/\{,\}/g, ',')
    .replace(/\\cdot/g, '·')
    .replace(/\\times/g, '×')
    .replace(/\\approx/g, '≈')
    .replace(/\\pi/g, 'π')
    .replace(/\\ldots/g, '…')
    .replace(/\^\{?2\}?/g, '²')
    .replace(/\^\{([^}]*)\}/g, '^$1')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
