import type { Metadata } from 'next';
import { Tex } from '@/components/ui/Tex';
import { ISKLYUCHENIYA, pravila } from '@/lib/zadanie6/bank/analogi';
import { zadachiPrototipa } from '@/lib/zadanie6/bank/index';
import { GROUPS, kodNaSayte, prototypesOfGroup } from '@/lib/zadanie6/prototypes';
import 'katex/dist/katex.min.css';
import './galereya6.css';

/* Галерея банка задания №6 — только для разработки.

   Файл называется page.dev.tsx: страницей он становится лишь в
   `next dev` или со флагом GALEREYA=1 / GALEREYA_6=1 (next.config.ts).
   В обычной сборке маршрута нет — адрес отдаёт 404, это проверяет
   scripts/check-dev-pages.mjs. Здесь видны ответы и разборы: по
   каждому прототипу — исходные задачи и 50 аналогов (30 в стиле ФИПИ и
   20 сюжетных), сверху — распределение ответов. */

export const metadata: Metadata = {
  title: 'Галерея банка задания №6',
  robots: { index: false, follow: false },
};

export default function GalereyaBanka6() {
  return (
    <main className="g6">
      <header>
        <h1 className="t-h1">Галерея банка задания №6</h1>
        <p className="g6__lead">
          Служебная страница: только в разработке. По каждому прототипу — исходные задачи стороннего
          банка (образцы, «не из открытого банка»), задача демоверсии ФИПИ и пятьдесят аналогов: 30
          в стиле ФИПИ и 20 сюжетных. Ответы, рисунки, разборы и подсказки — на странице прототипа.
        </p>
      </header>
      {GROUPS.map((g) => (
        <section className="g6__section" key={g.id}>
          <h2 className="t-h3">
            Группа {g.id}. {g.title}
          </h2>
          <table className="g6__table">
            <thead>
              <tr>
                <th scope="col">Прототип</th>
                <th scope="col">Что спрашивают</th>
                <th scope="col">Исходные</th>
                <th scope="col">Аналоги (сюжетных)</th>
                <th scope="col">Разных ответов</th>
                <th scope="col">Макс. повтор</th>
              </tr>
            </thead>
            <tbody>
              {prototypesOfGroup(g.id).map((p) => {
                const { istochniki, analogi } = zadachiPrototipa(p.id);
                const otvety = new Map<number, number>();
                analogi.forEach((a) => otvety.set(a.answer, (otvety.get(a.answer) ?? 0) + 1));
                const pr = pravila(p.id);
                return (
                  <tr key={p.id} className={ISKLYUCHENIYA[p.id] ? 'g6__row--iskl' : undefined}>
                    <td>
                      <a href={`${p.id}/`}>
                        {kodNaSayte(p.id)}. <Tex text={p.title} />
                      </a>
                    </td>
                    <td>
                      <Tex text={p.formula} />
                    </td>
                    <td>
                      {istochniki.length} ({p.istochnik})
                    </td>
                    <td>
                      {analogi.length} ({analogi.filter((a) => a.stil === 'syuzhet').length})
                    </td>
                    <td>
                      {otvety.size} / ≥ {pr.minRaznyh}
                    </td>
                    <td className="g6__stat">
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
