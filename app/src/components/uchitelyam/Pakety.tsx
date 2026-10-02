'use client';

import { CELI, uchitelyam } from '@/content/uchitelyam';
import { cel } from '@/lib/metrika';
import { Cel } from './Cel';
import { useZakaz } from './ZakazProvider';

const { pakety: p } = uchitelyam;

/** Экран 5, первая половина: четыре пакета. Кнопка пакета настраивает калькулятор. */
export function Pakety() {
  const { izmenit } = useZakaz();
  return (
    <section className="band" id="ceny" aria-labelledby="ceny-title">
      <div className="wrap">
        <div className="band__head">
          <h2 id="ceny-title">{p.title}</h2>
          <p>{p.lead}</p>
          <Cel name={CELI.ceny} />
        </div>
        <ul className="svc-pakety">
          {p.items.map((item) => (
            <li className="svc-paket" key={item.id}>
              <h3>{item.nazvanie}</h3>
              <p className="svc-paket__cena">{item.cena}</p>
              <p className="svc-paket__srok">{item.srok}</p>
              <p className="svc-paket__kto">{item.dlyaKogo}</p>
              <p className="svc-paket__label">{p.vhoditTitle}</p>
              <ul className="svc-paket__list">
                {item.vhodit.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p className="svc-paket__label">{p.neVhoditTitle}</p>
              <ul className="svc-paket__list svc-paket__list--net">
                {item.neVhodit.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <a
                className="btn btn--secondary svc-paket__btn"
                href="#raschet"
                onClick={() => {
                  izmenit({ ...item.preset, srochnost: 'bazovyy' });
                  cel(CELI.kalkulyator, { paket: item.id });
                }}
              >
                {p.zakazat}
              </a>
            </li>
          ))}
        </ul>
        <p className="svc-note-line">{p.vsegda}</p>
        <p className="svc-note-line">{p.neVsegda}</p>
      </div>
    </section>
  );
}
