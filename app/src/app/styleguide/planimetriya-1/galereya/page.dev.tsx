import type { Metadata } from 'next';
import { Chertezh } from '@/components/tasks/planimetriya/Chertezh';
import { Tex } from '@/components/ui/Tex';
import { analogi, iskluchenieAnalogov } from '@/lib/planimetriya/bank/analogi';
import { zadachiPrototipa } from '@/lib/planimetriya/bank/fipi';
import { POROG } from '@/lib/planimetriya/figury';
import { PROTOTIPY } from '@/lib/planimetriya/stseny';
import { chislo, type Params } from '@/lib/planimetriya/stseny/dsl';
import 'katex/dist/katex.min.css';
import '@/lib/planimetriya/planimetriya.css';
import '../planimetriya-1.css';
import './galereya.css';

/* Галерея банка задания №1 — только для разработки.

   Файл называется page.dev.tsx: страницей он становится лишь в
   `next dev` или со флагом GALEREYA_1=1 (next.config.ts). В обычной
   сборке маршрута нет — адрес отдаёт 404, это проверяет
   scripts/check-galereya-1.mjs. Здесь видны ответы: по каждому
   прототипу — задачи открытого банка и двадцать аналогов сеткой,
   под каждым рисунком ответ, сверху — распределение ответов. */

export const metadata: Metadata = {
  title: 'Галерея банка задания №1',
  robots: { index: false, follow: false },
};

const OPT = { chisla: true, shirina: 170, vysota: 120 };

export default function GalereyaBanka1() {
  return (
    <main className="pl1 g1">
      <header className="pl1__head">
        <h1 className="t-h1">Галерея банка задания №1</h1>
        <p className="pl1__lead">
          Служебная страница: только в разработке. По каждому прототипу — задачи открытого банка и
          двадцать аналогов, под рисунком — ответ. Рисунки — как на листе ученика, с числами
          условия.
        </p>
        <nav className="pl1__toc" aria-label="Прототипы">
          {PROTOTIPY.map((p) => (
            <a key={p.id} href={`#g${p.id}`}>
              {p.id}
            </a>
          ))}
        </nav>
      </header>
      {PROTOTIPY.map((p) => {
        const fipi = zadachiPrototipa(p.id);
        const an = analogi(p.id);
        const otvety = new Map<number, number>();
        for (const a of an) {
          const o = p.otvet(a.params);
          otvety.set(o, (otvety.get(o) ?? 0) + 1);
        }
        const iskl = iskluchenieAnalogov(p.id, an);
        return (
          <section className="pl1__section" id={`g${p.id}`} key={p.id}>
            <h2 className="t-h3">
              {p.id}. <Tex text={p.nazvanie} />
            </h2>
            <p className="g1__stat">
              Аналогов {an.length}, различных ответов {otvety.size}, чаще всего ответ встречается{' '}
              {Math.max(0, ...otvety.values())} раз.
              {iskl === null ? null : <b className="g1__iskl"> Исключение: {iskl}.</b>}
            </p>
            {fipi.length === 0 ? null : (
              <>
                <h3 className="g1__sub">Открытый банк</h3>
                <ul className="g1__grid">
                  {fipi.map((z) => {
                    const params = { ...p.primer, ...z.params } as Params;
                    return (
                      <li className="g1__item" key={z.n}>
                        <Chertezh scena={p.stsena(params, POROG)} optsii={OPT} />
                        <span className="g1__otvet">
                          №{z.n}: <b>{chislo(p.otvet(params))}</b>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
            <h3 className="g1__sub">Аналоги</h3>
            <ul className="g1__grid">
              {an.map((a) => (
                <li className="g1__item" key={a.no}>
                  <Chertezh scena={p.stsena(a.params, POROG)} optsii={OPT} />
                  <span className="g1__otvet">
                    {a.no}: <b>{chislo(p.otvet(a.params))}</b>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
