import { TaskCard } from '@/components/ui';
import type { ExamTask } from '@/content/tasks';
import { taskHasPage, taskHref } from '@/content/tasks';
import { bentoAll, bentoAttrs } from '@/lib/bento';
import { TaskImage } from './TaskImage';

export interface TaskGridProps {
  tasks: readonly ExamTask[];
  /**
   * Раскладка Bento: карточки разного размера, 2 колонки на телефоне,
   * 3 на планшете, 4 на компьютере (lib/bento.ts). Не задано — ровная
   * сетка, как на главной.
   */
  bento?: boolean;
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
export function TaskGrid({ tasks, bento = false }: TaskGridProps) {
  const sizes = bento ? bentoAll(tasks.length) : null;
  return (
    <ul className={sizes === null ? 'tasks-grid' : 'tasks-grid tasks-grid--bento'}>
      {tasks.map((task, i) => {
        /* Ссылка есть у открытого раздела и у неоткрытого с заглушкой. */
        const open = taskHasPage(task);
        return (
        <li key={task.no} {...(sizes === null ? {} : bentoAttrs(sizes, i))}>
          <TaskCard
            className="task-card--bank"
            number={task.no}
            title={task.name}
            href={open ? taskHref(task) : undefined}
            comingSoon={task.status !== 'ready'}
            badges={task.badges?.map((label) => ({ label, tone: 'info' as const }))}
            illustration={<TaskImage no={task.no} format={task.icon} />}
          />
        </li>
        );
      })}
    </ul>
  );
}
