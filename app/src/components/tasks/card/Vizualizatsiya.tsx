import {
  CircularRatio,
  CoordinateLine,
  HundredGrid,
  OutcomeGrid,
  OutcomeTiles,
  ProbabilityTree,
  type HighlightMode,
  type RisunokState,
} from '@/components/probability';
import type { Parametry, Podsvetka } from '@/lib/veroyatnost/model';

/**
 * Рисунок задачи по её модели.
 *
 * Поле `method` параметров выбирает компонент; подсветка благоприятного
 * приходит отдельно и только после ответа — до него рисунок показывает
 * лишь то, что есть в условии. Это единственное место, где модель
 * встречается с компонентами: карточка про конкретные рисунки не знает.
 */

export interface VizualizatsiyaProps {
  parametry: Parametry;
  /** Подсветка благоприятного: есть — значит, ответ уже показан. */
  podsvetka?: Podsvetka;
  state?: RisunokState;
  className?: string;
}

/** Подпись над рисунком: до ответа — только то, что в условии. */
export function podpisRisunka(parametry: Parametry, podsvetka?: Podsvetka): string {
  switch (parametry.method) {
    case 'direct-count': {
      const counts = parametry.counts;
      const n = (counts ?? parametry.outcomes.map(() => 1)).reduce((s, c) => s + c, 0);
      const vsego = counts === undefined ? `${n} плиток` : `${n}, плитка — группа`;
      if (podsvetka?.method !== 'direct-count') {
        return `Все исходы: ${vsego}`;
      }
      const m = podsvetka.favorable.reduce((s, i) => s + (counts?.[i] ?? 1), 0);
      return `Все исходы: ${vsego}, благоприятные — ${m}`;
    }
    case 'outcome-table': {
      const osnova = `Таблица ${parametry.rows}×${parametry.columns}, в клетке — пара исходов`;
      return podsvetka?.method === 'outcome-table'
        ? `${osnova}; подсвечены благоприятные клетки`
        : osnova;
    }
    case 'coordinate-line':
      if (parametry.shape === 'segment') {
        return `Отрезок [${parametry.min}; ${parametry.max}]: x > ${parametry.c} сверху вправо${
          parametry.d === undefined ? '' : `, x < ${parametry.d} снизу влево`
        }`;
      }
      if (parametry.shape === 'arc') {
        return `Круг из ${parametry.divisions} равных долей; благоприятная дуга — сектор`;
      }
      return 'Вся фигура и благоприятная часть: радиус по площади';
    case 'probability-tree':
      return podsvetka?.method === 'probability-tree'
        ? 'Подходящие пути подсвечены; под деревом — произведения и сумма'
        : `Дерево сверху вниз: ${parametry.levels.length} ${parametry.levels.length === 1 ? 'уровень' : 'уровня'}`;
    case 'convenient-number':
      return `${parametry.baseNumber} объектов сеткой 10×10: доли видны как клетки`;
    default:
      return '';
  }
}

export function Vizualizatsiya({
  parametry,
  podsvetka,
  state = 'default',
  className,
}: VizualizatsiyaProps) {
  const otkryto = podsvetka !== undefined;
  const highlightMode: HighlightMode = otkryto ? 'answer' : 'condition';

  switch (parametry.method) {
    case 'direct-count':
      return (
        <OutcomeTiles
          outcomes={parametry.outcomes}
          {...(parametry.counts === undefined ? {} : { counts: parametry.counts })}
          {...(parametry.groups === undefined ? {} : { groups: parametry.groups })}
          {...(parametry.columns === undefined ? {} : { columns: parametry.columns })}
          {...(podsvetka?.method === 'direct-count' ? { favorable: podsvetka.favorable } : {})}
          showCounts={otkryto}
          state={state}
          {...(className === undefined ? {} : { className })}
        />
      );
    case 'outcome-table':
      return (
        <OutcomeGrid
          rows={parametry.rows}
          columns={parametry.columns}
          {...(parametry.rowLabels === undefined ? {} : { rowLabels: parametry.rowLabels })}
          {...(parametry.columnLabels === undefined
            ? {}
            : { columnLabels: parametry.columnLabels })}
          {...(parametry.rowTitle === undefined ? {} : { rowTitle: parametry.rowTitle })}
          {...(parametry.columnTitle === undefined ? {} : { columnTitle: parametry.columnTitle })}
          cellContent={(r, c) => parametry.cells[r]?.[c] ?? ''}
          {...(podsvetka?.method === 'outcome-table'
            ? { favorableCells: podsvetka.favorableCells }
            : {})}
          showCounts={otkryto}
          state={state}
          {...(className === undefined ? {} : { className })}
        />
      );
    case 'coordinate-line':
      if (parametry.shape === 'segment') {
        return (
          <CoordinateLine
            min={parametry.min}
            max={parametry.max}
            c={parametry.c}
            {...(parametry.d === undefined ? {} : { d: parametry.d })}
            leftBoundary={parametry.leftBoundary}
            rightBoundary={parametry.rightBoundary}
            {...(parametry.unit === undefined ? {} : { unit: parametry.unit })}
            showLength={otkryto}
            highlightMode={highlightMode}
            state={state}
            {...(className === undefined ? {} : { className })}
          />
        );
      }
      if (parametry.shape === 'arc') {
        return (
          <CircularRatio
            mode="arc"
            divisions={parametry.divisions}
            from={parametry.from}
            to={parametry.to}
            showLength={otkryto}
            highlightMode={highlightMode}
            state={state}
            {...(className === undefined ? {} : { className })}
          />
        );
      }
      return (
        <CircularRatio
          mode="area"
          total={parametry.total}
          favorable={parametry.favorable}
          {...(parametry.unit === undefined ? {} : { unit: parametry.unit })}
          showLength={otkryto}
          highlightMode={highlightMode}
          state={state}
          {...(className === undefined ? {} : { className })}
        />
      );
    case 'probability-tree':
      return (
        <ProbabilityTree
          levels={parametry.levels}
          branches={parametry.branches}
          {...(podsvetka?.method === 'probability-tree'
            ? { highlightedPaths: podsvetka.highlightedPaths }
            : {})}
          showProducts={otkryto}
          showSum={otkryto}
          state={state}
          {...(className === undefined ? {} : { className })}
        />
      );
    case 'convenient-number':
      return (
        <HundredGrid
          baseNumber={parametry.baseNumber}
          groups={parametry.groups}
          {...(parametry.unit === undefined ? {} : { unit: parametry.unit })}
          {...(podsvetka?.method === 'convenient-number'
            ? { highlightedGroup: podsvetka.highlightedGroup }
            : {})}
          showConversion={otkryto}
          state={state}
          {...(className === undefined ? {} : { className })}
        />
      );
    default:
      return null;
  }
}
