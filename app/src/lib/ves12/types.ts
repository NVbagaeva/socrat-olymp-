import type { FunctionTypeId } from '@/data/functionTypes';
import type { IkonkaRazdela } from '@/components/tasks/razdely/types';

/** Прототип — набор движка: 12.A, 12E.B … */
export interface Ves12Set {
  id: string;
  /** Название; формулы — $…$. */
  title: string;
  /** То же, набранное KaTeX на сервере. */
  titleHtml: string;
  /** Сколько задач в наборе — из манифеста. */
  count: number;
  /**
   * Сколько задач открытого банка ФИПИ. null — все задачи набора из
   * банка (прототипы банка с новыми числами): ограничения нет.
   */
  fipi: number | null;
}

export interface Ves12Type {
  id: FunctionTypeId;
  title: string;
  graphName: string;
  icon: IkonkaRazdela;
  /** Тип ещё «Скоро»: виден бледным и не выбирается. */
  soon: boolean;
  sets: Ves12Set[];
}

export interface Ves12Catalog {
  types: Ves12Type[];
}
