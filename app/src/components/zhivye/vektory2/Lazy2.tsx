'use client';

import { ZhivayaLazy } from '../ZhivayaLazy';

const zDeystviya = () => import('./Deystviya');

export function DeystviyaLazy() {
  return (
    <ZhivayaLazy
      zagruzit={zDeystviya}
      zagruzka="Сцена загружается…"
      vysota={{ uzko: 720, shiroko: 760 }}
    />
  );
}
