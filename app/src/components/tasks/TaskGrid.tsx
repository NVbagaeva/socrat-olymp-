import { TaskCard } from '@/components/ui';
import type { ExamTask } from '@/content/tasks';
import { tasksPage } from '@/content/tasks';
import { TaskImage } from './TaskImage';

export interface TaskGridProps {
  tasks: readonly ExamTask[];
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
export function TaskGrid({ tasks }: TaskGridProps) {
  return (
    <ul className="tasks-grid">
      {tasks.map((task) => (
        <li key={task.no}>
          <TaskCard
            className="task-card--bank"
            number={task.no}
            title={task.name}
            href={task.status === 'active' ? `${tasksPage.href}/${task.slug}` : undefined}
            comingSoon={task.status !== 'active'}
            difficulty={task.badge}
            difficultyTone="info"
            illustration={<TaskImage no={task.no} />}
          />
        </li>
      ))}
    </ul>
  );
}
