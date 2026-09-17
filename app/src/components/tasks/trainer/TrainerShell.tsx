import type { ReactNode } from 'react';
import { trainerPage, type TrainerMode } from '@/content/trainerModes';
import { TabScrollOnMount } from '../TabScroll';
import { TrainerMenu } from './TrainerMenu';

export interface TrainerShellProps {
  /** Адрес подтемы: от него считаются адреса режимов. */
  base: string;
  /** Выбранный режим. Пусто — тип ещё не выбран. */
  mode: TrainerMode | null;
  /** Экран режима: список заданий или итог подхода. */
  children?: ReactNode;
}

/**
 * Постоянная часть вкладки «Тренажёр».
 *
 * Заголовок и строка выбора типа видны на любом экране вкладки —
 * и до выбора, и внутри режима. Шапку темы и ленту вкладок рисует
 * страница темы: вкладка живёт внутри них, а не вместо них.
 */
export function TrainerShell({ base, mode, children }: TrainerShellProps) {
  return (
    <section className="trainer">
      <header className="trainer__head">
        <h2 className="t-h2 trainer__title">{trainerPage.title}</h2>
      </header>

      <TrainerMenu base={`${base}/trenazher/`} mode={mode} />

      {/* На телефоне выбранный режим оказывается ниже кромки экрана:
          подводим его к глазам, как во вкладке подготовки. */}
      <TabScrollOnMount />

      {children}
    </section>
  );
}
