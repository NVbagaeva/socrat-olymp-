import Link from 'next/link';
import { TaskGrid } from '@/components/tasks';
import { landing } from '@/content/landing';
import { tasks, tasksPage } from '@/content/tasks';

const { bank } = landing;

/**
 * Банк заданий на главной.
 *
 * Те же карточки и тот же конфиг, что на странице банка: второго списка
 * заданий в проекте нет. Отличий от страницы два — здесь нет поиска,
 * а под сеткой стоит переход в сам раздел.
 */
export function BankSection() {
  return (
    <section className="band" id="bank">
      <div className="wrap">
        <div className="band__head">
          <h2>{bank.title}</h2>
          <p>{bank.lead}</p>
        </div>

        <TaskGrid tasks={tasks} />

        <p className="bank-note">{bank.note}</p>

        <Link className="btn btn--primary bank-more" href={tasksPage.href}>
          Открыть банк заданий
        </Link>
      </div>
    </section>
  );
}
