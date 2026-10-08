import Link from 'next/link';
import { TaskGrid } from '@/components/tasks';
import { landing } from '@/content/landing';
import { openTasksOfPart, tasksOfPart, tasksPage } from '@/content/tasks';

const { bank } = landing;

/**
 * Банк заданий на главной.
 *
 * Те же карточки и тот же конфиг, что на странице банка: второго списка
 * заданий в проекте нет. Отличий от страницы два — здесь нет поиска,
 * а под сеткой стоит переход в сам раздел.
 */
export function BankSection() {
  const part1 = tasksOfPart(1);
  const opened = bank.opened
    .replace('{open}', String(openTasksOfPart(1)))
    .replace('{all}', String(part1.length));

  return (
    <section className="band" id="bank" aria-labelledby="bank-title">
      <div className="wrap">
        <div className="band__head">
          <h2 id="bank-title">{bank.title}</h2>
          <p>{bank.lead}</p>
          {/* Единственное число блока — считается из конфига заданий. */}
          <p className="band__caption">{opened}</p>
        </div>

        {/* На главной — первая часть, как и раньше; вторая часть
            и переключатель живут на странице банка. */}
        <TaskGrid tasks={part1} />

        <p className="bank-note">{bank.note}</p>

        <Link className="btn btn--primary bank-more" href={tasksPage.href}>
          {bank.action}
        </Link>
      </div>
    </section>
  );
}
