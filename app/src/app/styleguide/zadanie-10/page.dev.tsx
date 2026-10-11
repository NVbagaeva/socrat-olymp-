import type { Metadata } from 'next';
import { Tex } from '@/components/ui/Tex';
import { ISKLYUCHENIYA, pravila } from '@/lib/zadanie10/bank/analogi';
import { zadachiPrototipa } from '@/lib/zadanie10/bank/index';
import { GROUPS, kodNaSayte, prototypesOfGroup } from '@/lib/zadanie10/prototypes';
import 'katex/dist/katex.min.css';
import './galereya10.css';

/* Галерея банка задания №10 — только для разработки.

   Файл называется page.dev.tsx: страницей он становится лишь в
   `next dev` или со флагом GALEREYA=1 / GALEREYA_10=1 (next.config.ts).
   В обычной сборке маршрута нет — адрес отдаёт 404, это проверяет
   scripts/check-dev-pages.mjs. Здесь видны ответы и разборы: по
   каждому прототипу — задачи ФИПИ и 20 аналогов, сверху — распределение
   ответов. */

export const metadata: Metadata = {
  title: 'Галерея банка задания №10',
  robots: { index: false, follow: false },
};

export default function GalereyaBanka10() {
  return (
    <main className="g10">
      <header>
        <h1 className="t-h1">Галерея банка задания №10</h1>
        <p className="g10__lead">
          Служебная страница: только в разработке. По каждому прототипу — задачи открытого банка
          ФИПИ и двадцать аналогов (половина — современные сюжеты), ответы и разборы — на странице
          прототипа. Аналоги помечены «не из открытого банка».
        </p>
      </header>
      {GROUPS.map((g) => (
        <section className="g10__section" key={g.id}>
          <h2 className="t-h3">
            Группа {g.id}. {g.title}
          </h2>
          <table className="g10__table">
            <thead>
              <tr>
                <th scope="col">Прототип</th>
                <th scope="col">Формула</th>
                <th scope="col">ФИПИ</th>
                <th scope="col">Аналоги</th>
                <th scope="col">Разных ответов</th>
                <th scope="col">Макс. повтор</th>
              </tr>
            </thead>
            <tbody>
              {prototypesOfGroup(g.id).map((p) => {
                const { fipi, analogi } = zadachiPrototipa(p.id);
                const otvety = new Map<number, number>();
                analogi.forEach((a) => otvety.set(a.answer, (otvety.get(a.answer) ?? 0) + 1));
                const pr = pravila(p.id);
                return (
                  <tr key={p.id} className={ISKLYUCHENIYA[p.id] ? 'g10__row--iskl' : undefined}>
                    <td>
                      <a href={`${p.id}/`}>
                        {kodNaSayte(p.id)}. {p.title}
                      </a>
                    </td>
                    <td>
                      <Tex text={`$${p.formula}$`} />
                    </td>
                    <td>{p.fipiNos ? `${fipi.length} (№ ${p.fipiNos})` : 'из курса'}</td>
                    <td>
                      {analogi.length}, совр. {analogi.filter((a) => a.modern).length}
                    </td>
                    <td>
                      {otvety.size} / ≥ {pr.minRaznyh}
                    </td>
                    <td>
                      {Math.max(0, ...otvety.values())} / ≤ {pr.maxPovtor}
                    </td>
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
