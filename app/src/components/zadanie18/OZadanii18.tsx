import Link from 'next/link';
import { Badge, Callout } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { O_ZADANII_18, ZADANIE18 } from '@/content/zadanie18';
import { ZADANIYA } from '@/lib/paths';

const BASE = `${ZADANIYA}/${ZADANIE18.slug}`;

/* Наполненные вкладки: остальные в маршруте — «Скоро», без ссылки. */
const GOTOVY: ReadonlySet<string> = new Set(['skhemy', 'kartochki', 'teoriya', 'opornye']);

function vkladka(id: string) {
  return ZADANIE18.tabs.find((t) => t.id === id);
}

/**
 * Вкладка «О задании» №18: что требуется в пунктах а) и б), критерии
 * ФИПИ (0–3 балла), зачем ключевые схемы и маршрут по вкладкам
 * раздела. Устроена как «О задании» №16 и №19, но подробнее: у
 * задачи на доказательство критерии важнее, чем у задачи с ответом.
 */
export function OZadanii18() {
  const T = O_ZADANII_18;
  return (
    <div className="z18-about">
      <section className="z18-about__lead">
        <h2 className="t-h2">{T.title}</h2>
        <p className="z18-about__answer">{T.lead}</p>
        {T.about.map((a, i) => (
          <p className="z18-about__text" key={i}>
            {a}
          </p>
        ))}
      </section>

      <ul className="z18-chasti">
        {T.chasti.map((c) => (
          <li className="z18-chasti__item" key={c.punkt}>
            <p className="z18-chasti__title">
              <span className="z18-chasti__punkt">{c.punkt}</span> {c.title}
            </p>
            <p className="z18-chasti__text">
              <Tex text={c.text} />
            </p>
          </li>
        ))}
      </ul>

      <section aria-labelledby="z18-kriterii-title">
        <h3 className="t-h4" id="z18-kriterii-title">
          {T.kriteriiTitle}
        </h3>
        <p className="z18-about__text">{T.kriteriiLead}</p>
        <ol className="z18-kriterii">
          {T.kriterii.map((k) => (
            <li className="z18-kriterii__item" key={k.ball}>
              <span className="z18-kriterii__ball">{T.ballov(k.ball)}</span>
              <span className="z18-kriterii__text">
                <Tex text={k.text} />
              </span>
            </li>
          ))}
        </ol>
        <Callout tone="layfhak" label={T.strategiya.label}>
          <p>{T.strategiya.text}</p>
        </Callout>
      </section>

      <section aria-labelledby="z18-skhemy-title" className="z18-about__lead">
        <h3 className="t-h4" id="z18-skhemy-title">
          {T.skhemyTitle}
        </h3>
        {T.skhemy.map((a, i) => (
          <p className="z18-about__text" key={i}>
            <Tex text={a} />
          </p>
        ))}
      </section>

      <section aria-labelledby="z18-marshrut-title">
        <h3 className="t-h4" id="z18-marshrut-title">
          {T.marshrutTitle}
        </h3>
        <ol className="z18-marshrut">
          {T.marshrut.map((m, i) => {
            const tab = vkladka(m.tab);
            if (tab === undefined) return null;
            const gotova = GOTOVY.has(m.tab);
            return (
              <li className="z18-marshrut__item" key={m.tab}>
                <span className="z18-marshrut__no" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="z18-marshrut__telo">
                  <span className="z18-marshrut__title">
                    {gotova ? <Link href={`${BASE}/${tab.tail}`}>{tab.label}</Link> : tab.label}
                    {gotova ? null : <Badge tone="neutral">{T.skoro}</Badge>}
                  </span>
                  <span className="z18-marshrut__text">{m.text}</span>
                </span>
              </li>
            );
          })}
        </ol>
        <Link className="btn btn--primary" href={`${BASE}/skhemy/`}>
          {T.kSkhemam}
        </Link>
      </section>
    </div>
  );
}
