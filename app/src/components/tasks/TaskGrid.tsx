import { TaskCard } from '@/components/ui';
import type { ExamTask } from '@/content/tasks';
import { taskHasPage, taskHref, taskIconNo } from '@/content/tasks';
import { TaskImage } from './TaskImage';

export interface TaskGridProps {
  tasks: readonly ExamTask[];
  /**
   * Сетка банка заданий: 2 колонки на телефоне, 3 на планшете, 4 на
   * компьютере, карточки одного размера. Не задано — колонки по
   * доступной ширине, как на главной.
   */
  bank?: boolean;
  /**
   * Прогресс по разделам: номер хранения раздела → полоса и подпись на
   * карточке (lib/karta, useProgressBanka). Нет записи — карточка без
   * прогресса.
   */
  progress?: ReadonlyMap<number, { dolya: number; podpis: string; gotovo: boolean }>;
}

/**
 * Сетка карточек банка заданий.
 *
 * Один компонент на весь проект: и страница банка, и блок на главной
 * показывают одни и те же карточки из одного конфига. Второго списка
 * заданий в проекте быть не должно.
 *
 * Число колонок компонент не задаёт: сетка считает его от доступной
 * ширины, поэтому в разделе с сайдбаром колонок меньше, чем на главной,
 * без единого условия в коде.
 */
export function TaskGrid({ tasks, bank = false, progress }: TaskGridProps) {
  return (
    <ul className={bank ? 'tasks-grid tasks-grid--bank' : 'tasks-grid'}>
      {tasks.map((task) => {
        /* Ссылка есть у открытого раздела и у неоткрытого с заглушкой. */
        const open = taskHasPage(task);
        return (
          <li key={task.no}>
            <TaskCard
              className="task-card--bank"
              number={task.no}
              title={task.name}
              href={open ? taskHref(task) : undefined}
              comingSoon={task.status !== 'ready'}
              progress={task.hranenie === undefined ? undefined : progress?.get(task.hranenie)}
              badges={task.badges?.map((label) => ({ label, tone: 'info' as const }))}
              /* Файл картинки — по номеру хранения раздела, а не по номеру ЕГЭ
                 (taskIconNo): номер задания может смениться. */
              illustration={
                taskIconNo(task) === null ? undefined : (
                  <TaskImage no={taskIconNo(task) ?? task.no} format={task.icon} />
                )
              }
            />
          </li>
        );
      })}
    </ul>
  );
}
