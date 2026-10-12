import type { Metadata } from 'next';
import { Tex } from '@/components/ui/Tex';
import { ISKLYUCHENIYA, pravila } from '@/lib/zadanie7/bank/analogi';
import { zadachiPrototipa } from '@/lib/zadanie7/bank/index';
import { GROUPS, kodNaSayte, prototypesOfGroup } from '@/lib/zadanie7/prototypes';
import 'katex/dist/katex.min.css';
import './galereya7.css';

/* Галерея банка задания №7 — только для разработки.

   Файл называется page.dev.tsx: страницей он становится лишь в
   `next dev` или со флагом GALEREYA=1 / GALEREYA_7=1 (next.config.ts).
   В обычной сборке маршрута нет — адрес отдаёт 404, это проверяет
   scripts/check-dev-pages.mjs. Здесь видны ответы и разборы: по
   каждому прототипу — задачи ФИПИ и 20 аналогов, сверху — распределение
   ответов и сколько аналогов с посторонним корнем. */

export const metadata: Metadata = {
  title: 'Галерея банка задания №7',
  robots: { index: false, follow: false },
};

export default function GalereyaBanka7() {
  return (
    <main className="g7">
      <header>
        <h1 className="t-h1">Галерея банка задания №7</h1>
        <p className="g7__lead">
          Служебная страница: только в разработке. По каждому прототипу — задачи открытого банка
          ФИПИ и двадцать аналогов; ответы, разборы и подсказки — на странице прототипа. Аналоги
          помечены «не из открытого банка».
        </p>
      </header>
      {GROUPS.map((g) => (
        <section className="g7__section" key={g.id}>
          <h2 className="t-h3">
            Группа {g.id}. {g.title}
          </h2>
          <table className="g7__table">
            <thead>
              <tr>
                <th scope="col">Прототип</th>
                <th scope="col">Общий вид</th>
                <th scope="col">ФИПИ</th>
                <th scope="col">Аналоги</th>
                <th scope="col">Разных ответов</th>
                <th scope="col">Макс. повтор</th>
                <th scope="col">С посторонним корнем</th>
              </tr>
            </thead>
            <tbody>
              {prototypesOfGroup(g.id).map((p) => {
                const { fipi, analogi } = zadachiPrototipa(p.id);
                const otvety = new Map<number, number>();
                analogi.forEach((a) => otvety.set(a.answer, (otvety.get(a.answer) ?? 0) + 1));
                const post = analogi.filter((a) => p.solve(a.params).postoronnie.length > 0).length;
                const pr = pravila(p.id);
                return (
                  <tr key={p.id} className={ISKLYUCHENIYA[p.id] ? 'g7__row--iskl' : undefined}>
                    <td>
                      <a href={`${p.id}/`}>
                        {kodNaSayte(p.id)}. <Tex text={p.title} />
                      </a>
                    </td>
                    <td>
                      <Tex text={`$${p.formula}$`} />
                    </td>
                    <td>{p.fipiNos ? `${fipi.length} (${p.fipiNos})` : 'нет в источниках'}</td>
                    <td>{analogi.length}</td>
                    <td>
                      {otvety.size} / ≥ {pr.minRaznyh}
                    </td>
                    <td>
                      {Math.max(0, ...otvety.values())} / ≤ {pr.maxPovtor}
                    </td>
                    <td>{post > 0 ? post : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ))}
    </main>
  );
}
