import Link from 'next/link';
import { landing } from '@/content/landing';
import { PLATNYE, rubli, TARIFY_HREF } from '@/lib/tarify/config';

/**
 * Короткий блок цен на главной: три стеклянные плашки — бесплатно,
 * «Ученик», «Репетитор» — и ссылка на все тарифы. Не страница тарифов:
 * только что даёт бесплатный доступ и что полный. Цены за 30 дней — из
 * lib/tarify/config.ts; цена «До ЕГЭ» зависит от даты покупки и живёт
 * только на /tarify/.
 */
export function TarifyKratko() {
  const t = landing.tarifyKratko;
  const karty = [
    {
      id: 'besplatno',
      nazvanie: t.besplatno.nazvanie,
      tsena: rubli(0),
      podpis: t.besplatno.podpis,
      punkty: t.besplatno.punkty,
    },
    {
      id: 'uchenik',
      nazvanie: PLATNYE.uchenik.nazvanie,
      tsena: rubli(PLATNYE.uchenik.tsena30),
      podpis: t.uchenik.podpis,
      punkty: t.uchenik.punkty,
    },
    {
      id: 'repetitor',
      nazvanie: PLATNYE.repetitor.nazvanie,
      tsena: rubli(PLATNYE.repetitor.tsena30),
      podpis: t.repetitor.podpis,
      punkty: t.repetitor.punkty,
    },
  ];
  return (
    <section className="band tk" id="tarify-kratko" aria-labelledby="tk-z">
      <div className="wrap">
        <div className="band__head">
          <h2 id="tk-z">{t.title}</h2>
          <p>{t.lead}</p>
        </div>
        <ul className="tk__karty">
          {karty.map((k) => (
            <li key={k.id} className={`tk__karta tk__karta--${k.id}`}>
              <h3 className="tk__nazvanie">{k.nazvanie}</h3>
              <p className="tk__tsena">
                <b>{k.tsena}</b> <span>{k.podpis}</span>
              </p>
              <ul className="tk__punkty">
                {k.punkty.map((p) => (
                  <li key={p}>
                    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                      <path d="M4.5 10.5l3.5 3.5 7.5-8" />
                    </svg>
                    {p}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <div className="tk__niz">
          <Link className="btn btn--primary" href={TARIFY_HREF}>
            {t.vse}
          </Link>
          <span className="tk__ege">{t.doEge}</span>
        </div>
      </div>
    </section>
  );
}
