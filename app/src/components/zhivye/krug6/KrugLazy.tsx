'use client';

import { ZhivayaLazy } from '../ZhivayaLazy';

const zKrug = () => import('./Krug');

export function KrugLazy() {
  return (
    <ZhivayaLazy
      zagruzit={zKrug}
      zagruzka="Сцена загружается…"
      vysota={{ uzko: 1180, shiroko: 860 }}
    />
  );
}
