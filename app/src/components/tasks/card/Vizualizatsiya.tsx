import {
  CircularRatio,
  CoordinateLine,
  HundredGrid,
  OutcomeGrid,
  OutcomeTiles,
  ProbabilityTree,
  tselo,
  type HighlightMode,
  type RisunokState,
} from '@/components/probability';
import type { ReactNode } from 'react';
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

/** Число по-русски: запятая, без хвостовых нулей, не больше двух знаков. */
function chislo(value: number): string {
  return String(Math.round(value * 100) / 100).replace('.', ',');
}

/** Листья дерева: ветки, из которых ничего не растёт. */
function listya(branches: readonly { id: string; parent: string | null }[]): number {
  const roditeli = new Set(branches.map((b) => b.parent));
  return branches.filter((b) => !roditeli.has(b.id)).length;
}

/**
 * Подпись над рисунком — формулировки автора, числа из параметров.
 *
 * До ответа в подписи только то, что есть в условии: всего исходов,
 * пар, длина отрезка. Благоприятное появляется вместе с подсветкой,
 * то есть вместе с решением, — иначе подпись выдавала бы ответ.
 */
export function podpisRisunka(parametry: Parametry, podsvetka?: Podsvetka): ReactNode {
  switch (parametry.method) {
    case 'direct-count': {
      const counts = parametry.counts;
      const n = (counts ?? parametry.outcomes.map(() => 1)).reduce((s, c) => s + c, 0);
      if (podsvetka?.method !== 'direct-count') {
        return `Все исходы: ${n} ${counts === undefined ? 'плиток' : 'объектов'}`;
      }
      const m = podsvetka.favorable.reduce((s, i) => s + (counts?.[i] ?? 1), 0);
      return `Все исходы: ${n}, благоприятные — ${m}`;
    }
    case 'outcome-table': {
      const n = parametry.rows * parametry.columns;
      return podsvetka?.method === 'outcome-table'
        ? `Все пары: ${n}, благоприятные — ${podsvetka.favorableCells.length}`
        : `Все пары: ${n} клеток`;
    }
    case 'coordinate-line': {
      const otkryto = podsvetka?.method === 'coordinate-line';
      if (parametry.shape === 'segment') {
        const L = parametry.max - parametry.min;
        const l = (parametry.d ?? parametry.max) - parametry.c;
        return otkryto ? (
          <>
            Весь отрезок <i>L</i> = {chislo(L)}, благоприятный <i>l</i> = {chislo(l)}
          </>
        ) : (
          <>
            Весь отрезок: <i>L</i> = {chislo(L)}
          </>
        );
      }
      if (parametry.shape === 'arc') {
        const { divisions, from, to } = parametry;
        const dolya = (to - from + divisions) % divisions;
        return otkryto ? (
          <>
            Вся фигура <i>S</i> = {divisions} долей, благоприятная <i>s</i> = {dolya}
          </>
        ) : (
          <>
            Вся фигура: <i>S</i> = {divisions} долей
          </>
        );
      }
      const ed = parametry.unit === undefined ? '' : ` ${parametry.unit}`;
      return otkryto ? (
        <>
          Вся фигура <i>S</i> = {chislo(parametry.total)}
          {ed}, благоприятная <i>s</i> = {chislo(parametry.favorable)}
          {ed}
        </>
      ) : (
        <>
          Вся фигура: <i>S</i> = {chislo(parametry.total)}
          {ed}
        </>
      );
    }
    case 'probability-tree': {
      const putey = listya(parametry.branches);
      return podsvetka?.method === 'probability-tree'
        ? `Все пути: ${putey}, подходящие — ${podsvetka.highlightedPaths.length}`
        : `Все пути: ${putey}`;
    }
    case 'convenient-number': {
      const vsego = parametry.baseNumber;
      if (podsvetka?.method !== 'convenient-number') {
        return `Всего ${tselo(vsego)}`;
      }
      const gruppy = podsvetka.highlightedGroups ?? [podsvetka.highlightedGroup];
      const shtuki = gruppy.map((i) => Math.round((parametry.groups[i]?.share ?? 0) * vsego));
      if (shtuki.length === 1) {
        return `Всего ${tselo(vsego)}, нужная группа — ${tselo(shtuki[0] ?? 0)}`;
      }
      const summa = shtuki.reduce((s, m) => s + m, 0);
      return `Всего ${tselo(vsego)}, нужные группы — ${shtuki.map(tselo).join(' + ')} = ${tselo(summa)}`;
    }
    /* «Формула»: рисунка нет, подписи тоже. */
    case 'formula':
      return '';
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
            ? {
                highlightedGroup: podsvetka.highlightedGroup,
                ...(podsvetka.highlightedGroups === undefined
                  ? {}
                  : { highlightedGroups: podsvetka.highlightedGroups }),
              }
            : {})}
          showConversion={otkryto}
          state={state}
          {...(className === undefined ? {} : { className })}
        />
      );
    /* Метод «Формула» решается шагами: рисунка у него нет, и карточка
       не отводит под него колонку (см. ProblemCard). */
    case 'formula':
      return null;
    default:
      return null;
  }
}
