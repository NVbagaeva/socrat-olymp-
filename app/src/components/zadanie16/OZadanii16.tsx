import Link from 'next/link';
import { Badge } from '@/components/ui';
import { BLOKI_16, GLAVY_16 } from '@/content/teoriya16';
import { O_ZADANII_16 } from '@/content/zadanie16';

/**
 * Вкладка «О задании» задания №16: что требуется в задании и план
 * глав теории со ссылками на каждую. Главы «Скоро» — без ссылки.
 */
export function OZadanii16({ base }: { base: string }) {
  return (
    <div className="z16-about">
      <section className="z16-about__lead">
        <h2 className="t-h2">{O_ZADANII_16.title}</h2>
        <p className="z16-about__answer">{O_ZADANII_16.lead}</p>
        <p className="z16-about__text">{O_ZADANII_16.about}</p>
      </section>
      <section aria-labelledby="z16-plan-title">
        <h3 className="t-h4" id="z16-plan-title">
          {O_ZADANII_16.plan}
        </h3>
        <ol className="z16-plan">
          {GLAVY_16.map((g, i) => (
            <li className="z16-plan__item" key={g.id}>
              <span className="z16-plan__no" aria-hidden="true">
                {i + 1}
              </span>
              {g.skoro ? (
                <span className="z16-plan__title">{g.title}</span>
              ) : (
                <Link className="z16-plan__title" href={`${base}/teoriya/#teoriya-${g.id}`}>
                  {g.title}
                </Link>
              )}
              {g.skoro ? <Badge tone="neutral">{BLOKI_16.skoro}</Badge> : null}
            </li>
          ))}
        </ol>
        <Link className="btn btn--primary" href={`${base}/teoriya/`}>
          {O_ZADANII_16.kTeorii}
        </Link>
      </section>
    </div>
  );
}
