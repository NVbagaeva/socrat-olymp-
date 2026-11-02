import Link from 'next/link';
import { Badge } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { katex } from '@/lib/graph/katex';
import { O_ZADANII_14, SKORO_14, TIPY_14 } from '@/content/zadanie14';

function formula(tex: string): string {
  return katex.renderToString(tex, { throwOnError: true, displayFrac: true } as never);
}

/**
 * Вкладка «О задании» №14: формат (пункты а и б), критерии ФИПИ
 * таблицей и карточки типов уравнений. Каждая карточка ведёт к своей
 * главе теории; готова тригонометрия, остальные помечены «Скоро».
 * У комбинированных — четыре подтипа.
 */
export function OZadanii14({ base }: { base: string }) {
  const T = O_ZADANII_14;
  return (
    <div className="z14-about flow">
      <section className="z14-about__lead flow">
        <h2 className="t-h2">{T.title}</h2>
        <p className="z14-about__answer">{T.lead}</p>
        <ul className="z14-about__format">
          {T.format.map((f) => (
            <li key={f}>
              <Tex text={f} />
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="z14-kriterii" className="flow">
        <h3 className="t-h4" id="z14-kriterii">
          {T.kriteriiTitle}
        </h3>
        <table className="z14-kriterii">
          <thead>
            <tr>
              <th scope="col">Баллы</th>
              <th scope="col">Что сделано</th>
            </tr>
          </thead>
          <tbody>
            {T.kriterii.map((k) => (
              <tr key={k.bally}>
                <th scope="row">{k.bally}</th>
                <td>
                  <Tex text={k.text} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="z14-about__note">{T.kriteriiNote}</p>
      </section>
      <section aria-labelledby="z14-tipy" className="flow">
        <h3 className="t-h4" id="z14-tipy">
          {T.tipyTitle}
        </h3>
        <p>{T.tipyLead}</p>
        <ul className="z14-tipy">
          {TIPY_14.map((t) => (
            <li key={t.id} className={`z14-tip${t.gotovo ? '' : ' z14-tip--skoro'}`}>
              <Link className="z14-tip__link" href={`${base}/teoriya/#teoriya-${t.id}`}>
                <span className="z14-tip__head">
                  <span className="z14-tip__title">{t.title}</span>
                  {t.gotovo ? null : <Badge tone="neutral">{SKORO_14}</Badge>}
                </span>
                <span
                  className="z14-tip__primer"
                  dangerouslySetInnerHTML={{ __html: formula(t.primer) }}
                />
                <span className="z14-tip__text">{t.text}</span>
                {t.podtipy === undefined ? null : (
                  <span className="z14-tip__podtipy">
                    {t.podtipy.map((p) => (
                      <span key={p.id} className="z14-tip__podtip">
                        {p.title}
                      </span>
                    ))}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
        <Link className="btn btn--primary" href={`${base}/teoriya/`}>
          {T.kTeorii}
        </Link>
      </section>
    </div>
  );
}
