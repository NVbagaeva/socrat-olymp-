import Link from 'next/link';
import { Details } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { O_ZADANII_13 } from '@/content/zadanie13';
import { SIGN } from '@/lib/zadanie13/proto/common';
import { TYPE_NAMES, type TypeCode } from '@/lib/zadanie13/types';
import { Razbor } from './Teoriya13';

/** Значок типа: лесенка долга, неровная лесенка, равные платежи, растущий вклад. */
function IkonkaTipa({ type }: { type: TypeCode }) {
  const stolbiki: Record<TypeCode, number[]> = {
    A: [20, 16, 12, 8, 4],
    B: [20, 20, 13, 9, 3],
    C: [9, 9, 9, 9, 9],
    D: [6, 9, 12, 16, 20],
  };
  return (
    <svg className="z13-about-tip__ikonka" viewBox="0 0 32 24" aria-hidden="true" focusable="false">
      {stolbiki[type].map((h, i) => (
        <rect key={i} x={2 + i * 6} y={22 - h} width="4" height={h} rx="1" />
      ))}
    </svg>
  );
}

const PRIZNAK = (type: TypeCode) => SIGN[type].charAt(0).toUpperCase() + SIGN[type].slice(1) + '.';

/**
 * Вкладка «О задании» задания №13 (02-design.md, § 7): что за задание
 * в КИМ-2027, четыре типа с признаком и разобранным примером (решение
 * считает движок на сборке, той же разметкой, что в теории), таблица
 * признаков «за 10 секунд» и «С чего начать».
 */
export function OZadanii13({ base }: { base: string }) {
  const o = O_ZADANII_13;
  return (
    <div className="z11-about z13-about">
      <div className="z11-about__main">
        <section className="z11-about__lead">
          <h2 className="t-h2 z11-about__title">{o.title}</h2>
          <p className="z11-about__answer">{o.lead}</p>
          <p className="z11-about__text">{o.kim}</p>
          <p className="z11-about__text">
            {o.demo}{' '}
            <a href={o.demoHref} target="_blank" rel="noopener noreferrer">
              {o.demoSsylka}
            </a>
            .
          </p>
          <p className="z13-about__edinicy">{o.edinicy}</p>
        </section>

        <section aria-labelledby="z13-about-tipy">
          <h3 className="t-h4 z11-about__sub" id="z13-about-tipy">
            {o.tipyTitle}
          </h3>
          <p className="z11-about__text">{o.tipyLead}</p>
          <ul className="z13-about-tipy">
            {o.tipy.map((t, i) => (
              <li key={t.type} className="z13-about-tip">
                <div className="z13-about-tip__head">
                  <span className="z13-about-tip__no" aria-hidden="true">
                    {i + 1}
                  </span>
                  <IkonkaTipa type={t.type} />
                  <h4 className="z13-about-tip__title">{TYPE_NAMES[t.type]}</h4>
                </div>
                <p className="z13-about-tip__priznak">{PRIZNAK(t.type)}</p>
                <div className="z13-about-tip__links">
                  <Link href={`${base}/teoriya/#teoriya-${t.glava}`}>{o.teoriya}</Link>
                  <Link href={`${base}/opornye-zadachi/${t.blok}/`}>{o.opornye}</Link>
                </div>
                <Details title={o.primer} className="z13-about-tip__primer">
                  <Razbor {...t.primer} />
                </Details>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="z13-about-priznaki">
          <h3 className="t-h4 z11-about__sub" id="z13-about-priznaki">
            {o.priznakiTitle}
          </h3>
          <div className="z13-about-priznaki">
            <table>
              <thead>
                <tr>
                  {o.priznakiHead.map((h) => (
                    <th key={h} scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {o.priznaki.map((r) => (
                  <tr key={r.type}>
                    <td>
                      <Tex text={r.vizhu} />
                    </td>
                    <th scope="row">{TYPE_NAMES[r.type]}</th>
                    <td>{r.pochemu}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="z13-about__skoro">{o.optimizaciya}</p>
      </div>

      <aside className="z11-start" aria-labelledby="z13-start-title">
        <h3 className="z11-start__title" id="z13-start-title">
          {o.start.title}
        </h3>
        <ol className="z11-start__list">
          {o.start.shagi.map((shag, i) => (
            <li className="z11-start__step" key={shag.title}>
              <span className="z11-start__no" aria-hidden="true">
                {i + 1}
              </span>
              <span>
                <Link className="z11-start__step-title" href={`${base}/${shag.tail}`}>
                  {shag.title}
                </Link>
                <span className="z11-start__step-text">{shag.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
