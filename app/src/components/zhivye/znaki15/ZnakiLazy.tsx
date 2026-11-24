'use client';

import { ZhivayaLazy } from '../ZhivayaLazy';

const zZnaki = () => import('./Znaki');

export function ZnakiLazy() {
  return (
    <ZhivayaLazy
      zagruzit={zZnaki}
      zagruzka="Сцена загружается…"
      vysota={{ uzko: 820, shiroko: 720 }}
    />
  );
}
