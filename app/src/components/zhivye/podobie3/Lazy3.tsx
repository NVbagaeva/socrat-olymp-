'use client';

import { ZhivayaLazy } from '../ZhivayaLazy';

const zPodobie = () => import('./Podobie');

export function PodobieLazy() {
  return (
    <ZhivayaLazy
      zagruzit={zPodobie}
      zagruzka="Сцена загружается…"
      vysota={{ uzko: 720, shiroko: 780 }}
    />
  );
}
