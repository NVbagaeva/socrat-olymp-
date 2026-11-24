'use client';

import { ZhivayaLazy } from '../ZhivayaLazy';

const zKredit = () => import('./Kredit');

export function KreditLazy() {
  return (
    <ZhivayaLazy
      zagruzit={zKredit}
      zagruzka="Сцена загружается…"
      vysota={{ uzko: 760, shiroko: 700 }}
    />
  );
}
