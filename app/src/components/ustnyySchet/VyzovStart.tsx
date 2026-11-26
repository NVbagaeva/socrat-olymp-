'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { USTNYY } from '@/content/ustnyySchet';

const T = USTNYY.vitrina.vyzov;

/* Движок, KaTeX и сам вызов — отдельным куском, только по нажатию. */
const Vyzov10 = dynamic(() => import('./Vyzov10').then((m) => m.Vyzov10), {
  ssr: false,
  loading: () => (
    <p className="us-vyzov__zagruzka" role="status">
      {T.zagruzka}
    </p>
  ),
});

/** «Реши за 10 секунд» в шапке: кнопка, по нажатию — пример. */
export function VyzovStart() {
  const [otkryt, setOtkryt] = useState(false);
  if (otkryt) return <Vyzov10 />;
  return (
    <div className="us-vyzov us-vyzov--start">
      <button
        type="button"
        className="btn btn--secondary us-vyzov__start"
        onClick={() => setOtkryt(true)}
      >
        <span aria-hidden="true" className="us-vyzov__ikonka">
          ⏱
        </span>
        {T.knopka}
      </button>
      <span className="us-vyzov__lead">{T.lead}</span>
    </div>
  );
}
