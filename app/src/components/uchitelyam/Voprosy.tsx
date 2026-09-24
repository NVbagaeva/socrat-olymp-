'use client';

import { Details } from '@/components/ui';
import { CELI, uchitelyam } from '@/content/uchitelyam';
import { cel } from '@/lib/metrika';

const { voprosy: t, neBeru } = uchitelyam;

/** Экраны 10 и 11: ответы на возражения и что не беру. */
export function Voprosy() {
  return (
    <section className="band" id="voprosy" aria-labelledby="voprosy-title">
      <div className="wrap split svc-voprosy">
        <div>
          <h2 className="svc-h2" id="voprosy-title">
            {t.title}
          </h2>
          <div className="svc-faq">
            {t.items.map((item, i) => (
              /* Details не сообщает о раскрытии, поэтому цель — на обёртке:
                 номер вопроса показывает, что тревожит (§7.2). */
              <div key={item.q} onClickCapture={() => cel(CELI.vopros, { nomer: i + 1 })}>
                <Details title={item.q}>
                  <p>{item.a}</p>
                </Details>
              </div>
            ))}
          </div>
        </div>
        <div className="svc-neberu">
          <h3>{neBeru.title}</h3>
          <ul>
            {neBeru.items.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
