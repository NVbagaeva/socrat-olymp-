import Link from 'next/link';
import { Badge } from '@/components/ui';
import { GLAVY_19 } from '@/content/teoriya19';
import { BLOKI_19, O_ZADANII_19 } from '@/content/zadanie19';

/**
 * Вкладка «О задании» задания №19: что требуется в задании и план
 * глав теории со ссылками на каждую. Главы «Скоро» — без ссылки.
 */
export function OZadanii19({ base }: { base: string }) {
  return (
    <div className="z16-about z19-about">
      <section className="z16-about__lead">
        <h2 className="t-h2">{O_ZADANII_19.title}</h2>
        <p className="z16-about__answer">{O_ZADANII_19.lead}</p>
        <p className="z16-about__text">{O_ZADANII_19.about}</p>
      </section>
      <section aria-labelledby="z19-plan-title">
        <h3 className="t-h4" id="z19-plan-title">
          {O_ZADANII_19.plan}
        </h3>
        <ol className="z16-plan">
          {GLAVY_19.map((g, i) => {
            const title =
              g.metod === undefined ? g.title : `${BLOKI_19.metod(g.metod)}. ${g.title}`;
            return (
              <li className="z16-plan__item" key={g.id}>
                <span className="z16-plan__no" aria-hidden="true">
                  {i + 1}
                </span>
                {g.skoro ? (
                  <span className="z16-plan__title">{title}</span>
                ) : (
                  <Link className="z16-plan__title" href={`${base}/teoriya/#teoriya-${g.id}`}>
                    {title}
                  </Link>
                )}
                {g.skoro ? <Badge tone="neutral">{BLOKI_19.skoro}</Badge> : null}
              </li>
            );
          })}
        </ol>
        <Link className="btn btn--primary" href={`${base}/teoriya/`}>
          {O_ZADANII_19.kTeorii}
        </Link>
      </section>
    </div>
  );
}
