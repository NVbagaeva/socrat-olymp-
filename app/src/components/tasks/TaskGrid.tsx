import { TaskCard } from '@/components/ui';
import type { ExamTask } from '@/content/tasks';
import { tasksPage } from '@/content/tasks';
import { TaskImage } from './TaskImage';

export interface TaskGridProps {
  tasks: readonly ExamTask[];
  /**
   * Задание, которое открывается не переходом, а обработчиком: на
   * странице банка карточка вызывает окно выбора подтемы и потому
   * становится кнопкой. Не задано — все карточки ссылки, как на
   * главной.
   */
  openInDialog?: {
    slug: string;
    /** Второй аргумент — сама карточка: от неё считается место окна. */
    onOpen: (task: ExamTask, card: HTMLElement) => void;
  };
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
export function TaskGrid({ tasks, openInDialog }: TaskGridProps) {
  return (
    <ul className="tasks-grid">
      {tasks.map((task) => {
        const open = task.status === 'active';
        const byHandler = open && openInDialog?.slug === task.slug;
        return (
        <li key={task.no}>
          <TaskCard
            className="task-card--bank"
            number={task.no}
            title={task.name}
            href={open && !byHandler ? `${tasksPage.href}/${task.slug}` : undefined}
            {...(byHandler && openInDialog !== undefined
              ? { onClick: (event) => openInDialog.onOpen(task, event.currentTarget) }
              : {})}
            comingSoon={task.status !== 'active'}
            difficulty={task.badge}
            difficultyTone="info"
            illustration={<TaskImage no={task.no} />}
          />
        </li>
        );
      })}
    </ul>
  );
}
