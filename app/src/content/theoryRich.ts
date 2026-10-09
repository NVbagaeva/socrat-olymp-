/**
 * Разделы теории, свёрстанные блоками: рамка «Главная формула»,
 * карточки, шаги алгоритма с развилкой, сворачиваемая врезка,
 * разобранные примеры с проверкой на адекватность.
 *
 * Так написаны теория линейной функции (content/theoryLinear.ts) и
 * графика корня (content/theoryIrrational.ts). Слова лежат в конфиге,
 * разметка одна — components/tasks/theory/rich. Чертежи — ключи
 * рисунков в lib/theoryFigures.ts: сцену рисует движок graph/, а все
 * подписи на рисунке набирает KaTeX.
 *
 * Разметка внутри строк: $…$ — формула TeX, **…** — выделение.
 */

import type { TheoryBlock } from '@/data/functionTypes';
import type { TheoryFigureId } from '@/lib/theoryFigures';

/** Абзацы текста. */
export interface RichText {
  type: 'text';
  paras: string[];
  /** Первый абзац крупнее — вводная строка раздела. */
  lead?: boolean;
}

/** Яркая рамка «Главная формула»: формула крупно, рядом пояснение. */
export interface RichMainFormula {
  type: 'main-formula';
  chip: string;
  formula: string;
  note: string;
  /** Рисунок справа от рамки. */
  figure?: TheoryFigureId;
}

/** Карточка в сетке карточек. */
export interface RichCard {
  id: string;
  title: string;
  paras?: string[];
  /** Выкладка: строки TeX одна под другой. */
  lines?: string[];
  figure?: TheoryFigureId;
  /** Итог под рисунком: крупная формула и подпись под ней. */
  result?: { formula: string; caption?: string };
}

export interface RichCards {
  type: 'cards';
  items: RichCard[];
  /** Сколько колонок на широком экране. По умолчанию — две. */
  columns?: 2 | 3;
}

/** Ветка развилки внутри шага алгоритма. */
export interface RichFork {
  label: string;
  title: string;
  paras: string[];
  /** Чем кончается ветка: «можно» — спокойная галочка, «нельзя» — предупреждение. */
  tone: 'ok' | 'warn';
  figure?: TheoryFigureId;
}

/** Шаг алгоритма — нумерованная карточка. */
export interface RichStep {
  no: string;
  title: string;
  paras?: string[];
  fork?: RichFork[];
  /** Итог шага в рамке. */
  boxed?: string;
}

export interface RichSteps {
  type: 'steps';
  items: RichStep[];
}

/** Сворачиваемая врезка с кнопкой «Свернуть». */
export interface RichCollapse {
  type: 'collapse';
  title: string;
  /** Короткая пометка рядом с заголовком: «для тех, кто знает тригонометрию». */
  tag?: string;
  blocks: RichBlock[];
}

/** Шаг разобранного примера: у каждого этапа своя подпись. */
export interface RichExampleStep {
  label: string;
  paras?: string[];
  lines?: string[];
  /** Проверка на адекватность выделена своим цветом. */
  check?: boolean;
}

/** Разобранный пример: условие, рисунок и решение по шагам. */
export interface RichExample {
  type: 'example';
  title: string;
  condition: string;
  figure: TheoryFigureId;
  steps: RichExampleStep[];
  answer: string;
}

/** Подраздел с якорем: на него ведёт подпункт «Содержания». */
export interface RichSub {
  type: 'sub';
  id: string;
  no: string;
  title: string;
  blocks: RichBlock[];
}

/** Отдельный рисунок во всю ширину колонки. */
export interface RichFigure {
  type: 'figure';
  figure: TheoryFigureId;
}

/** Тёплая плашка «Запомни». */
export interface RichRemember {
  type: 'remember';
  title?: string;
  paras: string[];
}

/** Памятка-итог: нумерованные пункты. */
export interface RichMemo {
  type: 'memo';
  items: string[];
}

export type RichBlock =
  | RichText
  | RichMainFormula
  | RichCards
  | RichSteps
  | RichCollapse
  | RichExample
  | RichSub
  | RichFigure
  | RichRemember
  | RichMemo;

export interface RichSection {
  /** Ключ раздела: на него ссылается поле body блока теории. */
  id: string;
  blocks: RichBlock[];
}

/**
 * Пункты «Содержания» по разделам: заголовок и кружок с номером.
 * Подпункты — подразделы с якорями (8.1, 8.2 …) — «Содержание»
 * берёт из разметки раздела (components/tasks/TopicTabs.tsx).
 */
export function richTheoryBlocks(
  sections: RichSection[],
  titles: Record<string, string>,
): TheoryBlock[] {
  return sections.map((section, index) => ({
    id: section.id,
    title: titles[section.id] ?? section.id,
    type: 'example',
    content: null,
    body: section.id,
    badge: String(index + 1),
    status: 'ready',
  }));
}
