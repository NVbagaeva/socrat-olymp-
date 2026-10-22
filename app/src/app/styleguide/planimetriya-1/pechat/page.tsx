'use client';

import { useEffect } from 'react';
import { Chertezh } from '@/components/tasks/planimetriya/Chertezh';
import { Tex } from '@/components/ui/Tex';
import { POROG } from '@/lib/planimetriya/figury';
import { PROTOTIPY } from '@/lib/planimetriya/stseny';
import type { Params } from '@/lib/planimetriya/stseny/dsl';
import '@/lib/sheet/theme.css';
import 'katex/dist/katex.min.css';
import '@/lib/planimetriya/planimetriya.css';
import '../planimetriya-1.css';

/* Витрина движка №1 в ч/б теме печати.

   Тема печатного листа выбирается атрибутом на <html>, как у листов
   генераторов: своих «печатных» цветов у движка нет — линии, искомое
   и подсказки чернеют через токены и различаются толщиной, пунктиром
   и штриховкой. Слева рисунок листа ученика, справа — листа учителя. */

export default function PlanimetriyaPechatPage() {
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.dataset.sheetTheme;
    root.dataset.sheetTheme = 'print';
    return () => {
      if (prev === undefined) delete root.dataset.sheetTheme;
      else root.dataset.sheetTheme = prev;
    };
  }, []);

  return (
    <main className="pl1">
      <header>
        <h1 className="t-h1">Чертежи задания №1 — ч/б печать</h1>
        <p className="pl1__lead">
          Тема печати (data-sheet-theme=&quot;print&quot;): всё чёрное; искомое — толще и с заливкой
          сектора, построения учителя — пунктиром и тоньше основных линий, площади — штриховкой.
        </p>
      </header>
      <section className="pl1__section">
        <div className="pl1__grid">
          {PROTOTIPY.map((x) => {
            const params = x.primer as Params;
            const scena = x.stsena(params, POROG);
            return (
              <figure className="pl1__card" key={x.id}>
                <Tex text={`${x.id}. ${x.uslovie(params)}`} className="pl1__uslovie" />
                <div className="pl1__para">
                  <Chertezh scena={scena} />
                  <Chertezh scena={scena} optsii={{ rezhim: { rezhim: 'uchitel' } }} />
                </div>
              </figure>
            );
          })}
        </div>
      </section>
    </main>
  );
}
