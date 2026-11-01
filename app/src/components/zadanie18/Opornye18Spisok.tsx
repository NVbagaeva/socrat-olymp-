import Link from 'next/link';
import { Tex } from '@/components/ui/Tex';
import { ZADANIE18 } from '@/content/zadanie18';
import { OPORNYE_18, OPORNYE_18_UI } from '@/content/zadanie18/opornye';
import { skhema18 } from '@/content/zadanie18/spisok';
import { ZADANIYA } from '@/lib/paths';
import { ChertezhOpornoy18 } from './ChertezhOpornoy18';

const BASE = `${ZADANIYA}/${ZADANIE18.slug}`;

/** Вкладка «Опорные задачи»: вводный абзац и плитки задач с мини-чертежом и схемами. */
export function Opornye18Spisok() {
  return (
    <section className="z18-op-spisok" aria-labelledby="z18-op-title">
      <h2 id="z18-op-title" className="t-h2">
        {ZADANIE18.tabs.find((t) => t.id === 'opornye')?.label}
      </h2>
      <p className="z18-op-spisok__lead">{OPORNYE_18_UI.lead}</p>
      <ul className="z18-plitki">
        {OPORNYE_18.map((z) => (
          <li key={z.id} className="z18-plitka">
            <Link className="z18-plitka__ssylka" href={`${BASE}/opornye-zadachi/${z.id}/`}>
              <span className="z18-plitka__mini">
                <ChertezhOpornoy18 id={z.id} opisanie={z.nazvanie} mini />
              </span>
              <span className="z18-plitka__niz">
                <span className="z18-plitka__no">{z.no}</span>
                <span className="z18-plitka__nazvanie">{z.nazvanie}</span>
              </span>
              <span className="z18-op-plitka__uslovie">
                <Tex text={z.uslovie} />
              </span>
              <span className="z18-plitka__status">
                <span className="z18-op-plitka__skhemy">
                  {z.skhemy
                    .map((id) => skhema18(id)?.no)
                    .filter(Boolean)
                    .map((n) => `Схема ${n}`)
                    .join(' · ')}
                </span>
                <span className="z18-plitka__otkryt">{OPORNYE_18_UI.otkryt} ›</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
