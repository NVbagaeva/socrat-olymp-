import Link from 'next/link';
import { Tex } from '@/components/ui/Tex';
import { ZADANIE18 } from '@/content/zadanie18';
import { OPORNYE_18, OPORNYE_18_UI } from '@/content/zadanie18/opornye';
import { GRUPPY_18 } from '@/content/zadanie18/tipy';
import { ZADANIYA } from '@/lib/paths';
import { OpornayaMini18 } from './OpornayaMini18';
import { SchetchikOpornyh18, StatusOpornoy18 } from './ProgressOpornyh18';

const BASE = `${ZADANIYA}/${ZADANIE18.slug}`;

/**
 * Вкладка «Опорные задачи» №18: вводный абзац и плитки задач по темам
 * ключевых схем. Плитка ведёт на страницу задачи: чертёж, схемы,
 * решение по шагам.
 */
export function Opornye18({ vkladka }: { vkladka: string }) {
  return (
    <section className="z18-op-spisok" aria-labelledby="z18-op-title">
      <h2 id="z18-op-title" className="t-h2 vtab__title">
        {vkladka}
      </h2>
      <p className="z18-op-spisok__lead">{OPORNYE_18_UI.lead}</p>
      <SchetchikOpornyh18 ids={OPORNYE_18.map((o) => o.id)} />
      <div className="z18-op-spisok__kak">
        <p className="z18-op-spisok__kak-title">{OPORNYE_18_UI.kakRabotat}</p>
        <ol className="z18-vv__shagi">
          {OPORNYE_18_UI.shagi.map((s, i) => (
            <li key={s}>
              <span className="z18-vv__shag-no">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
        <p className="z18-op-spisok__sostavleno">{OPORNYE_18_UI.sostavlenoPodrobno}</p>
      </div>

      {GRUPPY_18.map((g) => {
        const zadachi = OPORNYE_18.filter((o) => o.gruppa === g.id);
        if (zadachi.length === 0) return null;
        return (
          <div key={g.id} className="z18-gruppa">
            <h3 className="z18-gruppa__title">{g.title}</h3>
            <ul className="z18-plitki">
              {zadachi.map((o) => (
                <li key={o.id} className="z18-plitka">
                  <Link className="z18-plitka__ssylka" href={`${BASE}/opornye-zadachi/${o.id}/`}>
                    <span className="z18-plitka__mini">
                      <OpornayaMini18 id={o.id} nazvanie={o.nazvanie} />
                    </span>
                    <span className="z18-plitka__niz">
                      <span className="z18-plitka__no">{o.no}</span>
                      <span className="z18-plitka__nazvanie">{o.nazvanie}</span>
                    </span>
                    <span className="z18-op-plitka__a">
                      <span className="z18-op-plitka__punkt">а)</span> <Tex text={o.a} />
                    </span>
                    <span className="z18-plitka__status">
                      <StatusOpornoy18 id={o.id} />
                      <span className="z18-plitka__otkryt">{OPORNYE_18_UI.otkryt} ›</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
