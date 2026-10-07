import type { ExamTask } from '@/content/tasks';
import { taskPart, taskParts, tasks as allTasks } from '@/content/tasks';
import { TaskGrid, type TaskGridProps } from './TaskGrid';

export interface TaskPartsProps extends Pick<TaskGridProps, 'openInDialog'> {
  tasks: readonly ExamTask[];
  /** Уровень заголовка блока: h2 на странице банка, h3 внутри секции главной. */
  headingLevel?: 2 | 3;
}

/** «01–13»: первый и последний номер блока. Один номер — без тире. */
function range(list: readonly ExamTask[]): string {
  const first = list[0]?.no ?? '';
  const last = list[list.length - 1]?.no ?? '';
  return first === last ? first : `${first}–${last}`;
}

/**
 * Банк заданий по частям экзамена: «Часть 1» и «Часть 2», у каждой
 * своя сетка. Задания раскладываются по полю part из content/tasks.ts;
 * пустая часть (например, при поиске) не показывается вовсе.
 */
export function TaskParts({ tasks, openInDialog, headingLevel = 2 }: TaskPartsProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <div className="task-parts">
      {taskParts.map((part) => {
        const list = tasks.filter((task) => taskPart(task) === part.part);
        if (list.length === 0) {
          return null;
        }
        const headingId = `task-part-${part.part}`;
        return (
          <section key={part.part} className="task-part" aria-labelledby={headingId}>
            <div className="task-part__head">
              <Heading id={headingId} className="t-h4 task-part__title">
                {part.title}
              </Heading>
              <p className="task-part__lead">
                {/* Диапазон — по всему конфигу, а не по найденному:
                    поиск сужает сетку, но не подпись части. */}
                Задания {range(allTasks.filter((task) => taskPart(task) === part.part))} ·{' '}
                {part.lead}
              </p>
            </div>
            <TaskGrid tasks={list} {...(openInDialog !== undefined ? { openInDialog } : {})} />
          </section>
        );
      })}
    </div>
  );
}
