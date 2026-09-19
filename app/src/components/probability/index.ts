/**
 * Компоненты вероятности — общий переиспользуемый слой.
 *
 * Шесть рисунков к пяти методам решения. Ни один не привязан к
 * конкретной задаче и ни один не привязан к заданию №4: что нарисовать,
 * целиком задают параметры.
 *
 * Стили подключаются отдельно — `@/components/probability/probability.css`.
 *
 * Общее правило для всех шести: подсветка благоприятного (`favorable`,
 * `favorableCells`, `highlightedPaths`, `highlightedGroup`) приходит
 * вместе с решением, а не с условием. Пока ученик не ответил, эти
 * параметры не передаются — иначе ответ окажется в разметке страницы.
 */

export { OutcomeTiles, type OutcomeTilesProps, type RisunokState } from './OutcomeTiles';
export { OutcomeGrid, type OutcomeGridProps } from './OutcomeGrid';
export {
  CoordinateLine,
  type CoordinateLineProps,
  type HighlightMode,
  type Boundary,
} from './CoordinateLine';
export { CircularRatio, type CircularRatioProps } from './CircularRatio';
export { ProbabilityTree, type ProbabilityTreeProps, type TreeBranch } from './ProbabilityTree';
export {
  HundredGrid,
  tselo,
  type HundredGridProps,
  type HundredGroup,
  type GroupTone,
} from './HundredGrid';
