/**
 * Карточка задачи — общий переиспользуемый слой (раздел 05 референса).
 *
 * Стили подключаются отдельно: `@/components/tasks/card/problem-card.css`,
 * а формулам нужен `katex/dist/katex.min.css` на странице.
 */

export {
  ProblemCard,
  type ProblemCardProps,
  type ProblemCardZadacha,
  type CardState,
} from './ProblemCard';
export { Vizualizatsiya, podpisRisunka, type VizualizatsiyaProps } from './Vizualizatsiya';
