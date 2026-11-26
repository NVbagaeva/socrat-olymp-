'use client';

import { ZhivayaLazy } from '../ZhivayaLazy';

const zVpisannyy = () => import('./Vpisannyy');
const zSumma = () => import('./SummaUglov');

export function VpisannyyLazy() {
  return (
    <ZhivayaLazy
      zagruzit={zVpisannyy}
      zagruzka="Сцена загружается…"
      vysota={{ uzko: 640, shiroko: 640 }}
    />
  );
}

export function SummaUglovLazy() {
  return (
    <ZhivayaLazy
      zagruzit={zSumma}
      zagruzka="Сцена загружается…"
      vysota={{ uzko: 680, shiroko: 720 }}
    />
  );
}
