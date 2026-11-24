'use client';

import { ZhivayaLazy } from '../ZhivayaLazy';

const zOtrezok = () => import('./Otrezok');

export function OtrezokLazy() {
  return (
    <ZhivayaLazy
      zagruzit={zOtrezok}
      zagruzka="Сцена загружается…"
      vysota={{ uzko: 900, shiroko: 760 }}
    />
  );
}
