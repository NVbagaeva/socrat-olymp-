'use client';

import { useId, useState } from 'react';
import { TARIFY } from '@/content/tarify';
import { SRAVNENIE, type Yacheyka } from '@/lib/tarify/config';

function Znachenie({ value }: { value: Yacheyka }) {
  const { vhodit, neVhodit } = TARIFY.sravnenie;
  if (value === true) {
    return (
      <svg
        className="tf-sr__znak tf-sr__znak--da"
        viewBox="0 0 20 20"
        role="img"
        aria-label={vhodit}
      >
        <path d="M4.5 10.5l3.5 3.5 7.5-8" />
      </svg>
    );
  }
  if (value === false) {
    return (
      <svg
        className="tf-sr__znak tf-sr__znak--net"
        viewBox="0 0 20 20"
        role="img"
        aria-label={neVhodit}
      >
        <path d="M6 10h8" />
      </svg>
    );
  }
  return <span className="tf-sr__tekst">{value}</span>;
}

/**
 * Таблица «Что входит». На широком экране открыта всегда. На телефоне
 * свёрнута под кнопкой, листается вбок, первый столбец закреплён.
 */
export function Sravnenie() {
  const [otkryta, setOtkryta] = useState(false);
  const id = useId();
  const { sravnenie } = TARIFY;
  const k = sravnenie.kolonki;

  return (
    <section className="tf-sr tf-sekciya" aria-labelledby={`${id}-z`} data-otkryta={otkryta}>
      <h2 id={`${id}-z`} className="tf-sekciya__zagolovok">
        {sravnenie.zagolovok}
      </h2>
      <button
        type="button"
        className="tf-sr__knopka"
        aria-expanded={otkryta}
        aria-controls={`${id}-t`}
        onClick={() => setOtkryta(!otkryta)}
      >
        {otkryta ? sravnenie.svernut : sravnenie.raskryt}
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div className="tf-sr__telo" id={`${id}-t`}>
        <div className="tf-sr__obertka" tabIndex={0} role="region" aria-labelledby={`${id}-z`}>
          <table className="tf-sr__tablica">
            <thead>
              <tr>
                <th scope="col">{k.vozmozhnost}</th>
                <th scope="col">{k.besplatno}</th>
                <th scope="col">{k.uchenik}</th>
                <th scope="col">{k.repetitor}</th>
              </tr>
            </thead>
            <tbody>
              {SRAVNENIE.map((stroka) => (
                <tr key={stroka.vozmozhnost}>
                  <th scope="row">{stroka.vozmozhnost}</th>
                  <td>
                    <Znachenie value={stroka.besplatno} />
                  </td>
                  <td>
                    <Znachenie value={stroka.uchenik} />
                  </td>
                  <td>
                    <Znachenie value={stroka.repetitor} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="tf-sr__snoska">{sravnenie.snoska}</p>
      </div>
    </section>
  );
}
