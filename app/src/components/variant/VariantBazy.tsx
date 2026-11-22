import Link from 'next/link';
import { OTMETKI } from '@/content/baza/shkala';
import { VARIANT_BAZY as B } from '@/content/baza/variant';
import { taskHref, tasksOf } from '@/content/tasks';
import { levelInfo } from '@/lib/level';

/**
 * Сборщик варианта в режиме базы: формат экзамена, шкала перевода
 * баллов в отметку и состав — какие из 21 задания уже есть в банке.
 * Вариант собирается только из готовых заданий: пока их нет, экран
 * честно говорит об этом, а не показывает пустой лист.
 */
export function VariantBazy() {
  const tasks = tasksOf('base');
  const ready = tasks.filter((task) => task.status === 'ready');
  return (
    <div className="var var--steklo var-baza">
      <section className="var-panel var-baza__sostav" aria-labelledby="var-baza-sostav">
        <h2 id="var-baza-sostav" className="var-sostav__title">
          {B.sostav.title}
        </h2>
        <p className="var-baza__gotovo">{B.sostav.gotovo(ready.length, tasks.length)}</p>
        <ol className="var-baza__nomera">
          {tasks.map((task) => (
            <li key={task.no} className={task.status === 'ready' ? 'is-ready' : undefined}>
              <Link href={taskHref(task)}>
                <span className="var-baza__no">{Number(task.no)}</span>
                <span className="var-baza__name">{task.shortTitle ?? task.name}</span>
                {task.status === 'ready' ? null : (
                  <span className="var-baza__soon">{B.sostav.soon}</span>
                )}
              </Link>
            </li>
          ))}
        </ol>
        {ready.length < tasks.length ? <p className="var-baza__note">{B.sostav.pusto}</p> : null}
        <Link className="btn btn--secondary" href={levelInfo('base').bank}>
          {B.sostav.kBanku}
        </Link>
      </section>

      <div className="var-baza__sprava">
        <section className="var-panel" aria-labelledby="var-baza-format">
          <h2 id="var-baza-format" className="var-sostav__title">
            {B.format.title}
          </h2>
          <dl className="var-baza__format">
            {B.format.rows.map(([name, text]) => (
              <div key={name}>
                <dt>{name}</dt>
                <dd>{text}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="var-panel" aria-labelledby="var-baza-shkala">
          <h2 id="var-baza-shkala" className="var-sostav__title">
            {B.shkala.title}
          </h2>
          <table className="var-baza__shkala">
            <thead>
              <tr>
                <th scope="col">{B.shkala.ball}</th>
                <th scope="col">{B.shkala.otmetka}</th>
              </tr>
            </thead>
            <tbody>
              {OTMETKI.map((row) => (
                <tr key={row.otmetka}>
                  <td>
                    {row.ot}–{row.do}
                  </td>
                  <td>«{row.otmetka}»</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
