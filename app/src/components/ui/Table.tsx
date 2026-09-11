import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export type TableAlign = 'left' | 'right';
export type TableTrend = 'up' | 'down' | 'flat';

export interface TableColumn<T> {
  key: string;
  header: ReactNode;
  align?: TableAlign;
  /** Окраска числа по направлению изменения. Знак остаётся в тексте. */
  trend?: (row: T) => TableTrend;
  render: (row: T) => ReactNode;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  /** Заголовок таблицы для скринридера. */
  caption: string;
  className?: string;
}

const TREND: Record<TableTrend, string | null> = {
  up: 'num--up',
  down: 'num--down',
  flat: 'num--flat',
};

/** Только горизонтальные разделители, числа вправо, заголовки обычным регистром. */
export function Table<T>({ columns, rows, getRowKey, caption, className }: TableProps<T>) {
  return (
    <div className="table-scroll">
      <table className={clsx('table', className)}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className={clsx(column.align === 'right' && 'num')}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={clsx(
                    column.align === 'right' && 'num',
                    column.trend && TREND[column.trend(row)],
                  )}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
