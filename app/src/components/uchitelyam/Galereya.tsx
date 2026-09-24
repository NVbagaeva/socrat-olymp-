'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui';
import { CELI, uchitelyam } from '@/content/uchitelyam';
import { cel } from '@/lib/metrika';

const { galereya: g } = uchitelyam;
type Item = (typeof g.items)[number];

/** Экран 4. Миниатюры готовых листов; по нажатию — лист крупно и ссылка на PDF. */
export function Galereya() {
  const [otkryt, setOtkryt] = useState<Item | null>(null);

  return (
    <section className="band band--soft" id="primery" aria-labelledby="gal-title">
      <div className="wrap">
        <div className="band__head">
          <h2 id="gal-title">{g.title}</h2>
          <p>{g.lead}</p>
        </div>
        <ul className="svc-gal">
          {g.items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="svc-gal__btn"
                aria-label={`${g.uvelichit}: ${item.podpis}`}
                onClick={() => {
                  setOtkryt(item);
                  cel(CELI.primer, { chto: item.id });
                }}
              >
                <img
                  src={item.kartinka}
                  alt=""
                  width="900"
                  height="1273"
                  loading="lazy"
                  decoding="async"
                />
              </button>
              <p className="svc-gal__cap">{item.podpis}</p>
            </li>
          ))}
        </ul>
      </div>
      <Modal
        open={otkryt !== null}
        onClose={() => setOtkryt(null)}
        title={otkryt?.podpis ?? ''}
        closeLabel={g.zakryt}
        className="svc-gal__modal"
        footer={
          otkryt ? (
            <a className="btn btn--secondary" href={otkryt.pdf} target="_blank" rel="noopener">
              {g.otkryt}
            </a>
          ) : null
        }
      >
        {otkryt ? <img className="svc-gal__big" src={otkryt.kartinka} alt={otkryt.podpis} /> : null}
      </Modal>
    </section>
  );
}
