'use client';

/* Служебная витрина этапа 2.5 задания №15: плоскости и линии их
   пересечения. Три сценария на кубе, переключатель режима (учитель
   выбирает его в редакторе задания; здесь — для проверки) и замер
   кадров перетаскивания. В меню страницы нет. */

import { useState } from 'react';
import 'katex/dist/katex.min.css';
import { Stsena15 } from '@/components/tasks/zadanie15/Stsena15';
import { type Mode, SCENARIOS } from '@/lib/zadanie15/scene';
import { typeset } from '@/lib/tex';
import '@/components/tasks/zadanie15/stsena15.css';
import './zadanie-15.css';

export default function Zadanie15Showcase() {
  const [mode, setMode] = useState<Mode>('learn');
  const [reveal, setReveal] = useState(false);
  const [fps, setFps] = useState<number | null>(null);

  return (
    <main className="s15page">
      <header className="s15page__head">
        <h1 className="t-h1">Плоскости и линии их пересечения</h1>
        <p className="s15page__lead">
          Этап 2.5 задания №15. Как только на сцене две непараллельные плоскости, линия их
          пересечения появляется сама: вспыхивают общие точки, от них линия прочерчивается до края
          рамки. Части линии за фигурой — штрихом, как на школьном чертеже.
        </p>
        <div className="s15page__modes" role="group" aria-label="Режим показа">
          <span className="s15page__modes-label">
            Режим (переключает учитель в редакторе задания):
          </span>
          <button
            type="button"
            className={['chip', mode === 'learn' ? 'is-active' : ''].join(' ')}
            onClick={() => {
              setMode('learn');
              setReveal(false);
            }}
            aria-pressed={mode === 'learn'}
          >
            Изучение
          </button>
          <button
            type="button"
            className={['chip', mode === 'train' ? 'is-active' : ''].join(' ')}
            onClick={() => {
              setMode('train');
              setReveal(false);
            }}
            aria-pressed={mode === 'train'}
          >
            Тренажёр
          </button>
          {mode === 'train' ? (
            <button
              type="button"
              className="btn btn--secondary s15page__reveal"
              onClick={() => setReveal((r) => !r)}
            >
              {reveal ? 'Скрыть линии' : 'Показать линии (после проверки)'}
            </button>
          ) : null}
          <span className="s15page__fps">
            перетаскивание: {fps === null ? '—' : Math.round(fps)} кадров/с
          </span>
        </div>
      </header>

      {SCENARIOS.map((sc, i) => (
        <section className="s15page__section" key={`${sc.id}:${mode}:${reveal ? 1 : 0}`} id={sc.id}>
          <h2 className="t-h2 s15page__title">
            <span className="s15page__no">{i + 1}</span>
            {sc.title}
          </h2>
          <p className="s15page__text" dangerouslySetInnerHTML={{ __html: typeset(sc.lead) }} />
          <Stsena15 build={sc.build} mode={mode} reveal={reveal} onFps={setFps} />
        </section>
      ))}
    </main>
  );
}
